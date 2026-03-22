import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../components/CartContext";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";
import products from "../data/products";
import { useLivePrice } from "../utils/useLivePrice";
import { useStockCheck, getStockStatusDisplay } from "../hooks/useStock";
import { loadProductMapping, getDbIdFromStaticId } from "../utils/productMapping";
import "../styles/ProductPage.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const product = products.find((p) => p.id === parseInt(id));
  const { marketPrice, trend, getPrices } = useLivePrice();

  const dealData = location.state;
  const isDealMode = dealData?.dealMode;

  const [selectedAge, setSelectedAge] = useState(isDealMode ? dealData.dealAge : "1 year");
  const [selectedWeight, setSelectedWeight] = useState(isDealMode ? dealData.dealWeight : 1);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState("");
  const [addToCartModal, setAddToCartModal] = useState(false);
  const [dbProductId, setDbProductId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsAvgRating, setReviewsAvgRating] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  
  // Load database product ID
  useEffect(() => {
    const loadDbId = async () => {
      await loadProductMapping();
      const dbId = getDbIdFromStaticId(product?.id);
      console.log('Product DB ID loaded:', dbId, 'for static ID:', product?.id);
      setDbProductId(dbId);
      // Fetch reviews once we have the DB id
      if (dbId) {
        console.log('Fetching reviews for product:', dbId);
        fetch(`${API_URL}/reviews/product/${dbId}`)
          .then(r => {
            console.log('Reviews response status:', r.status);
            return r.ok ? r.json() : { reviews: [], avgRating: 0, total: 0 };
          })
          .then(data => {
            console.log('Reviews data received:', data);
            setReviews(data.reviews || []);
            setReviewsAvgRating(parseFloat(data.avgRating) || 0);
            setReviewsTotal(data.total || 0);
          })
          .catch(err => {
            console.error('Failed to fetch reviews:', err);
          });
      }
    };
    if (product) {
      loadDbId();
    }
  }, [product]);
  
  // Stock checking
  const weightWithKg = `${selectedWeight}kg`;
  const stockStatus = useStockCheck(dbProductId, selectedAge, weightWithKg, quantity);

  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const imageWidth = rect.width;
    if (clickX < imageWidth / 2 && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (clickX >= imageWidth / 2 && currentImageIndex < product?.images?.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? "" : section);
  };

  if (!product) {
    return <div className="not-found">Product not found</div>;
  }

  const ages = ["6 months", "1 year", "2 years"];
  const weights = [1, 2, 3, 4, 5, 10, 25, 26, 50];

  // Compute live prices using the hook
  const lp = product ? getPrices(product.id, user?.isPremium && !isDealMode) : null;
  const livePrices = lp?.prices || {};
  const liveOriginals = lp?.liveOriginals || lp?.originalPrices || {};
  const liveDiscount = lp?.discount || 14;

  let pricePerKg, originalPricePerKg, totalPrice, originalTotalPrice, isPremiumPrice = false;

  if (isDealMode) {
    pricePerKg = dealData.dealPrice;
    originalPricePerKg = liveOriginals[selectedAge] || dealData.originalTotalPrice;
    totalPrice = dealData.dealTotalPrice * quantity;
    originalTotalPrice = dealData.originalTotalPrice * quantity;
  } else {
    pricePerKg = livePrices[selectedAge] || 0;
    originalPricePerKg = liveOriginals[selectedAge] || 0;
    totalPrice = pricePerKg * selectedWeight * quantity;
    originalTotalPrice = originalPricePerKg * selectedWeight * quantity;
    isPremiumPrice = !!user?.isPremium;
  }

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/product/" + id, message: "Please login to add items to cart" } });
      return;
    }
    
    // Check stock availability before adding to cart
    if (!stockStatus.available) {
      alert(`Sorry, this item is not available. ${stockStatus.message}`);
      return;
    }
    
    addToCart({
      id: `${product.id}-${selectedAge}-${selectedWeight}`,
      productId: product.id,
      name: product.name,
      age: selectedAge,
      weight: selectedWeight,
      pricePerKg,
      price: totalPrice,
      quantity,
      image: product.images[0]
    });
    setAddToCartModal(true);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/product/" + id, message: "Please login to continue with purchase" } });
      return;
    }
    
    // Check stock availability before buying
    if (!stockStatus.available) {
      alert(`Sorry, this item is not available. ${stockStatus.message}`);
      return;
    }
    
    navigate("/checkout", {
      state: {
        item: {
          id: `${product.id}-${selectedAge}-${selectedWeight}`,
          productId: product.id,
          name: product.name,
          age: selectedAge,
          weight: selectedWeight,
          pricePerKg,
          price: totalPrice,
          quantity,
          image: product.images[0]
        }
      }
    });
  };

  return (
    <div className="product-page">
      <div className="product-container">
        <div className="product-left">
          <div className="product-images">
            <div className="main-image-container" onClick={handleImageClick}>
              <img src={product.images[currentImageIndex]} alt={product.name} className="main-image" />
              {currentImageIndex > 0 && <div className="image-arrow left">◀</div>}
              {currentImageIndex < product.images.length - 1 && <div className="image-arrow right">▶</div>}
              <div className="image-indicator">{currentImageIndex + 1} / {product.images.length}</div>
            </div>
            <div className="thumbnail-images">
              {product.images.map((img, idx) => (
                <img key={idx} src={img} alt={`${product.name} ${idx + 1}`}
                  className={currentImageIndex === idx ? "active" : ""}
                  onClick={() => setCurrentImageIndex(idx)} />
              ))}
            </div>
          </div>

          <div className="expandable-sections">
            <div className={`info-section health-section${expandedSection === "health" ? " open" : ""}`}>
              <div className="section-header" onClick={() => toggleSection("health")}>
                <span className="section-icon">💚</span>
                <span className="section-title">{t('healthBenefits')}</span>
                <span className={`expand-arrow ${expandedSection === "health" ? "expanded" : ""}`}>▼</span>
              </div>
              <div className="section-content">
                <ul className="health-benefits-list">
                  {product.healthBenefits.map((benefit, idx) => <li key={idx}>✓ {benefit}</li>)}
                </ul>
              </div>
            </div>

            <div className={`info-section delivery-section${expandedSection === "delivery" ? " open" : ""}`}>
              <div className="section-header" onClick={() => toggleSection("delivery")}>
                <span className="section-icon">🚚</span>
                <span className="section-title">{t('deliveryInfo')}</span>
                <span className={`expand-arrow ${expandedSection === "delivery" ? "expanded" : ""}`}>▼</span>
              </div>
              <div className="section-content">
                <div className="delivery-details">
                  <p>✅ {t('freeDeliveryWithin')}</p>
                  <p>📍 {t('location')}: {t('chennai')}</p>
                  <p>🏪 {t('shipsFrom')}</p>
                  <p>⏰ {t('orderBefore6pm')}</p>
                </div>
              </div>
            </div>

            <div className={`info-section return-section${expandedSection === "return" ? " open" : ""}`}>
              <div className="section-header" onClick={() => toggleSection("return")}>
                <span className="section-icon">🔄</span>
                <span className="section-title">{t('returnPolicy')}</span>
                <span className={`expand-arrow ${expandedSection === "return" ? "expanded" : ""}`}>▼</span>
              </div>
              <div className="section-content">
                <div className="return-details">
                  <p>✔ {t('dayReturnPolicy')}</p>
                  <p>✔ {t('damagedProductReplacement')}</p>
                  <p>✔ {t('fullRefundAvailable')}</p>
                  <p>✔ {t('noQuestionsAsked')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="product-right">
          <div className="product-info">
            <h1 className="product-name">{t(product.name)}</h1>

            <div className="rating-section">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(reviewsAvgRating || product.rating) ? 'filled' : ''}>★</span>
                ))}
              </div>
              <span className="rating-text">
                {reviewsTotal > 0
                  ? `${reviewsAvgRating} (${reviewsTotal} ${reviewsTotal === 1 ? 'review' : 'reviews'})`
                  : `${product.rating} (${product.reviews} ${t('reviews')})`
                }
              </span>
            </div>

            <div className="dynamic-pricing-info">
              <span>📊 {t('liveMarketPrice')}: ₹{marketPrice}/{t('kg')}</span>
              <span className={trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : ''}>
                {trend === 'up' ? ' ↑' : trend === 'down' ? ' ↓' : ' →'} {t('stable')}
              </span>
            </div>

            <div className="price-section">
              {isDealMode && (
                <div className="deal-mode-banner">
                  <span className="deal-badge">🎯 {t('todaysDeal')}</span>
                  <span className="extra-discount">+{dealData.extraDiscount}% {t('extraOff')}</span>
                  {user?.isPremium && (
                    <span className="premium-deal-indicator" style={{
                      background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                      color: '#8b4513',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      marginLeft: '10px',
                      border: '2px solid #ffd700',
                      boxShadow: '0 2px 8px rgba(255,215,0,0.3)'
                    }}>
                      🌟 {t('premiumDiscount')}
                    </span>
                  )}
                </div>
              )}
              {isPremiumPrice && !isDealMode && (
                <div className="premium-mode-banner">
                  <span className="premium-badge">⭐ {t('premiumMember')}</span>
                  <span className="premium-discount">{t('premiumDiscountApplied')}</span>
                </div>
              )}
              <div className="price-per-kg">
                <span className="original-price">₹{originalPricePerKg}/kg</span>
                <span className="current-price">
                  ₹{pricePerKg}/kg
                  {isPremiumPrice && <span className="premium-tag">{t('premium')}</span>}
                </span>
                <span className="discount-badge">
                  {isDealMode ? dealData.totalDiscount : (isPremiumPrice ? liveDiscount + 10 : liveDiscount)}% OFF
                </span>
              </div>
              <div className="total-price-display">
                <span className="total-label">{t('totalPrice')}: </span>
                <span className="original-total">₹{originalTotalPrice}</span>
                <span className="total-amount">₹{totalPrice}</span>
                {isDealMode && <span className="deal-savings">{t('youSave')} ₹{dealData.savings * quantity}!</span>}
                {isPremiumPrice && !isDealMode && (
                  <span className="premium-savings">{t('premiumSavings')}: ₹{Math.round((product.prices[selectedAge] - pricePerKg) * selectedWeight * quantity)}!</span>
                )}
              </div>
            </div>

            {/* Stock Status Display */}
            {(() => {
              const stockDisplay = getStockStatusDisplay(stockStatus.available ? 'in-stock' : 'out-of-stock', stockStatus.currentStock);
              return (
                <div className="stock-status-section" style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  margin: '16px 0',
                  backgroundColor: stockDisplay.color + '20',
                  color: stockDisplay.color,
                  border: `2px solid ${stockDisplay.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '18px' }}>{stockDisplay.icon}</span>
                  <div>
                    <div>{stockDisplay.text}</div>
                    {stockStatus.loading && <div style={{ fontSize: '12px', opacity: 0.8 }}>Checking availability...</div>}
                    {!stockStatus.available && !stockStatus.loading && (
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>{stockStatus.message}</div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="selection-section">
              <div className="age-selection">
                <h3>{t('selectAge')}:</h3>
                {isDealMode ? (
                  <div className="locked-selection">
                    <div className="locked-option">
                      <span className="lock-icon">🔒</span>
                      <span className="locked-value">{selectedAge}</span>
                      <span className="locked-label">({t('dealFixed')})</span>
                    </div>
                  </div>
                ) : (
                  <div className="age-options">
                    {ages.map((age) => (
                      <button key={age} className={`age-btn ${selectedAge === age ? "selected" : ""}`}
                        onClick={() => setSelectedAge(age)}>
                        {age === "6 months" ? `6 ${t('months')}` : age === "1 year" ? `1 ${t('year')}` : `2 ${t('years')}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="weight-selection">
                <h3>{t('selectWeight')}:</h3>
                {isDealMode ? (
                  <div className="locked-selection">
                    <div className="locked-option">
                      <span className="lock-icon">🔒</span>
                      <span className="locked-value">{selectedWeight} {t('kg')}</span>
                      <span className="locked-label">({t('dealFixed')})</span>
                    </div>
                  </div>
                ) : (
                  <div className="weight-options">
                    {weights.map((weight) => (
                      <button key={weight} className={`weight-btn ${selectedWeight === weight ? "selected" : ""}`}
                        onClick={() => setSelectedWeight(weight)}>
                        {weight} {t('kg')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="quantity-selection">
                <h3>{t('quantity')}:</h3>
                <div className="quantity-controls">
                  <button className="quantity-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>−</button>
                  <span className="quantity-display">{quantity}</span>
                  <button className="quantity-btn" onClick={() => handleQuantityChange(1)} disabled={quantity >= 10}>+</button>
                </div>
              </div>
            </div>

            <div className="type-color-section">
              <div className="type-info-item">
                <span className="info-icon">🌾</span>
                <span className="info-label">{t('type')}:</span>
                <span className="info-value">{t(product.type)} Rice</span>
              </div>
              <div className="color-info-item">
                <span className="info-icon">🎨</span>
                <span className="info-label">{t('color')}:</span>
                <span className="info-value">{t(product.color)}</span>
                <div className={`color-dot ${product.color.toLowerCase()}`}></div>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="add-to-cart-btn" 
                onClick={handleAddToCart}
                disabled={!stockStatus.available || stockStatus.loading}
                style={{
                  opacity: (!stockStatus.available || stockStatus.loading) ? 0.6 : 1,
                  cursor: (!stockStatus.available || stockStatus.loading) ? 'not-allowed' : 'pointer'
                }}
              >
                🛒 {stockStatus.loading ? 'Checking...' : !stockStatus.available ? t('outOfStock') : t('addToCart')}
              </button>
              <button 
                className="buy-now-btn" 
                onClick={handleBuyNow}
                disabled={!stockStatus.available || stockStatus.loading}
                style={{
                  opacity: (!stockStatus.available || stockStatus.loading) ? 0.6 : 1,
                  cursor: (!stockStatus.available || stockStatus.loading) ? 'not-allowed' : 'pointer'
                }}
              >
                ⚡ {stockStatus.loading ? 'Checking...' : !stockStatus.available ? t('outOfStock') : t('buyNow')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      {reviews.length > 0 && (
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>⭐ Customer Reviews</h2>
            <div className="reviews-summary">
              <span className="reviews-avg">{reviewsAvgRating}</span>
              <div className="reviews-stars">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(reviewsAvgRating) ? 'filled' : ''}>★</span>
                ))}
              </div>
              <span className="reviews-count">({reviewsTotal} {reviewsTotal === 1 ? 'review' : 'reviews'})</span>
            </div>
          </div>
          <div className="reviews-list">
            {reviews.map((review, idx) => (
              <div key={idx} className="review-card">
                <div className="review-top">
                  <div className="reviewer-avatar">{review.userId?.name?.charAt(0).toUpperCase() || 'U'}</div>
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.userId?.name || 'User'}</span>
                    <span className="review-date">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'filled' : ''}>★</span>
                    ))}
                  </div>
                </div>
                {review.comment && <p className="review-comment">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {addToCartModal && (
        <div className="modal-overlay" onClick={() => setAddToCartModal(false)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🛍️</div>
            <h2>{t('addedToCart')}!</h2>
            <div className="cart-success-details">
              <img src={product.images[0]} alt={t(product.name)} className="modal-product-img" />
              <div className="success-product-info">
                <h3>{t(product.name)}</h3>
                <p>{quantity}x {selectedWeight}{t('kg')} ({selectedAge} {t('aged')})</p>
                <p className="success-total">{t('total')}: ₹{totalPrice}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => { setAddToCartModal(false); navigate('/cart'); }}>{t('viewCart')}</button>
              <button className="btn-secondary" onClick={() => setAddToCartModal(false)}>{t('continueShopping')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;
