const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema({
  commodity: {
    type: String,
    required: true
  },
  pricePerKg: {
    type: Number,
    required: true
  },
  previousPrice: {
    type: Number,
    default: 0
  },
  priceChange: {
    type: Number,
    default: 0
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  source: {
    type: String,
    enum: ['real_api', 'simulated', 'manual', 'initial'],
    default: 'initial'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MarketPrice", marketPriceSchema);