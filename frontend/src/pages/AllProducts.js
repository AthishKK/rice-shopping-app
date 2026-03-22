import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../components/LanguageContext";
import { useAuth } from "../components/AuthContext";
import { getStockStatusDisplay } from "../hooks/useStock";
import staticProducts from "../data/products";
import { useLivePrice } from "../utils/useLivePrice";
import "../styles/SectionPage.css";
import "../styles/Home.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const HEALTH_BENEFITS = {
  'Nei Kichadi Rice': ['Rich in fiber', 'Good for digestion', 'Low glycemic index'],
  'Seeraga Samba Rice': ['Aromatic', 'Rich in antioxidants', 'Good for heart health'],
  'Karuppu Kavuni Rice': ['High in iron', 'Rich in antioxidants', 'Good for anemia'],
  'Mappillai Samba Rice': ['High protein', 'Rich in zinc', 'Boosts immunity'],
  'Karunguruvai Rice': ['Anti-diabetic properties', 'Rich in fiber', 'Good for weight management'],
  'Basmati Rice': ['Low fat', 'Good source of energy', 'Easy to digest'],
  'Kattuyanam Rice': ['Traditional variety', 'Rich in nutrients', 'Good for health'],
  'Poongar Rice': ['High in protein', 'Rich in iron', 'Good for children'],
  'Thooyamalli Rice': ['Aromatic', 'Good for special occasions', 'Rich in flavor'],
  'Red Rice': ['High in fiber', 'Rich in antioxidants', 'Good for heart health']
};

function AllProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getPrices } = useLivePrice();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedHealth, setExpandedHealth] = useState({});
  const [products, setProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedAges, setSelectedAges] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setSearchTerm(urlParams.get('search') || "");
    if (location.state?.openFilters) setShowFilters(true);
  }, [location.search, location.state]);

  useEffect(() => {
    // Build products from static data with live prices — works even when backend is down
    const buildFromStatic = () => {
      return staticProducts.map(p => {
        const lp = getPrices(p.id, user?.isPremium);
        return {
          id: p.id,
          staticId: p.id,
          name: p.name,
          images: p.images,
          type: p.type || 'Premium',
          color: p.color || 'White',
          prices: lp.prices,
          originalPrices: lp.originalPrices,
          discount: lp.discount,
          stockInfo: { status: 'in-stock', quantity: 50 },
          healthBenefits: HEALTH_BENEFITS[p.name] || ['Nutritious', 'Healthy', 'Natural'],
        };
      });
    };

    // Try backend first, fall back to static
    const loadProducts = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_URL}/products`, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) throw new Error('Backend error');
        const backendProducts = await response.json();

        const transformed = backendProducts.map(product => {
          const staticMatch = staticProducts.find(s => s.name === product.name);
          const lp = staticMatch ? getPrices(staticMatch.id, user?.isPremium) : null;
          return {
            id: staticMatch?.id || product._id,
            staticId: staticMatch?.id,
            name: product.name,
            images: staticMatch?.images || [],
            type: product.category || staticMatch?.type || 'Premium',
            color: staticMatch?.color || 'White',
            prices: lp ? lp.prices : {
              '6 months': product.basePremium + 50,
              '1 year': product.basePremium + 70,
              '2 years': product.basePremium + 90
            },
            originalPrices: lp ? lp.originalPrices : {
              '6 months': product.basePremium + 50,
              '1 year': product.basePremium + 70,
              '2 years': product.basePremium + 90
            },
            discount: lp ? lp.discount : 0,
            stockInfo: { status: 'in-stock', quantity: 50 },
            healthBenefits: HEALTH_BENEFITS[product.name] || ['Nutritious', 'Healthy', 'Natural'],
          };
        });
        setProducts(transformed);
      } catch {
        // Backend unavailable — use static data
        setProducts(buildFromStatic());
      }
    };

    loadProducts();
  }, [user?.isPremium]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleHealth = (productId, e) => {
    e.stopPropagation();
    setExpandedHealth(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const handleFilterChange = (value, setFilter, currentFilter) => {
    setFilter(currentFilter.includes(value)
      ? currentFilter.filter(i => i !== value)
      : [...currentFilter, value]);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTypes([]);
    setSelectedColors([]);
    setSelectedAges([]);
    setSelectedPriceRange("");
    navigate("/all-products", { replace: true });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(p.type);
    const matchesColor = selectedColors.length === 0 || selectedColors.includes(p.color);
    const matchesAge = selectedAges.length === 0 || selectedAges.some(age => p.prices[age] !== undefined);
    let matchesPrice = true;
    if (selectedPriceRange) {
      matchesPrice = ["6 months", "1 year", "2 years"].some(age => {
        const price = p.prices[age];
        if (selectedPriceRange === "0-120") return price <= 120;
        if (selectedPriceRange === "120-150") return price > 120 && price <= 150;
        if (selectedPriceRange === "150-180") return price > 150 && price <= 180;
        if (selectedPriceRange === "180-220") return price > 180 && price <= 220;
        if (selectedPriceRange === "220+") return price > 220;
        return true;
      });
    }
    return matchesSearch && matchesType && matchesColor && matchesAge && matchesPrice;
  });

  const recommendations = (() => {
    if (!searchTerm || filteredProducts.length === 0) return [];
    const foundTypes = [...new Set(filteredProducts.map(p => p.type))];
    return products.filter(p =>
      !filteredProducts.some(fp => fp.id === p.id) && foundTypes.includes(p.type)
    ).slice(0, 4);
  })();

  if (products.length === 0) {
    return (
      <div className="section-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #ff6b35', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-page">
      <div className="section-header">
        <h1>🌾 {t('allProducts')}</h1>
        <p className="section-subtitle">{t('discoverCollection')}</p>
        <button
          onClick={() => setShowFilters(true)}
          style={{ marginTop: '15px', padding: '10px 24px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid white', borderRadius: '25px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
        >
          🔍 {t('filters')}
        </button>
      </div>

      {/* Filter Panel */}
      <aside className={`filters ${showFilters ? 'show' : ''}`}>
        <div className="filter-header">
          <h3>{t('filters')}</h3>
          <button className="close-filters" onClick={() => setShowFilters(false)}>×</button>
        </div>
        <button className="clear-filters-btn" onClick={clearFilters}>{t('clearAllFilters')}</button>
        <div className="filter-section">
          <h4>{t('searchRice')}</h4>
          <div className="search-input-wrapper">
            <input type="text" placeholder={t('searchRice')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm && <button className="clear-search-btn" onClick={() => setSearchTerm("")}>×</button>}
          </div>
        </div>
        <div className="filter-section">
          <h4>{t('priceRange')}</h4>
          {[["0-120","₹0 – ₹120"],["120-150","₹120 – ₹150"],["150-180","₹150 – ₹180"],["180-220","₹180 – ₹220"],["220+","₹220+"],["",t('allPrices')]].map(([val, label]) => (
            <label key={val}><input type="radio" name="priceRange" value={val} checked={selectedPriceRange === val} onChange={e => setSelectedPriceRange(e.target.value)} /> {label}</label>
          ))}
        </div>
        <div className="filter-section">
          <h4>{t('riceColor')}</h4>
          {["White","Red","Black","Brown"].map(c => (
            <label key={c}><input type="checkbox" value={c} checked={selectedColors.includes(c)} onChange={e => handleFilterChange(e.target.value, setSelectedColors, selectedColors)} /> {t(c)}</label>
          ))}
        </div>
        <div className="filter-section">
          <h4>{t('riceType')}</h4>
          {["Traditional","Premium","Aromatic"].map(tp => (
            <label key={tp}><input type="checkbox" value={tp} checked={selectedTypes.includes(tp)} onChange={e => handleFilterChange(e.target.value, setSelectedTypes, selectedTypes)} /> {t(tp)}</label>
          ))}
        </div>
        <div className="filter-section">
          <h4>Product Age</h4>
          {[["6 months",`6 ${t('months')}`],["1 year",`1 ${t('year')}`],["2 years",`2 ${t('years')}`]].map(([val, label]) => (
            <label key={val}><input type="checkbox" value={val} checked={selectedAges.includes(val)} onChange={e => handleFilterChange(e.target.value, setSelectedAges, selectedAges)} /> {label}</label>
          ))}
        </div>
      </aside>
      {showFilters && <div className="overlay" onClick={() => setShowFilters(false)}></div>}

      <main className="products-container">
        <h2 className="products-heading">
          {searchTerm ? `Search Results for "${searchTerm}" (${filteredProducts.length} found)` : `${t('allProducts')} (${filteredProducts.length})`}
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
            <button onClick={clearFilters}>Clear All Filters</button>
          </div>
        ) : (
          <div className="products-with-recommendations">
            <div className="search-results-section">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.staticId || product.id}`)}>
                  <div className="image-slider">
                    <img src={product.images[0]} alt={t(product.name)} />
                    {product.discount > 0 && <div className="discount-badge">{product.discount}% {t('off')}</div>}
                  </div>
                  <h3>{t(product.name)}</h3>
                  <div className="price-section">
                    <div className="current-price">₹{product.prices["1 year"]}/{t('kg')}</div>
                    <div className="original-price">₹{product.originalPrices["1 year"]}/{t('kg')}</div>
                    {product.discount > 0 && <div className="discount-text">{product.discount}% {t('off')}</div>}
                    {user?.isPremium && (
                      <div style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', color: '#8b4513', padding: '6px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: '700', marginTop: '8px', display: 'inline-block', border: '2px solid #ffd700' }}>
                        🌟 {t('premiumMember')}
                      </div>
                    )}
                  </div>
                  <p className="age">{t('available')}: 6 {t('months')}, 1 {t('year')}, 2 {t('years')} {t('aged')}</p>
                  <p className="type">{t('type')}: {t(product.type)}</p>
                  {(() => {
                    const s = getStockStatusDisplay(product.stockInfo?.status || 'in-stock', product.stockInfo?.quantity || 50);
                    return (
                      <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', margin: '8px 0', backgroundColor: s.color + '20', color: s.color, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{s.icon}</span><span>{s.text}</span>
                      </div>
                    );
                  })()}
                  <div className="health-benefits-section">
                    <button className="health-btn" onClick={e => toggleHealth(product.id, e)}>
                      {t('healthBenefits')} {expandedHealth[product.id] ? '▲' : '▼'}
                    </button>
                    {expandedHealth[product.id] && (
                      <div className="health-benefits-list">
                        <ul>{product.healthBenefits.map((b, i) => <li key={i}>• {t(b)}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  <button className="view-btn">{t('viewProduct')}</button>
                </div>
              ))}
            </div>

            {searchTerm && recommendations.length > 0 && (
              <div className="recommendations-sidebar">
                <div className="recommendations-header">
                  <h3 className="recommendations-title">👀 You might like this too</h3>
                  <p className="recommendations-subtitle">Similar rice varieties you might enjoy</p>
                </div>
                <div className="recommendations-list">
                  {recommendations.map(product => (
                    <div key={`rec-${product.id}`} className="recommendation-card" onClick={() => navigate(`/product/${product.staticId || product.id}`)}>
                      <div className="recommendation-image">
                        <img src={product.images[0]} alt={t(product.name)} />
                        {product.discount > 0 && <div className="recommendation-badge">{product.discount}% OFF</div>}
                      </div>
                      <div className="recommendation-content">
                        <h4>{t(product.name)}</h4>
                        <div className="recommendation-price">
                          <span className="current">₹{product.prices["1 year"]}</span>
                          <span className="original">₹{product.originalPrices["1 year"]}</span>
                          <span className="per-kg">/{t('kg')}</span>
                        </div>
                        <p className="recommendation-type">{t(product.type)} Rice</p>
                        <button className="recommendation-btn">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AllProducts;
