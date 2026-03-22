const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Submit a review
exports.submitReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user.userId;

    console.log('Review submission:', { userId, orderId, productId, rating });

    // Verify the order belongs to user and is delivered
    const order = await Order.findOne({ _id: orderId, userId, status: "Delivered" });
    if (!order) {
      console.log('Order not found or not delivered:', { orderId, userId });
      return res.status(403).json({ message: "Order not found or not delivered" });
    }

    // Check if review already exists for this specific order+product combination
    const existingReview = await Review.findOne({ userId, orderId, productId });
    if (existingReview) {
      console.log('Review already exists for this order+product:', { userId, orderId, productId });
      return res.status(400).json({ message: "You have already reviewed this product for this order" });
    }

    // Create new review
    const review = new Review({
      userId,
      orderId,
      productId,
      rating,
      comment: comment || '',
      isVisible: true
    });

    await review.save();
    console.log('Review saved successfully:', review._id);
    
    res.status(201).json({ message: "Review submitted", review });
  } catch (err) {
    console.error("Submit review error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Get user's own reviews (to know which items they've already reviewed)
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reviews = await Review.find({ userId }).select('orderId productId rating');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get reviews for a product (public) - only visible ones
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId, isVisible: true })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ reviews, avgRating, total: reviews.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get user's review for a specific order+product
exports.getUserReview = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.user.userId;
    const review = await Review.findOne({ userId, orderId, productId });
    res.json(review || null);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("userId", "name email")
      .populate("productId", "name")
      .populate("orderId", "_id")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${reviews.length} reviews for admin panel`);
    res.json(reviews);
  } catch (err) {
    console.error('Get all reviews error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Toggle review visibility
exports.toggleReviewVisibility = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    
    review.isVisible = !review.isVisible;
    await review.save();
    
    res.json({ message: `Review ${review.isVisible ? 'shown' : 'hidden'}`, review });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
