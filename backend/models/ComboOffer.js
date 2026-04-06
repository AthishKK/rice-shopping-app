const mongoose = require("mongoose");

const comboOfferSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "Combo Offer"
  },
  mainProduct: {
    productId: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    }
  },
  freeProduct: {
    productId: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    }
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
comboOfferSchema.index({ startTime: 1, endTime: 1, isActive: 1 });

// Method to check if combo offer is currently active
comboOfferSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
};

// Static method to get current active combo offers
comboOfferSchema.statics.getActiveComboOffers = async function() {
  const now = new Date();
  return await this.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now }
  }).sort({ endTime: 1 });
};

// Static method to expire old combo offers
comboOfferSchema.statics.expireOldComboOffers = async function() {
  const now = new Date();
  const result = await this.updateMany(
    { endTime: { $lt: now }, isActive: true },
    { isActive: false }
  );
  return result.modifiedCount;
};

module.exports = mongoose.model("ComboOffer", comboOfferSchema);