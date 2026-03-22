const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// One review per user per order item (not per product globally)
reviewSchema.index({ userId: 1, orderId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
