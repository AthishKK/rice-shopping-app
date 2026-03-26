const Return = require("../models/Return");
const Order = require("../models/Order");

// User: submit a return request
exports.createReturn = async (req, res) => {
  try {
    const { orderId, productName, reason, description } = req.body;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, userId, status: "Delivered" });
    if (!order) return res.status(403).json({ message: "Order not found or not delivered" });

    // Prevent duplicate return for same order+product
    const existing = await Return.findOne({ orderId, userId, productName });
    if (existing) return res.status(400).json({ message: "Return already requested for this item" });

    const ret = await Return.create({ orderId, userId, productName, reason, description });
    res.status(201).json({ message: "Return request submitted", return: ret });
  } catch (err) {
    console.error("Create return error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// User: get their returns
exports.getUserReturns = async (req, res) => {
  try {
    const userId = req.user.userId;
    const returns = await Return.find({ userId })
      .populate("orderId", "totalAmount createdAt paymentMethod")
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get all returns
exports.getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("userId", "name email")
      .populate("orderId", "totalAmount createdAt paymentMethod")
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get single return details
exports.getReturnDetails = async (req, res) => {
  try {
    const ret = await Return.findById(req.params.returnId)
      .populate("userId", "name email")
      .populate("orderId");
    if (!ret) return res.status(404).json({ message: "Return not found" });
    res.json(ret);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: update return status
exports.updateReturnStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ["Requested", "Approved", "Rejected", "Pickup Scheduled", "Picked Up", "Refund Processed", "Replacement Shipped"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const ret = await Return.findByIdAndUpdate(
      req.params.returnId,
      { status, adminNote, updatedAt: Date.now() },
      { new: true }
    );
    if (!ret) return res.status(404).json({ message: "Return not found" });
    res.json({ message: "Return status updated", return: ret });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get return analytics
exports.getReturnAnalytics = async (req, res) => {
  try {
    const [totalReturns, statusBreakdown, refundStats, monthlyReturns] = await Promise.all([
      // Total returns count
      Return.countDocuments(),
      
      // Returns by status
      Return.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      // Refund statistics
      Return.aggregate([
        {
          $match: {
            status: { $in: ["Refund Processed", "Replacement Shipped"] }
          }
        },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order"
          }
        },
        { $unwind: "$order" },
        {
          $group: {
            _id: null,
            totalRefunded: { $sum: "$order.totalAmount" },
            refundCount: { $sum: 1 }
          }
        }
      ]),
      
      // Monthly return trends
      Return.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
    ]);

    const refundData = refundStats[0] || { totalRefunded: 0, refundCount: 0 };
    
    res.json({
      totalReturns,
      statusBreakdown,
      totalRefunded: refundData.totalRefunded,
      totalRefundCount: refundData.refundCount,
      monthlyReturns
    });
  } catch (err) {
    console.error("Return analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
