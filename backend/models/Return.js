const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productName: { type: String, required: true },
  reason: {
    type: String,
    enum: ["Damaged product", "Wrong item delivered", "Quality not as expected", "Size/fit issue", "Other"],
    required: true
  },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Requested", "Approved", "Rejected", "Pickup Scheduled", "Picked Up", "Refund Processed", "Replacement Shipped"],
    default: "Requested"
  },
  adminNote: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Return", returnSchema);
