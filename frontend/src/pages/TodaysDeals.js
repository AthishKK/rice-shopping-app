import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../components/LanguageContext";
import { useAuth } from "../components/AuthContext";
import staticProducts from "../data/products";
import { useLivePrice } from "../utils/useLivePrice";
import { getStockStatusDisplay } from "../hooks/useStock";
import "../styles/SectionPage.css";

function TodaysDeals() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getPrices } = useLivePrice();
  const [productStocks, setProductStocks] = useState({});
  const [todaysDeals, setTodaysDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load stock information
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load stock information
        const stockResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/products`);
        const products = await stockResponse.json();
        const stockData = {};
        
        products.forEach(product => {
          if (product.stock) {
            stockData[product._id] = product.stock;
          }
        });
        
        setProductStocks(stockData);
        
        // Use the same logic as Home page for consistency
        setTodaysDeals(getTodaysDealsLegacy(stockData));
        
      } catch (error) {
        console.error('Failed to load today\'s deals:', error);
        // Use legacy method with empty stock data
        setTodaysDeals(getTodaysDealsLegacy({}));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.isPremium]);

  // Get today's deals - same for all users, changes only at midnight
  const getTodaysDealsLegacy = (stockData = {}) => {
    const today = new Date();
    // Use today's date as seed to ensure same deals for all users throughout the day
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    
    const dealConfigs = [
      { productId: 1, weight: 5, age: "1 year" },
      { productId: 3, weight: 3, age: "2 years" },
      { productId: 5, weight: 2, age: "1 year" },
      { productId: 7, weight: 4, age: "6 months" },
      { productId: 2, weight: 3, age: "1 year" },
      { productId: 8, weight: 2, age: "2 years" },
      { productId: 4, weight: 5, age: "1 year" },
      { productId: 6, weight: 3, age: "1 year" },
      { productId: 9, weight: 4, age: "2 years" },
      { productId: 10, weight: 2, age: "6 months" }
    ];
    
    const deals = [];
    // Use dayOfYear to select consistent deals for the entire day
    for (let i = 0; i < 4; i++) {
      const cfg = dealConfigs[(dayOfYear + i) % dealConfigs.length];
      const product = staticProducts.find(p => p.id === cfg.productId);
      if (!product) continue;
      
      const normalLp = getPrices(cfg.productId, user?.isPremium, false);
      const dealLp = getPrices(cfg.productId, user?.isPremium, true);
      const normalPrice = normalLp.prices[cfg.age];
      const dealPrice = dealLp.prices[cfg.age];
      const stockInfo = stockData[product.id] || { status: 'in-stock', quantity: 50 };
      
      deals.push({
        ...product,
        prices: dealLp.prices,
        originalPrices: dealLp.originalPrices,
        discount: dealLp.discount,
        dealWeight: cfg.weight,
        dealAge: cfg.age,
        dealPrice,
        dealTotalPrice: dealPrice * cfg.weight,
        originalTotalPrice: normalPrice * cfg.weight,
        totalDiscount: dealLp.discount + 5,
        extraDiscount: 5,
        savings: (normalPrice - dealPrice) * cfg.weight,
        stockInfo,
        dealDate: dateString // Add date for debugging
      });
    }
    return deals;
  };

  if (loading) {
    return (
      <div className="section-page">
        <div className="section-header">
          <h1>🛍️ {t('todaysDeals')}</h1>
          <p className="section-subtitle">{t('limitedOffersExtraDiscounts')}</p>
        </div>
        <div className="loading-container" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #ff6b35',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Loading today's deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-page">
      <div className="section-header">
        <h1>🛍️ {t('todaysDeals')}</h1>
        <p className="section-subtitle">{t('limitedOffersExtraDiscounts')}</p>
      </div>
      {todaysDeals.length > 0 ? (
        <div className="todays-deals-section">
          <div className="deals-grid">
            {todaysDeals.map((deal, index) => (
              <div key={`${deal.id}-${deal.dealAge}-${deal.dealWeight}`}
                className={`deal-card deal-card-${index + 1}`}
                onClick={() => navigate(`/product/${deal.id}`, { state: {
                  dealMode: true, dealWeight: deal.dealWeight, dealAge: deal.dealAge,
                  dealPrice: deal.dealPrice, dealTotalPrice: deal.dealTotalPrice,
                  originalTotalPrice: deal.originalTotalPrice, totalDiscount: deal.totalDiscount,
                  extraDiscount: deal.extraDiscount, savings: deal.savings
                }})}>
                {user?.isPremium && (
                  <div className="premium-deal-top-badge" style={{
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                    color: '#8b4513',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '700',
                    border: '2px solid #ffd700',
                    boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
                    position: 'absolute',
                    top: '50px',
                    right: '10px',
                    zIndex: '15'
                  }}>
                    🌟 {t('premiumDiscount')}
                  </div>
                )}
                <div className="deal-badge-container">
                  <div className="deal-badge">{t('todaysDeal')}</div>
                  <div className="extra-discount-badge">+{deal.extraDiscount}% {t('extraOff')}</div>
                </div>
                <div className="deal-image-container">
                  <img src={deal.images[0]} alt={t(deal.name)} />
                  <div className="deal-overlay"><span className="deal-view-btn">View Product</span></div>
                </div>
                <div className="deal-content">
                  <h3>{t(deal.name)}</h3>
                  <div className="deal-specs">
                    <div className="spec-item"><span className="spec-label">{t('weight')}:</span><span className="spec-value">{deal.dealWeight} {t('kg')}</span></div>
                    <div className="spec-item"><span className="spec-label">{t('age')}:</span><span className="spec-value">{deal.dealAge}</span></div>
                    <div className="spec-item"><span className="spec-label">{t('type')}:</span><span className="spec-value">{t(deal.type)}</span></div>
                  </div>
                  <div className="deal-pricing">
                    <div className="price-breakdown">
                      <div className="per-kg-price">
                        <span className="current-per-kg">₹{deal.dealPrice}</span>
                        <span className="original-per-kg">₹{deal.originalPrices[deal.dealAge]}</span>
                        <span className="per-kg-label">/{t('kg')}</span>
                      </div>
                      <div className="total-price">
                        <span className="deal-total">₹{deal.dealTotalPrice}</span>
                        <span className="original-total">₹{deal.originalTotalPrice}</span>
                      </div>
                    </div>
                    <div className="savings-info">
                      <span className="discount-percent">{deal.totalDiscount}% {t('off')}</span>
                      <span className="savings-amount">Save ₹{deal.savings}</span>
                      {user?.isPremium && (
                        <div className="premium-deal-badge" style={{
                          background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                          color: '#8b4513',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          marginTop: '5px',
                          display: 'inline-block',
                          border: '2px solid #ffd700',
                          boxShadow: '0 2px 8px rgba(255,215,0,0.3)'
                        }}>
                          🌟 {t('premiumDiscount')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="deal-benefits">
                    <div className="benefit-item"><span className="benefit-icon">🌿</span><span>{t(deal.healthBenefits[0])}</span></div>
                    <div className="benefit-item"><span className="benefit-icon">⭐</span><span>{t(deal.healthBenefits[1] || 'Premium Quality')}</span></div>
                  </div>
                  
                  {/* Stock Status Display */}
                  {(() => {
                    const stockDisplay = getStockStatusDisplay(deal.stockInfo?.status || 'in-stock', deal.stockInfo?.quantity || 50);
                    return (
                      <div className="stock-status" style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        margin: '8px 0',
                        backgroundColor: stockDisplay.color + '20',
                        color: stockDisplay.color,
                        border: `1px solid ${stockDisplay.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>{stockDisplay.icon}</span>
                        <span>{stockDisplay.text}</span>
                      </div>
                    );
                  })()}
                  
                  <div className="deal-timer"><span className="timer-icon">⏰</span><span>Deal expires at midnight!</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-items">
          <div className="no-items-icon">🛍️</div>
          <h2>No Deals Today</h2>
          <p>Check back tomorrow for new deals!</p>
          <button onClick={() => navigate("/")}>Go to Home</button>
        </div>
      )}
    </div>
  );
}

export default TodaysDeals;
