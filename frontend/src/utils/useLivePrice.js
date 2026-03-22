import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Each product's base premium over market price (derived from original static prices)
// basePremium = static_6months_price - 60 (where 60 was the original assumed market price)
const PRODUCT_BASE_PREMIUMS = {
  1:  40,  // Nei Kichadi      (100 - 60)
  2:  60,  // Seeraga Samba    (120 - 60)
  3:  90,  // Karuppu Kavuni   (150 - 60)
  4:  50,  // Mappillai Samba  (110 - 60)
  5:  80,  // Karunguruvai     (140 - 60)
  6: 140,  // Basmati          (200 - 60)
  7: 110,  // Kattuyanam       (170 - 60)
  8:  90,  // Poongar          (150 - 60)
  9: 115,  // Thooyamalli      (175 - 60)
  10: 60,  // Red Rice         (120 - 60)
};

// Per-product discount % shown visually (no real reduction — just display trick)
const PRODUCT_DISCOUNTS = {
  1: 14, 2: 15, 3: 18, 4: 12, 5: 13,
  6: 15, 7: 14, 8: 12, 9: 13, 10: 12
};

let cachedMarketPrice = null;
let cacheTime = 0;

export const useLivePrice = () => {
  const [marketPrice, setMarketPrice] = useState(cachedMarketPrice || 60);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(!cachedMarketPrice);

  useEffect(() => {
    // Cache for 5 minutes to avoid repeated fetches
    if (cachedMarketPrice && Date.now() - cacheTime < 5 * 60 * 1000) {
      setMarketPrice(cachedMarketPrice);
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/products/price-trend`)
      .then(r => r.json())
      .then(d => {
        if (d?.current) {
          cachedMarketPrice = d.current;
          cacheTime = Date.now();
          setMarketPrice(d.current);
          setTrend(d.trend || 'stable');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Pricing formulas:
  // Normal:               displayed = original - disc%
  // Premium:              displayed = original - disc% - 10% of original
  // Today's Deal normal:  displayed = original - disc% - 5% of original
  // Today's Deal premium: dealPrice = original - disc% - 5% of original → then - 10% of dealPrice
  // Flash/Trending premium: same as Premium formula
  const getPrices = (productId, isPremium = false, isTodaysDeal = false) => {
    const base = PRODUCT_BASE_PREMIUMS[productId] || 40;
    const disc = PRODUCT_DISCOUNTS[productId] || 14;

    const orig6m = marketPrice + base;
    const orig1y  = marketPrice + base + 20;
    const orig2y  = marketPrice + base + 40;

    const applyDiscounts = (original) => {
      // Step 1: always subtract the product's discount %
      let price = Math.round(original * (1 - disc / 100));

      if (isTodaysDeal && isPremium) {
        // Today's deal for premium: -5% of original, then -10% of that result
        const afterDeal = Math.round(original * (1 - disc / 100) - original * 0.05);
        price = Math.round(afterDeal * 0.90);
      } else if (isTodaysDeal) {
        // Today's deal normal: -5% of original
        price = Math.round(original * (1 - disc / 100) - original * 0.05);
      } else if (isPremium) {
        // Premium: -10% of original
        price = Math.round(original * (1 - disc / 100) - original * 0.10);
      }

      return price;
    };

    return {
      discount: disc,
      marketPrice,
      trend,
      prices: {
        '6 months': applyDiscounts(orig6m),
        '1 year':   applyDiscounts(orig1y),
        '2 years':  applyDiscounts(orig2y),
      },
      originalPrices: {
        '6 months': orig6m,
        '1 year':   orig1y,
        '2 years':  orig2y,
      },
      liveOriginals: {
        '6 months': orig6m,
        '1 year':   orig1y,
        '2 years':  orig2y,
      },
    };
  };

  return { marketPrice, trend, loading, getPrices };
};
