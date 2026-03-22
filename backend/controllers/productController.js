const Product = require("../models/Product");
const { getFinalPrice, getPriceTrend } = require("../services/pricingService");
const { getHealthBenefits } = require("../utils/helpers");
const { getProductStockSummary, getStockStatus } = require("../services/stockService");

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const age = req.query.age || "6 months";
    const weight = req.query.weight || "1kg";

    const [priceData, stockStatus, stockSummary] = await Promise.all([
      getFinalPrice(product, age, weight),
      getStockStatus(product._id, age, weight),
      getProductStockSummary(product._id)
    ]);
    
    res.json({ 
      ...product.toObject(), 
      pricing: priceData,
      stock: stockStatus,
      stockSummary,
      healthBenefits: getHealthBenefits(product.name)
    });
  } catch (error) {
    console.error("Error getting product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { category, trending, todayDeal, flashSale } = req.query;
    let filter = {};
    
    if (category) filter.category = category;
    if (trending === 'true') filter.isTrending = true;
    if (todayDeal === 'true') filter.isTodayDeal = true;
    if (flashSale === 'true') filter.isFlashSale = true;

    const products = await Product.find(filter);
    
    // Add pricing and stock for each product (default 6 months, 1kg)
    const productsWithPricing = await Promise.all(
      products.map(async (product) => {
        try {
          const [priceData, stockStatus] = await Promise.all([
            getFinalPrice(product, "6 months", "1kg"),
            getStockStatus(product._id, "6 months", "1kg")
          ]);
          return {
            ...product.toObject(),
            pricing: priceData,
            stock: stockStatus
          };
        } catch (error) {
          return {
            ...product.toObject(),
            pricing: { finalPrice: 0, error: "Price unavailable" },
            stock: { status: 'unknown', quantity: 0, message: 'Stock unavailable' }
          };
        }
      })
    );

    res.json(productsWithPricing);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const currentProduct = await Product.findById(productId);
    
    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find similar products based on category
    const recommendations = await Product.find({
      _id: { $ne: productId },
      category: currentProduct.category
    }).limit(4);

    const recommendationsWithPricing = await Promise.all(
      recommendations.map(async (product) => {
        const priceData = await getFinalPrice(product, "6months", "1kg");
        return {
          ...product.toObject(),
          pricing: priceData
        };
      })
    );

    res.json(recommendationsWithPricing);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPriceTrend = async (req, res) => {
  try {
    const trend = await getPriceTrend();
    res.json(trend);
  } catch (error) {
    console.error("Error getting price trend:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });

    const productsWithPricing = await Promise.all(
      products.map(async (product) => {
        const priceData = await getFinalPrice(product, "6months", "1kg");
        return {
          ...product.toObject(),
          pricing: priceData
        };
      })
    );

    res.json(productsWithPricing);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};