const Product = require("../models/Product");
const Stock = require("../models/Stock");
const Order = require("../models/Order");
const User = require("../models/User");
const Offer = require("../models/Offer");
const Festival = require("../models/Festival");
const MarketPrice = require("../models/MarketPrice");
const { updateMarketPrice, applyDynamicPricing } = require("../services/marketService");
const { createFlashSale, setFlashSaleProducts, applyFestivalDiscount, getCurrentFestival } = require("../services/festivalService");

// ── Stock Management ───────────────────────────────────────────────────────

exports.getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find({}).populate('productId', 'name basePremium category').sort({ productId: 1, ageCategory: 1, weight: 1 });
    res.json(stocks);
  } catch (err) {
    console.error('Get stocks error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { productId, ageCategory, weight, quantity } = req.body;
    
    if (!productId || !ageCategory || !weight || quantity === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const stock = await Stock.findOneAndUpdate(
      { productId, ageCategory, weight },
      { quantity: Math.max(0, parseInt(quantity)), lastUpdated: new Date() },
      { upsert: true, new: true }
    ).populate('productId', 'name');

    res.json({ message: "Stock updated successfully", stock });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.bulkUpdateStocks = async (req, res) => {
  try {
    const { stocks } = req.body;
    
    if (!stocks || !Array.isArray(stocks)) {
      return res.status(400).json({ message: "Stocks array is required" });
    }

    const bulkOps = stocks.map(stock => ({
      updateOne: {
        filter: { 
          productId: stock.productId, 
          ageCategory: stock.ageCategory, 
          weight: stock.weight 
        },
        update: { 
          quantity: Math.max(0, parseInt(stock.quantity) || 0), 
          lastUpdated: new Date() 
        },
        upsert: true
      }
    }));

    const result = await Stock.bulkWrite(bulkOps);
    
    console.log(`Stock bulk update completed: ${result.modifiedCount} modified, ${result.upsertedCount} created`);
    
    res.json({ 
      message: `Successfully updated ${stocks.length} stock entries`,
      modified: result.modifiedCount,
      created: result.upsertedCount
    });
  } catch (err) {
    console.error('Bulk update stocks error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const stocks = await Stock.find({ productId }).sort({ ageCategory: 1, weight: 1 });
    res.json(stocks);
  } catch (err) {
    console.error('Get product stock error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const lowStocks = await Stock.find({ quantity: { $lte: 8, $gt: 0 } })
      .populate('productId', 'name basePremium category')
      .sort({ quantity: 1 });
    
    const outOfStocks = await Stock.find({ quantity: 0 })
      .populate('productId', 'name basePremium category')
      .sort({ productId: 1 });

    res.json({ lowStocks, outOfStocks });
  } catch (err) {
    console.error('Get stock alerts error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Initialize stock for all products
exports.initializeAllStocks = async (req, res) => {
  try {
    const { initializeAllProductStocks } = require('../services/stockInitService');
    const result = await initializeAllProductStocks();
    
    res.json({ 
      message: result.initialized > 0 
        ? `Initialized ${result.initialized} stock entries for ${result.products} products`
        : 'All product stocks already initialized',
      ...result
    });
  } catch (err) {
    console.error('Initialize all stocks error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Debug endpoint to check stock status
exports.debugStocks = async (req, res) => {
  try {
    const products = await Product.find({}).select('_id name');
    const stocks = await Stock.find({}).populate('productId', 'name');
    
    const debug = {
      totalProducts: products.length,
      totalStocks: stocks.length,
      productsWithoutStock: [],
      stocksByProduct: {}
    };
    
    // Check which products have no stock
    for (const product of products) {
      const productStocks = stocks.filter(s => s.productId && s.productId._id.toString() === product._id.toString());
      if (productStocks.length === 0) {
        debug.productsWithoutStock.push(product.name);
      } else {
        debug.stocksByProduct[product.name] = productStocks.length;
      }
    }
    
    res.json(debug);
  } catch (err) {
    console.error('Debug stocks error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Initialize stock for a new product
exports.initializeProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { initialQuantity = 50 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const ageCategories = ['6 months', '1 year', '2 years'];
    const weights = ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'];
    
    const stockEntries = [];
    for (const age of ageCategories) {
      for (const weight of weights) {
        stockEntries.push({
          productId,
          ageCategory: age,
          weight,
          quantity: initialQuantity
        });
      }
    }

    await Stock.insertMany(stockEntries, { ordered: false }); // Continue on duplicates
    
    res.json({ message: `Stock initialized for ${product.name} with ${initialQuantity} units per variant` });
  } catch (err) {
    if (err.code === 11000) {
      res.json({ message: "Stock already exists for this product" });
    } else {
      console.error('Initialize stock error:', err);
      res.status(500).json({ message: "Server error" });
    }
  }
};

// ── Product Management ──────────────────────────────────────────────────────

exports.addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ message: "Product added successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.productId, req.body, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Order Management ────────────────────────────────────────────────────────

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = status ? { status } : {};
    // Admin sees all orders including those hidden from users
    const orders = await Order.find(filter)
      .populate("userId", "name email")
      .populate("items.productId", "name category")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Order.countDocuments(filter);
    res.json({ orders, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("userId", "name email")
      .populate("items.productId", "name category basePremium");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status" });
    const order = await Order.findByIdAndUpdate(req.params.orderId, { status }, { new: true }).populate("userId", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── User Management ─────────────────────────────────────────────────────────

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const users = await User.find({}).select("-password").sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await User.countDocuments();
    res.json({ users, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isPremium, ricePoints } = req.body;
    const updateData = {};
    if (isPremium !== undefined) updateData.isPremium = isPremium;
    if (ricePoints !== undefined) updateData.ricePoints = ricePoints;
    const user = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Analytics ───────────────────────────────────────────────────────────────

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, revenueAgg, recentOrders, orderStats, monthlyRevenue, marketPrice, activeFestival, lowStockProducts] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([{ $match: { status: { $ne: "Cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Order.find({}).populate("userId", "name").sort({ createdAt: -1 }).limit(5),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }, status: { $ne: "Cancelled" } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      MarketPrice.findOne({ commodity: "Rice" }),
      getCurrentFestival(),
      Stock.aggregate([
        { $match: { quantity: { $lte: 8 } } },
        { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $group: { _id: '$productId', name: { $first: '$product.name' }, lowStockCount: { $sum: { $cond: [{ $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', 8] }] }, 1, 0] } }, outOfStockCount: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } } } },
        { $match: { $or: [{ lowStockCount: { $gt: 0 } }, { outOfStockCount: { $gt: 0 } }] } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      stats: { totalUsers, totalOrders, totalProducts, totalRevenue: revenueAgg[0]?.total || 0 },
      recentOrders,
      orderStats,
      monthlyRevenue,
      marketPrice,
      activeFestival,
      lowStockProducts
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Market Price Management ─────────────────────────────────────────────────

// Trigger real-time fetch from external API
exports.refreshMarketPrice = async (req, res) => {
  try {
    const result = await updateMarketPrice();
    res.json({ message: `Market price refreshed from ${result.source}`, ...result });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin manually sets price
exports.setMarketPrice = async (req, res) => {
  try {
    const { price } = req.body;
    if (!price || price <= 0) return res.status(400).json({ message: "Invalid price" });

    const current = await MarketPrice.findOne({ commodity: "Rice" });
    const previousPrice = current ? current.pricePerKg : price;
    const priceChange = parseFloat((price - previousPrice).toFixed(2));
    const trend = priceChange > 2 ? "up" : priceChange < -2 ? "down" : "stable";

    const marketPrice = await MarketPrice.findOneAndUpdate(
      { commodity: "Rice" },
      { previousPrice, pricePerKg: price, priceChange, trend, source: "manual", lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    // Apply to all products immediately
    await applyDynamicPricing(price);

    res.json({ message: `Market price manually set to ₹${price}/kg`, marketPrice });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMarketPrice = async (req, res) => {
  try {
    const marketPrice = await MarketPrice.findOne({ commodity: "Rice" });
    res.json(marketPrice);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Flash Sale Management ───────────────────────────────────────────────────

// Auto random flash sale
exports.createFlashSale = async (req, res) => {
  try {
    const result = await createFlashSale();
    res.json({ message: "Flash sale created", products: result });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin picks specific products + discounts
exports.setManualFlashSale = async (req, res) => {
  try {
    const { products } = req.body;
    // products = [{ productId: "...", discount: 20 }, ...]
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Provide products array with productId and discount" });
    }
    await setFlashSaleProducts(products);
    res.json({ message: `Flash sale set for ${products.length} products`, products });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.clearFlashSale = async (req, res) => {
  try {
    await Product.updateMany({}, { isFlashSale: false, flashSaleDiscount: 0 });
    res.json({ message: "Flash sale cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Festival Management ─────────────────────────────────────────────────────

exports.getAllFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find({}).sort({ startMonth: 1, startDay: 1 });
    res.json(festivals);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getActiveFestival = async (req, res) => {
  try {
    const festival = await getCurrentFestival();
    res.json({ festival });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.createFestival = async (req, res) => {
  try {
    const festival = await Festival.create(req.body);
    res.status(201).json({ message: "Festival created", festival });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateFestival = async (req, res) => {
  try {
    const festival = await Festival.findByIdAndUpdate(req.params.festivalId, req.body, { new: true });
    if (!festival) return res.status(404).json({ message: "Festival not found" });

    // Re-apply festival discounts if this is the active one
    const active = await getCurrentFestival();
    await applyFestivalDiscount(active);

    res.json({ message: "Festival updated", festival });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteFestival = async (req, res) => {
  try {
    await Festival.findByIdAndDelete(req.params.festivalId);
    res.json({ message: "Festival deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleFestival = async (req, res) => {
  try {
    const festival = await Festival.findById(req.params.festivalId);
    if (!festival) return res.status(404).json({ message: "Festival not found" });
    festival.isActive = !festival.isActive;
    await festival.save();

    const active = await getCurrentFestival();
    await applyFestivalDiscount(active);

    res.json({ message: `Festival ${festival.isActive ? "activated" : "deactivated"}`, festival });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Apply current festival discount to all products now
exports.applyFestivalNow = async (req, res) => {
  try {
    const festival = await getCurrentFestival();
    await applyFestivalDiscount(festival);
    res.json({
      message: festival
        ? `Festival discount applied: ${festival.name} (${festival.discount}%)`
        : "No active festival — discounts cleared",
      festival
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Offer Management ────────────────────────────────────────────────────────

exports.createOffer = async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ message: "Offer created", offer });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({}).populate("applicableProducts", "name").sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    offer.isActive = !offer.isActive;
    await offer.save();
    res.json({ message: `Offer ${offer.isActive ? "activated" : "deactivated"}`, offer });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
