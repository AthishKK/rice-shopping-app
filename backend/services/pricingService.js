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
    
    // Apply flash sale discount if applicable (like today's deal with extra 5%)
    let finalPrice = basePrice;
    let effectiveFlashDiscount = 0;
    if (product.isFlashSale && product.flashSaleDiscount > 0) {
      // Flash sale works like today's deal: apply the discount percentage + extra 5%
      const totalDiscount = product.flashSaleDiscount + 5; // Add extra 5% like today's deal
      finalPrice = basePrice * (1 - totalDiscount / 100);
      effectiveFlashDiscount = totalDiscount;
    }

    return {
      marketPrice: market.pricePerKg,
      basePremium: product.basePremium,
      agePremium,
      basePrice,
      finalPrice: Math.round(finalPrice), // Price per kg, not total
      pricePerKg: Math.round(finalPrice),
      totalPrice: Math.round(finalPrice * weightMultiplier), // Total price for the weight
      trend: market.trend,
      priceChange: market.priceChange,
      isFlashSale: product.isFlashSale,
      flashSaleDiscount: product.flashSaleDiscount,
      effectiveFlashDiscount: effectiveFlashDiscount // Show total discount including extra 5%
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