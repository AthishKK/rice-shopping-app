const router = require("express").Router();
const { 
  getProduct, 
  getAllProducts, 
  getRecommendations, 
  getPriceTrend, 
  searchProducts 
} = require("../controllers/productController");
const { checkStockAvailability, getProductStockSummary } = require("../services/stockService");

// Get all products with filters
router.get("/", getAllProducts);

// Search products
router.get("/search", searchProducts);

// Get price trend
router.get("/price-trend", getPriceTrend);

// Check stock availability for specific variant
router.get("/:productId/stock/:ageCategory/:weight", async (req, res) => {
  try {
    const { productId, ageCategory, weight } = req.params;
    const { quantity = 1 } = req.query;
    
    console.log(`Stock check request: ${productId}, ${ageCategory}, ${weight}, qty: ${quantity}`);
    
    const stockCheck = await checkStockAvailability(productId, decodeURIComponent(ageCategory), decodeURIComponent(weight), parseInt(quantity));
    res.json(stockCheck);
  } catch (error) {
    console.error('Stock check error:', error);
    res.status(500).json({ message: "Error checking stock availability" });
  }
});

// Get complete stock summary for a product
router.get("/:productId/stock-summary", async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(`Stock summary request for product: ${productId}`);
    
    const summary = await getProductStockSummary(productId);
    if (!summary) {
      return res.status(404).json({ message: "Stock summary not found" });
    }
    res.json(summary);
  } catch (error) {
    console.error('Stock summary error:', error);
    res.status(500).json({ message: "Error getting stock summary" });
  }
});

// Get specific product with dynamic pricing
router.get("/:id", getProduct);

// Get product recommendations
router.get("/:productId/recommendations", getRecommendations);

module.exports = router;