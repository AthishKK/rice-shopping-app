const mongoose = require('mongoose');

const todaysDealsSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true
  },
  deals: [{
    productId: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    age: {
      type: String,
      required: true
    },
    extraDiscount: {
      type: Number,
      default: 5 // Extra 5% discount for today's deals
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
  }
});

// Index for automatic cleanup of expired deals
todaysDealsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TodaysDeal', todaysDealsSchema);