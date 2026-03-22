const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  ageCategory: {
    type: String,
    required: true,
    enum: ['6 months', '1 year', '2 years']
  },
  weight: {
    type: String,
    required: true,
    enum: ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg']
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
stockSchema.index({ productId: 1, ageCategory: 1, weight: 1 }, { unique: true });

// Virtual for stock status
stockSchema.virtual('status').get(function() {
  if (this.quantity === 0) return 'out-of-stock';
  if (this.quantity <= 8) return 'low-stock';
  return 'in-stock';
});

// Method to check if stock is available for a specific quantity
stockSchema.methods.isAvailable = function(requestedQuantity) {
  return this.quantity >= requestedQuantity;
};

// Method to reduce stock
stockSchema.methods.reduceStock = function(quantity) {
  if (this.quantity >= quantity) {
    this.quantity -= quantity;
    this.lastUpdated = new Date();
    return true;
  }
  return false;
};

module.exports = mongoose.model("Stock", stockSchema);