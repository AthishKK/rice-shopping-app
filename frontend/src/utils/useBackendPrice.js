import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const useBackendPrice = () => {
  const [marketPrice, setMarketPrice] = useState(60);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/products/price-trend`)
      .then(r => r.json())
      .then(d => {
        if (d?.current) {
          setMarketPrice(d.current);
          setTrend(d.trend || 'stable');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Get prices from backend with proper flash sale and festival discounts
  const getPrices = async (productId, isPremium = false, age = '6 months', weight = '1kg') => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}?age=${encodeURIComponent(age)}&weight=${weight}`);
      const data = await response.json();
      
      if (data.pricing) {
        const pricing = data.pricing;
        
        // Apply premium discount if user is premium
        let finalPrice = pricing.finalPrice;
        if (isPremium && pricing.discountType !== 'flashSale' && pricing.discountType !== 'festival') {
          // Premium gets 10% off only if no flash sale or festival discount is active
          finalPrice = Math.round(finalPrice * 0.9);
        }
        
        return {
          discount: pricing.appliedDiscount || 0,
          marketPrice: pricing.marketPrice,
          trend: pricing.trend,
          finalPrice: finalPrice,
          originalPrice: pricing.originalPrice,
          pricePerKg: Math.round(finalPrice / parseFloat(weight.replace('kg', ''))),
          originalPricePerKg: Math.round(pricing.originalPrice / parseFloat(weight.replace('kg', ''))),
          discountType: pricing.discountType,
          isFlashSale: pricing.isFlashSale,
          flashSaleDiscount: pricing.flashSaleDiscount,
          festivalDiscount: pricing.festivalDiscount,
          isTodayDeal: pricing.isTodayDeal,
          activeFestival: pricing.activeFestival
        };
      }
      
      // Fallback if no pricing data
      return {
        discount: 0,
        marketPrice,
        trend,
        finalPrice: 100,
        originalPrice: 100,
        pricePerKg: 100,
        originalPricePerKg: 100,
        discountType: 'none'
      };
    } catch (error) {
      console.error('Error fetching backend price:', error);
      // Return fallback pricing
      return {
        discount: 0,
        marketPrice,
        trend,
        finalPrice: 100,
        originalPrice: 100,
        pricePerKg: 100,
        originalPricePerKg: 100,
        discountType: 'none'
      };
    }
  };

  return { marketPrice, trend, loading, getPrices };
};