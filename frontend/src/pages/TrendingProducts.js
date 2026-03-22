import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../components/LanguageContext";
import staticProducts from "../data/products";
import { useAuth } from "../components/AuthContext";
import { useLivePrice } from "../utils/useLivePrice";
import "../styles/SectionPage.css";

function TrendingProducts() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getPrices } = useLivePrice();

  const trendingProducts = [3, 7, 2, 4, 6, 9]
    .map(id => {
      const p = staticProducts.find(s => s.id === id);
      if (!p) return null;
      const lp = getPrices(id, user?.isPremium);
      return { ...p, prices: lp.prices, originalPrices: lp.originalPrices, discount: lp.discount };
    })
    .filter(Boolean);

  return (
    <div className="section-page">
      <div className="section-header">
        <h1>🔥 {t('trendingProduct')}s</h1>
        <p className="section-subtitle">{t('mostPopularRice')}</p>
      </div>
      {trendingProducts.length > 0 ? (
        <div className="trending-section">
          <div className="trending-grid">
            {trendingProducts.map((product, index) => (
              <div key={product.id} className={`trending-card trending-card-${index + 1}`} onClick={() => navigate(`/product/${product.id}`)}>
                <div className="trending-rank">#{index + 1}</div>
                <div className="trending-image-container">
                  <img src={product.images[0]} alt={t(product.name)} />
                  <div className="trending-overlay"><span className="trending-view-btn">View Details</span></div>
                </div>
                <div className="trending-info">
                  <h3>{t(product.name)}</h3>
                  <div className="trending-price">
                    <span className="current">₹{product.prices["1 year"]}</span>
                    <span className="per-kg">/{t('kg')}</span>
                  </div>
                  <div className="trending-stats">
                    <span className="trending-badge">🔥 {t('trending')}</span>
                    <span className="trending-rating">⭐ 4.{Math.max(8 - index, 3)}/5</span>
                  </div>
                  <p className="trending-description">{t(product.healthBenefits[0])}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-items">
          <div className="no-items-icon">🔥</div>
          <h2>No Trending Products</h2>
          <button onClick={() => navigate("/")}>Go to Home</button>
        </div>
      )}
    </div>
  );
}

export default TrendingProducts;
