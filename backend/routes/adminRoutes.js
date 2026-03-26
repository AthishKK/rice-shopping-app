const router = require("express").Router();
const {
  // Products
  addProduct, updateProduct, deleteProduct, getAllProducts,
  // Stock Management
  getAllStocks, updateStock, bulkUpdateStocks, getProductStock, getLowStockAlerts, initializeProductStock, initializeAllStocks, debugStocks,
  // Orders
  getAllOrders, getOrderDetails, updateOrderStatus,
  // Users
  getAllUsers, updateUserStatus,
  // Analytics
  getDashboardStats,
  // Market Price
  refreshMarketPrice, setMarketPrice, getMarketPrice,
  // Flash Sale
  createFlashSale, setManualFlashSale, clearFlashSale,
  // Festivals
  getAllFestivals, getActiveFestival, createFestival, updateFestival, deleteFestival, toggleFestival, applyFestivalNow,
  // Offers
  createOffer, getAllOffers, toggleOfferStatus
} = require("../controllers/adminController");

const { getAllReturns, getReturnDetails, updateReturnStatus, getReturnAnalytics } = require("../controllers/returnController");
const { getAllReviews, toggleReviewVisibility, deleteReview } = require("../controllers/reviewController");

const adminMiddleware = require("../middleware/adminMiddleware");
router.use(adminMiddleware);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Products
router.get("/products", getAllProducts);
router.post("/products", addProduct);
router.put("/products/:productId", updateProduct);
router.delete("/products/:productId", deleteProduct);

// Stock Management
router.get("/stocks/debug", debugStocks);
router.get("/stocks/alerts/low", getLowStockAlerts);
router.get("/stocks/:productId", getProductStock);
router.get("/stocks", getAllStocks);
router.put("/stocks", updateStock);
router.put("/stocks/bulk", bulkUpdateStocks);
router.post("/stocks/initialize-all", initializeAllStocks);
router.post("/stocks/:productId/initialize", initializeProductStock);

// Orders
router.get("/orders", getAllOrders);
router.get("/orders/:orderId", getOrderDetails);
router.put("/orders/:orderId/status", updateOrderStatus);

// Users
router.get("/users", getAllUsers);
router.put("/users/:userId", updateUserStatus);

// Market Price
router.get("/market-price", getMarketPrice);
router.post("/market-price/refresh", refreshMarketPrice);   // fetch from real API
router.post("/market-price/set", setMarketPrice);           // admin manual set

// Flash Sale
router.post("/flash-sale/auto", createFlashSale);           // random auto
router.post("/flash-sale/manual", setManualFlashSale);      // admin picks products
router.post("/flash-sale/clear", clearFlashSale);

// Festivals
router.get("/festivals", getAllFestivals);
router.get("/festivals/active", getActiveFestival);
router.post("/festivals", createFestival);
router.put("/festivals/:festivalId", updateFestival);
router.delete("/festivals/:festivalId", deleteFestival);
router.put("/festivals/:festivalId/toggle", toggleFestival);
router.post("/festivals/apply-now", applyFestivalNow);

// Offers
router.get("/offers", getAllOffers);
router.post("/offers", createOffer);
router.put("/offers/:offerId/toggle", toggleOfferStatus);

// Returns Management
router.get("/returns", getAllReturns);
router.get("/returns/analytics", getReturnAnalytics);
router.get("/returns/:returnId", getReturnDetails);
router.put("/returns/:returnId/status", updateReturnStatus);

// Reviews Management
router.get("/reviews/all", getAllReviews);
router.put("/reviews/:reviewId/visibility", toggleReviewVisibility);
router.delete("/reviews/:reviewId", deleteReview);

module.exports = router;
