const router = require("express").Router();
const { 
  createOrder, 
  getOrders, 
  getOrder, 
  updateOrderStatus, 
  cancelOrder, 
  trackOrder,
  clearOrderHistory,
  hideOrder
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Create new order
router.post("/", createOrder);

// Get user's orders
router.get("/", getOrders);

// Clear order history (hide all orders from user view)
router.put("/clear-history", clearOrderHistory);

// Hide specific order from user view
router.put("/:orderId/hide", hideOrder);

// Get specific order
router.get("/:orderId", getOrder);

// Track order
router.get("/:orderId/track", trackOrder);

// Update order status (for admin)
router.put("/:orderId/status", updateOrderStatus);

// Cancel order
router.put("/:orderId/cancel", cancelOrder);

module.exports = router;