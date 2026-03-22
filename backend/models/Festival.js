const mongoose = require("mongoose");

const festivalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startMonth: { type: Number, required: true }, // 0-11
  startDay: { type: Number, required: true },
  endMonth: { type: Number, required: true },
  endDay: { type: Number, required: true },
  discount: { type: Number, required: true },
  bannerText: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Festival", festivalSchema);
