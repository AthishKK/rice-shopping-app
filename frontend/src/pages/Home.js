import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../components/LanguageContext";
import { useAuth } from "../components/AuthContext";
import staticProducts from "../data/products";
import { useLivePrice } from "../utils/useLivePrice";
import { getStockStatusDisplay } from "../hooks/useStock";
import { loadProductMapping, getStaticIdFromDbId } from "../utils/productMapping";
import "../styles/Home.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user, isAuthenticated, upgradeToPremium } = useAuth();
  const { marketPrice, trend, getPrices } = useLivePrice();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedHealth, setExpandedHealth] = useState({});
  const [flashSaleTime, setFlashSaleTime] = useState({});
  const [premiumMessage, setPremiumMessage] = useState("");
  const [activeFestival, setActiveFestival] = useState(null);
  const [dbFlashProductNames, setDbFlashProductNames] = useState([]);
  const [productStocks, setProductStocks] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/admin/festivals/active`)
      .then(r => r.json()).then(d => setActiveFestival(d.festival || null)).catch(() => {});
    fetch(`${API_URL}/products?flashSale=true`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && d.length > 0
        ? setDbFlashProductNames(d.map(p => ({ name: p.name, discount: p.flashSaleDiscount })))
        : null)
      .catch(() => {});

    const loadStockData = async () => {
      try {
        await loadProductMapping();
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        const stockData = {};

        for (const product of products) {
          try {
            const stockResponse = await fetch(`${API_URL}/products/${product._id}/stock-summary`);
            if (stockResponse.ok) {
              const stockSummary = await stockResponse.json();
              let status = 'in-stock';
              let minQuantity = 50;

              if (stockSummary.outOfStock > 0 && stockSummary.inStock === 0 && stockSummary.lowStock === 0) {
                status = 'out-of-stock';
                minQuantity = 0;
              } else if (stockSummary.lowStock > 0 && stockSummary.inStock === 0) {
                status = 'low-stock';
                const lowStockVariants = stockSummary.variants.filter(v => v.quantity <= 8 && v.quantity > 0);
                if (lowStockVariants.length > 0) {
                  minQuantity = Math.min(...lowStockVariants.map(v => v.quantity));
                }
              }

              const staticId = getStaticIdFromDbId(product._id);
              if (staticId) stockData[staticId] = { status, quantity: minQuantity };
            }
          } catch {}
        }

        staticProducts.forEach(product => {
          if (!stockData[product.id]) stockData[product.id] = { status: 'in-stock', quantity: 50 };
        });

        setProductStocks(stockData);
      } catch {
        const defaultStocks = {};
        staticProducts.forEach(product => {
          defaultStocks[product.id] = { status: 'in-stock', quantity: 50 };
        });
        setProductStocks(defaultStocks);
      }
    };

    loadStockData();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setSearchTerm(urlParams.get('search') || "");
  }, [location.search]);

  useEffect(() => {
    const end = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const timer = setInterval(() => {
      const diff = end - new Date();
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        const times = {};
        staticProducts.forEach(p => { times[p.id] = timeStr; });
        setFlashSaleTime(times);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleHealth = (productId, e) => {
    e.stopPropagation();
    setExpandedHealth(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleJoinPremium = async () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: '/', message: 'Please login to join premium membership' } }); return; }
    if (user?.isPremium) { setPremiumMessage('You are already a premium member!'); setTimeout(() => setPremiumMessage(''), 3000); return; }
    try {
      const result = await upgradeToPremium();
      setPremiumMessage(result.message);
      setTimeout(() => setPremiumMessage(''), result.success ? 5000 : 3000);
    } catch { setPremiumMessage('An error occurred. Please try again.'); setTimeout(() => setPremiumMessage(''), 3000); }
  };

  const products = staticProducts.map(p => {
    const lp = getPrices(p.id, user?.isPremium);
    const stockInfo = productStocks[p.id] || { status: 'in-stock', quantity: 50 };
    return { ...p, prices: lp.prices, originalPrices: lp.originalPrices, discount: lp.discount, isPremiumPrice: user?.isPremium, stockInfo };
  });

  const flashSaleProducts = dbFlashProductNames.length > 0
    ? dbFlashProductNames.map(({ name, discount }) => {
        const p = staticProducts.find(s => s.name === name);
        if (!p) return null;
        const lp = getPrices(p.id, user?.isPremium);
        return { ...p, prices: lp.prices, originalPrices: lp.originalPrices, flashSaleDiscount: discount };
      }).filter(Boolean)
    : staticProducts.filter(p => p.flashSale).map(p => {
        const lp = getPrices(p.id, user?.isPremium);
        return { ...p, prices: lp.prices, originalPrices: lp.originalPrices };
      });

  const getTodaysDeals = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const dealConfigs = [
      { productId: 1, weight: 5, age: "1 year" },
      { productId: 3, weight: 3, age: "2 years" },
      { productId: 5, weight: 2, age: "1 year" },
      { productId: 7, weight: 4, age: "6 months" },
      { productId: 2, weight: 3, age: "1 year" },
      { productId: 8, weight: 2, age: "2 years" },
      { productId: 4, weight: 5, age: "1 year" }
    ];
    const deals = [];
    for (let i = 0; i < 4; i++) {
      const cfg = dealConfigs[(dayOfYear + i) % dealConfigs.length];
      const product = staticProducts.find(p => p.id === cfg.productId);
      if (!product) continue;
      const normalLp = getPrices(cfg.productId, user?.isPremium, false);
      const dealLp = getPrices(cfg.productId, user?.isPremium, true);
      const normalPrice = normalLp.prices[cfg.age];
      const dealPrice = dealLp.prices[cfg.age];
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
        savings: (normalPrice - dealPrice) * cfg.weight
      });
    }
    return deals;
  };
  const todaysDeals = getTodaysDeals();

  const trendingProducts = [3, 7, 2].map(id => {
    const p = staticProducts.find(s => s.id === id);
    if (!p) return null;
    const lp = getPrices(id, user?.isPremium);
    return { ...p, prices: lp.prices, originalPrices: lp.originalPrices, discount: lp.discount };
  }).filter(Boolean);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="home-page">
      <div className="banners-section">
        <div className="festival-banner">
          {activeFestival ? activeFestival.bannerText : `🌾 ${t('freeDeliveryOnOrders')}`}
          <span style={{ marginLeft: '12px', fontSize: '0.85em', opacity: 0.9 }}>
            📊 {t('marketPrice')}: ₹{marketPrice}/kg {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {t('stable')}
          </span>
        </div>
        <div className="free-delivery-banner">🚚 {t('freeDelivery')}</div>
      </div>

      {flashSaleProducts.length > 0 && (
        <div className="flash-sale-section">
          <h2>🔥 {t('flashSale')}</h2>
          <div className="flash-sale-grid">
            {flashSaleProducts.map(product => (
              <div key={product.id} className="flash-sale-card" onClick={() => navigate(`/product/${product.id}`)}>
                <img src={product.images[0]} alt={t(product.name)} />
                <h3>{t(product.name)}</h3>
                <div className="flash-price">
                  <span className="original">₹{product.originalPrices["1 year"]}</span>
                  <span className="discounted">₹{product.prices["1 year"]}</span>
                  {user?.isPremium && (
                    <div style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', color: '#8b4513', padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', marginTop: '5px', display: 'inline-block', border: '2px solid #ffd700', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                      🌟 {t('premiumDiscount')}
                    </div>
                  )}
                </div>
                <div className="flash-timer">⏰ {flashSaleTime[product.id] || "06:00:00"} {t('left')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {todaysDeals.length > 0 && (
        <div className="todays-deals-section">
          <div className="deals-header">
            <h2>🛍️ {t('todaysDeals')}</h2>
            <p className="deals-subtitle">{t('limitedOffersExtraDiscounts')}</p>
          </div>
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
                <div className="deal-badge-container">
                  <div className="deal-badge">{t('todaysDeal')}</div>
                  <div className="extra-discount-badge">+{deal.extraDiscount}% {t('extraOff')}</div>
                </div>
                <div className="deal-image-container">
                  <img src={deal.images[0]} alt={deal.name} />
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
                        <div style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', color: '#8b4513', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', marginTop: '5px', display: 'inline-block', border: '2px solid #ffd700', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                          🌟 {t('premiumDiscount')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="deal-benefits">
                    <div className="benefit-item"><span className="benefit-icon">🌿</span><span>{t(deal.healthBenefits[0])}</span></div>
                    <div className="benefit-item"><span className="benefit-icon">⭐</span><span>{t(deal.healthBenefits[1] || 'Premium Quality')}</span></div>
                  </div>
                  <div className="deal-timer"><span className="timer-icon">⏰</span><span>Deal expires at midnight!</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trendingProducts.length > 0 && (
        <div className="trending-section">
          <div className="trending-header">
            <h2>🔥 {t('trendingProduct')}s</h2>
            <p className="trending-subtitle">{t('mostPopularRice')}</p>
          </div>
          <div className="trending-grid">
            {trendingProducts.map((product, index) => (
              <div key={product.id} className={`trending-card trending-card-${index + 1}`} onClick={() => navigate(`/product/${product.id}`)}>
                <div className="trending-rank">#{index + 1}</div>
                <div className="trending-image-container">
                  <img src={product.images[0]} alt={product.name} />
                  <div className="trending-overlay"><span className="trending-view-btn">View Details</span></div>
                </div>
                <div className="trending-info">
                  <h3>{t(product.name)}</h3>
                  <div className="trending-price">
                    <span className="current">₹{product.prices["1 year"]}</span>
                    <span className="per-kg">/{t('kg')}</span>
                    {user?.isPremium && (
                      <div style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', color: '#8b4513', padding: '3px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', marginTop: '3px', display: 'inline-block', border: '1px solid #ffd700', boxShadow: '0 1px 4px rgba(255,215,0,0.3)' }}>
                        🌟 {t('premiumDiscount')}
                      </div>
                    )}
                  </div>
                  <div className="trending-stats">
                    <span className="trending-badge">🔥 {t('trending')}</span>
                    <span className="trending-rating">⭐ 4.{8 - index}/5</span>
                  </div>
                  <p className="trending-description">{t(product.healthBenefits[0])}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="membership-banner">
        <div className="membership-card">
          <h3>🌾 {t('riceMartPremium')}</h3>
          <p className="membership-price">₹199 / year</p>
          <div className="membership-benefits">
            <p>✔ 10% {t('discountOnAllRice')}</p>
            <p>✔ {t('freeDelivery2')}</p>
            <p>✔ {t('earlyAccess')}</p>
          </div>
          {premiumMessage && (
            <div className={`premium-message ${premiumMessage.includes('Congratulations') ? 'success' : 'info'}`}>{premiumMessage}</div>
          )}
          <button onClick={handleJoinPremium}>{user?.isPremium ? t('alreadyPremium') + ' ✓' : t('joinNow')}</button>
        </div>
      </div>

      <main className="products-grid">
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          {searchTerm
            ? <h2 className="products-heading" style={{ margin: 0 }}>Search Results for "{searchTerm}" ({filteredProducts.length} found)</h2>
            : <h2 className="products-heading" style={{ margin: 0 }}>{t('allProducts')}</h2>}
          <button
            onClick={() => navigate('/all-products', { state: { openFilters: true } })}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,107,53,0.3)', whiteSpace: 'nowrap' }}
          >
            🔍 Filter Products
          </button>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search</p>
            <button onClick={() => { setSearchTerm(""); navigate("/", { replace: true }); }}>Clear Search</button>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
              <div className="image-slider">
                <img src={product.images[0]} alt={t(product.name)} />
                {product.discount && (
                  <div className="discount-badge">{product.discount}% {t('off')}</div>
                )}
              </div>
              <h3>{t(product.name)}</h3>
              <div className="price-section">
                <div className="current-price">₹{product.prices["1 year"]}/{t('kg')}</div>
                <div className="original-price">₹{product.originalPrices["1 year"]}/{t('kg')}</div>
                <div className="discount-text">{product.discount}% {t('off')}</div>
                {user?.isPremium && (
                  <div style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', color: '#8b4513', padding: '6px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: '700', marginTop: '8px', display: 'inline-block', border: '2px solid #ffd700', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                    🌟 {t('premiumDiscount')}
                  </div>
                )}
              </div>
              <p className="age">{t('available')}: 6 {t('months')}, 1 {t('year')}, 2 {t('years')} {t('aged')}</p>
              <p className="type">{t('type')}: {t(product.type)}</p>

              {(() => {
                const stockDisplay = getStockStatusDisplay(product.stockInfo?.status || 'in-stock', product.stockInfo?.quantity || 50);
                return (
                  <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', margin: '8px 0', backgroundColor: stockDisplay.color + '20', color: stockDisplay.color, border: `1px solid ${stockDisplay.color}40`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{stockDisplay.icon}</span>
                    <span>{stockDisplay.text}</span>
                  </div>
                );
              })()}

              <div className="health-benefits-section">
                <button className="health-btn" onClick={(e) => toggleHealth(product.id, e)}>
                  {t('healthBenefits')} {expandedHealth[product.id] ? '▲' : '▼'}
                </button>
                {expandedHealth[product.id] && (
                  <div className="health-benefits-list">
                    <ul>
                      {product.healthBenefits.map((benefit, idx) => (
                        <li key={idx}>• {t(benefit)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button className="view-btn">{t('viewProduct')}</button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default Home;
