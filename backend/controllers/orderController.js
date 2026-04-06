const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { calculateDeliveryDate, generateOrderId, calculateRicePoints } = require("../utils/helpers");
const { reduceStock, restoreStock, checkStockAvailability } = require("../services/stockService");
const { sendOrderConfirmationEmail, sendOrderConfirmationSMS, sendOrderStatusUpdateEmail } = require("../services/notificationService");

exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, deliveryAddress, ricePointsUsed, ricePointsDiscount } = req.body;
    const userId = req.user.userId;

    // Validate rice points usage
    if (ricePointsUsed > 0) {
      const user = await User.findById(userId);
      if (!user || user.ricePoints < ricePointsUsed) {
        return res.status(400).json({
          message: `Insufficient rice points. You have ${user?.ricePoints || 0} points but tried to use ${ricePointsUsed}.`
        });
      }
    }

    // Resolve productIds — frontend may send static number IDs, look up real DB ObjectId by name
    const resolvedItems = await Promise.all(items.map(async (item) => {
      let dbProductId = item.productId;
      const isValidObjectId = /^[a-f\d]{24}$/i.test(String(item.productId));
      if (!isValidObjectId) {
        // Try to find by item name first, then fall back to any product
        const lookupName = item.name;
        if (lookupName) {
          const product = await Product.findOne({ name: lookupName });
          if (product) dbProductId = product._id;
          else {
            // For free items the name may differ — try to find any product to satisfy the ObjectId requirement
            const anyProduct = await Product.findOne();
            if (anyProduct) dbProductId = anyProduct._id;
          }
        }
      }
      return { ...item, productId: dbProductId };
    }));

    // Check stock availability for all items (including free items)
    for (let item of resolvedItems) {
      // Check stock for all items, including free items from limited offers
      const stockCheck = await checkStockAvailability(
        item.productId,
        item.ageCategory,
        item.weight,
        item.quantity
      );
      if (!stockCheck.available) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name || 'product'} (${item.ageCategory}, ${item.weight}). ${stockCheck.message}`
        });
      }
    }

    // Calculate estimated delivery
    const estimatedDelivery = calculateDeliveryDate(deliveryAddress.pincode);

    // Create order
    const order = await Order.create({
      userId,
      items: resolvedItems,
      totalAmount,
      ricePointsUsed: ricePointsUsed || 0,
      ricePointsDiscount: ricePointsDiscount || 0,
      paymentMethod,
      deliveryAddress,
      estimatedDelivery
    });

    // Calculate rice points to add (from purchase) and subtract (from usage)
    const ricePointsEarned = calculateRicePoints(totalAmount);
    const netRicePointsChange = ricePointsEarned - (ricePointsUsed || 0);
    
    // Update user rice points
    await User.findByIdAndUpdate(userId, { $inc: { ricePoints: netRicePointsChange } });

    // Reduce stock (including free items from limited offers)
    try {
      for (let item of resolvedItems) {
        // Reduce stock for all items, including free items from limited offers
        // Free items still consume stock inventory
        await reduceStock(item.productId, item.ageCategory, item.weight, item.quantity);
      }
    } catch (stockError) {
      await Order.findByIdAndDelete(order._id);
      throw new Error(`Stock reduction failed: ${stockError.message}`);
    }

    // Send order confirmation notifications
    try {
      const user = await User.findById(userId);
      if (user) {
        const orderDetails = {
          orderId: order._id.toString().slice(-8).toUpperCase(),
          orderDate: order.createdAt,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          estimatedDelivery: order.estimatedDelivery,
          items: resolvedItems.map(item => ({
            name: item.name,
            ageCategory: item.ageCategory,
            weight: item.weight,
            quantity: item.quantity,
            price: item.price
          })),
          deliveryAddress: order.deliveryAddress
        };

        // Send email notification
        if (user.email) {
          await sendOrderConfirmationEmail(user.email, user.name, orderDetails);
        }

        // Send SMS notification
        if (deliveryAddress.phone) {
          await sendOrderConfirmationSMS(deliveryAddress.phone, user.name, orderDetails);
        }
      }
    } catch (notificationError) {
      console.error('Failed to send order confirmation notifications:', notificationError);
      // Don't fail the order creation if notifications fail
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
      ricePointsEarned,
      ricePointsUsed: ricePointsUsed || 0,
      netRicePointsChange,
      orderId: generateOrderId()
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ userId, hiddenFromUser: { $ne: true } })
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId', 'name images category')
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send status update notification
    try {
      if (order.userId && order.userId.email) {
        const orderDetails = {
          orderId: order._id.toString().slice(-8).toUpperCase(),
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod
        };
        
        await sendOrderStatusUpdateEmail(
          order.userId.email, 
          order.userId.name, 
          orderDetails, 
          status
        );
      }
    } catch (notificationError) {
      console.error('Failed to send order status update notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.json({
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === 'Shipped' || order.status === 'Delivered') {
      return res.status(400).json({ message: "Cannot cancel shipped or delivered order" });
    }

    // Update order status
    order.status = 'Cancelled';
    await order.save();

    // Restore stock using the new stock system
    for (let item of order.items) {
      try {
        await restoreStock(item.productId, item.ageCategory, item.weight, item.quantity);
      } catch (stockError) {
        console.error(`Failed to restore stock for item ${item.productId}:`, stockError);
      }
    }

    // Deduct rice points
    const ricePoints = calculateRicePoints(order.totalAmount);
    await User.findByIdAndUpdate(userId, {
      $inc: { ricePoints: -ricePoints }
    });

    res.json({
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('items.productId', 'name')
      .select('status createdAt estimatedDelivery items totalAmount');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Generate tracking timeline
    const timeline = [];
    const orderDate = order.createdAt;

    timeline.push({
      status: 'Placed',
      date: orderDate,
      completed: true,
      description: 'Order placed successfully'
    });

    if (['Processing', 'Shipped', 'Delivered'].includes(order.status)) {
      const processingDate = new Date(orderDate);
      processingDate.setHours(processingDate.getHours() + 2);
      timeline.push({
        status: 'Processing',
        date: processingDate,
        completed: true,
        description: 'Order is being processed'
      });
    }

    if (['Shipped', 'Delivered'].includes(order.status)) {
      const shippedDate = new Date(orderDate);
      shippedDate.setDate(shippedDate.getDate() + 1);
      timeline.push({
        status: 'Shipped',
        date: shippedDate,
        completed: true,
        description: 'Order has been shipped'
      });
    }

    if (order.status === 'Delivered') {
      timeline.push({
        status: 'Delivered',
        date: order.estimatedDelivery,
        completed: true,
        description: 'Order delivered successfully'
      });
    } else {
      timeline.push({
        status: 'Delivered',
        date: order.estimatedDelivery,
        completed: false,
        description: 'Estimated delivery date'
      });
    }

    res.json({
      order: {
        id: order._id,
        status: order.status,
        items: order.items,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDelivery
      },
      timeline
    });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear order history for user (hide from user view but keep for admin)
exports.clearOrderHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Mark all user orders as hidden from user view
    const result = await Order.updateMany(
      { userId },
      { hiddenFromUser: true }
    );

    res.json({
      message: "Order history cleared successfully",
      clearedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Clear order history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Hide specific order from user view
exports.hideOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, userId },
      { hiddenFromUser: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order hidden from your view",
      order
    });
  } catch (error) {
    console.error("Hide order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};