const MarketPrice = require("../models/MarketPrice");
const Product = require("../models/Product");

const getFinalPrice = async (product, age, weight = "1kg") => {
  try {
    const market = await MarketPrice.findOne({ commodity: "Rice" });
    
    if (!market) {
      throw new Error("Market price not found");
    }

    let agePremium = 0;
    if (age === "1 year" || age === "1year") agePremium = 20;
    if (age === "2 years" || age === "2years") agePremium = 40;

    // Weight multiplier
    const weightMultiplier = parseFloat(weight.replace('kg', ''));
    
    // Base calculation: Market Price + Rice Type Premium + Age Premium
    const basePrice = market.pricePerKg + product.basePremium + agePremium;
    
    // Apply discounts in priority order: Flash Sale > Festival > Today's Deal > Base
    let finalPrice = basePrice;
    let appliedDiscount = 0;
    let discountType = "none";
    
    // 1. Flash Sale (highest priority) - 15% discount
    if (product.isFlashSale && product.flashSaleDiscount > 0) {
      finalPrice = basePrice * (1 - product.flashSaleDiscount / 100);
      appliedDiscount = product.flashSaleDiscount;
      discountType = "flashSale";
    }
    // 2. Festival Discount (if no flash sale)
    else if (product.festivalDiscount > 0) {
      finalPrice = basePrice * (1 - product.festivalDiscount / 100);
      appliedDiscount = product.festivalDiscount;
      discountType = "festival";
    }
    // 3. Today's Deal (if no flash sale or festival) - 5% discount
    else if (product.isTodayDeal) {
      finalPrice = basePrice * 0.95; // 5% discount for today's deal
      appliedDiscount = 5;
      discountType = "todayDeal";
    }

    return {
      marketPrice: market.pricePerKg,
      basePremium: product.basePremium,
      agePremium,
      basePrice,
      finalPrice: Math.round(finalPrice * weightMultiplier),
      pricePerKg: Math.round(finalPrice),
      originalPrice: Math.round(basePrice * weightMultiplier),
      originalPricePerKg: Math.round(basePrice),
      appliedDiscount,
      discountType,
      trend: market.trend,
      priceChange: market.priceChange,
      isFlashSale: product.isFlashSale,
      flashSaleDiscount: product.flashSaleDiscount,
      festivalDiscount: product.festivalDiscount,
      isTodayDeal: product.isTodayDeal,
      activeFestival: product.activeFestival
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