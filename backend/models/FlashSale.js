const mongoose = require("mongoose");

// Flash Sale Settings Schema (singleton)
const flashSaleSettingsSchema = new mongoose.Schema({
  autoRotationEnabled: {
    type: Boolean,
    default: true
  },
  rotationIntervalHours: {
    type: Number,
    default: 6,
    min: 1,
    max: 24
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const flashSaleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "Flash Sale"
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    discount: {
      type: Number,
      required: true,
      min: 5,
      max: 50
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
flashSaleSchema.index({ startTime: 1, endTime: 1, isActive: 1 });

// Method to check if flash sale is currently active
flashSaleSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
};

// Static method to get current active flash sale
flashSaleSchema.statics.getCurrentFlashSale = async function() {
  const now = new Date();
  return await this.findOne({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now }
  }).populate('products.productId');
};

// Static method to expire old flash sales
flashSaleSchema.statics.expireOldFlashSales = async function() {
  const now = new Date();
  const result = await this.updateMany(
    { endTime: { $lt: now }, isActive: true },
    { isActive: false }
  );
  return result.modifiedCount;
};

module.exports = {
  FlashSale: mongoose.model("FlashSale", flashSaleSchema),
  FlashSaleSettings: mongoose.model("FlashSaleSettings", flashSaleSettingsSchema)
};