const MarketPrice = require("../models/MarketPrice");
const Product = require("../models/Product");

const getFinalPrice = async (product, age, weight = "1kg") => {
  try {
    const market = await MarketPrice.findOne({ commodity: "Rice" });
    
    if (!market) {
      throw new Error("Market price not found");
    }

    let agePremium = 0;
    if (age === "1year") agePremium = 20;
    if (age === "2years") agePremium = 40;

    // Weight multiplier
    const weightMultiplier = parseFloat(weight.replace('kg', ''));
    
    // Base calculation: Market Price + Rice Type Premium + Age Premium
    const basePrice = market.pricePerKg + product.basePremium + agePremium;
    
    // Apply flash sale discount if applicable
    let finalPrice = basePrice;
    if (product.isFlashSale && product.flashSaleDiscount > 0) {
      finalPrice = basePrice * (1 - product.flashSaleDiscount / 100);
    }

    return {
      marketPrice: market.pricePerKg,
      basePremium: product.basePremium,
      agePremium,
      basePrice,
      finalPrice: Math.round(finalPrice * weightMultiplier),
      pricePerKg: Math.round(finalPrice),
      trend: market.trend,
      priceChange: market.priceChange,
      isFlashSale: product.isFlashSale,
      flashSaleDiscount: product.flashSaleDiscount
    };
  } catch (error) {
    console.error("Error calculating price:", error);
    throw error;
  }
};

const getPriceTrend = async () => {
  try {
    const market = await MarketPrice.findOne({ commodity: "Rice" });
    return {
      current: market.pricePerKg,
      previous: market.previousPrice,
      change: market.priceChange,
      trend: market.trend
    };
  } catch (error) {
    console.error("Error getting price trend:", error);
    return null;
  }
};

module.exports = { getFinalPrice, getPriceTrend };