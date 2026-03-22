const axios = require("axios");
const MarketPrice = require("../models/MarketPrice");

// Real free API: data.gov.in - Daily Commodity Prices
// Fallback: Open Food Facts / simulated with realistic range
const REAL_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY || "579b464db66ec23bdd000001cdd3946e44ce4aab825d5f8e8a58078";

const fetchRealMarketPrice = async () => {
  try {
    const response = await axios.get(REAL_API_URL, {
      params: {
        "api-key": API_KEY,
        format: "json",
        limit: 10,
        filters: JSON.stringify({ commodity: "Rice" })
      },
      timeout: 8000
    });

    const records = response.data?.records;
    if (records && records.length > 0) {
      // Average the modal prices from multiple markets
      const prices = records
        .map(r => parseFloat(r.modal_price || r.min_price || 0))
        .filter(p => p > 0);

      if (prices.length > 0) {
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        // Convert from per quintal to per kg (1 quintal = 100 kg)
        return Math.round(avgPrice / 100);
      }
    }
    return null;
  } catch (err) {
    console.log("Real API unavailable, using fallback:", err.message);
    return null;
  }
};

const updateMarketPrice = async () => {
  try {
    const currentMarket = await MarketPrice.findOne({ commodity: "Rice" });

    // Try real API first
    let newPrice = await fetchRealMarketPrice();
    let source = "real_api";

    // Fallback: realistic simulation based on seasonal trends
    if (!newPrice) {
      const month = new Date().getMonth();
      // Rice prices are typically higher post-harvest (Jan-Mar) and lower during harvest (Oct-Dec)
      const seasonalBase = [65, 63, 62, 60, 58, 57, 56, 58, 60, 62, 64, 66][month];
      const fluctuation = (Math.random() * 6) - 3; // ±3 realistic daily change
      newPrice = Math.round(seasonalBase + fluctuation);
      source = "simulated";
    }

    let trend = "stable";
    let priceChange = 0;

    if (currentMarket) {
      priceChange = parseFloat((newPrice - currentMarket.pricePerKg).toFixed(2));
      if (priceChange > 2) trend = "up";
      else if (priceChange < -2) trend = "down";
    }

    const updated = await MarketPrice.findOneAndUpdate(
      { commodity: "Rice" },
      {
        previousPrice: currentMarket ? currentMarket.pricePerKg : newPrice,
        pricePerKg: newPrice,
        priceChange,
        trend,
        source,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    // Apply dynamic pricing to all products
    await applyDynamicPricing(newPrice);

    console.log(`Market price updated: ₹${newPrice}/kg (${trend}) [${source}]`);
    return { price: newPrice, trend, change: priceChange, source };
  } catch (err) {
    console.error("Error updating market price:", err);
    throw err;
  }
};

// Recalculate and store effective price on each product based on market price
const applyDynamicPricing = async (marketPrice) => {
  try {
    const Product = require("../models/Product");
    const products = await Product.find({});

    for (const product of products) {
      const basePrice = marketPrice + product.basePremium;
      let effectivePrice = basePrice;

      if (product.isFlashSale && product.flashSaleDiscount > 0) {
        effectivePrice = Math.round(basePrice * (1 - product.flashSaleDiscount / 100));
      }

      await Product.findByIdAndUpdate(product._id, {
        effectivePrice: Math.round(effectivePrice),
        lastPriceUpdate: new Date()
      });
    }
    console.log(`Dynamic pricing applied to ${products.length} products`);
  } catch (err) {
    console.error("Error applying dynamic pricing:", err);
  }
};

const initializeMarketPrice = async () => {
  try {
    const existing = await MarketPrice.findOne({ commodity: "Rice" });
    if (!existing) {
      await MarketPrice.create({
        commodity: "Rice",
        pricePerKg: 60,
        previousPrice: 60,
        priceChange: 0,
        trend: "stable",
        source: "initial",
        lastUpdated: new Date()
      });
      console.log("Market price initialized");
    }
    // Run initial update to fetch real price
    await updateMarketPrice();
  } catch (err) {
    console.error("Error initializing market price:", err);
  }
};

module.exports = { updateMarketPrice, fetchRealMarketPrice, initializeMarketPrice, applyDynamicPricing };
