const router = require("express").Router();
const { submitReview, getProductReviews, getUserReview, getUserReviews, getAllReviews, toggleReviewVisibility, deleteReview } = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/", authMiddleware, submitReview);
router.get("/user/mine", authMiddleware, getUserReviews);
router.get("/product/:productId", getProductReviews);
router.get("/:orderId/:productId", authMiddleware, getUserReview);

// Admin routes
router.get("/admin/all", adminMiddleware, getAllReviews);
router.put("/admin/:reviewId/visibility", adminMiddleware, toggleReviewVisibility);
router.delete("/admin/:reviewId", adminMiddleware, deleteReview);

module.exports = router;
