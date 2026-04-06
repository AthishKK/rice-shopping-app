const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumStartDate: {
    type: Date
  },
  premiumExpiryDate: {
    type: Date
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  ricePoints: {
    type: Number,
    default: 0
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  resetPasswordOTP: {
    type: String
  },
  resetPasswordExpiry: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);