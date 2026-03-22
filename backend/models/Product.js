const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  basePremium: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  images: {
    packed: String,
    grain: String
  },
  stock: {
    type: Number,
    default: 100
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isTodayDeal: {
    type: Boolean,
    default: false
  },
  isFlashSale: {
    type: Boolean,
    default: false
  },
  flashSaleDiscount: {
    type: Number,
    default: 0
  },
  festivalDiscount: {
    type: Number,
    default: 0
  },
  activeFestival: {
    type: String,
    default: ""
  },
  effectivePrice: {
    type: Number,
    default: 0
  },
  lastPriceUpdate: {
    type: Date,
    default: Date.now
  },
  healthBenefits: [String],
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);