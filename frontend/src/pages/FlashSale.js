import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../components/LanguageContext";
import { useAuth } from "../components/AuthContext";
import staticProducts from "../data/products";
import { useLivePrice } from "../utils/useLivePrice";
import { getStockStatusDisplay } from "../hooks/useStock";
import "../styles/SectionPage.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function FlashSale() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getPrices } = useLivePrice();
  const [flashSaleTime, setFlashSaleTime] = useState({});
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productStocks, setProductStocks] = useState({});

  useEffect(() => {
    // Fetch live flash sale products from backend
    fetch(`${API_URL}/products?flashSale=true`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge backend pricing with static images
          const merged = data.map(p => {
            const staticMatch = staticProducts.find(s => s.name === p.name);
            return {
              id: p._id,
              name: p.name,
              images: staticMatch?.images || [],
              originalPrice: p.pricing?.originalPricePerKg || p.pricing?.basePrice || 0,
              finalPrice: p.pricing?.pricePerKg || p.pricing?.finalPrice || 0,
              flashSaleDiscount: p.flashSaleDiscount || 0,
              festivalDiscount: p.festivalDiscount || 0,
              discountType: p.pricing?.discountType || 'none',
              appliedDiscount: p.pricing?.appliedDiscount || 0,
              flashSaleEnd: new Date(Date.now() + 6 * 60 * 60 * 1000)
            };
          });
          setFlashSaleProducts(merged);
        } else {
          // Fallback to static
          setFlashSaleProducts(staticProducts.filter(p => p.flashSale).map(p => ({
            id: p.id,
            name: p.name,
            images: p.images,
            originalPrice: p.originalPrices["1 year"],
            finalPrice: p.prices["1 year"],
            flashSaleDiscount: p.discount,
            flashSaleEnd: p.flashSaleEnd
          })));
        }
        setLoading(false);
      })
      .catch(() => {
        setFlashSaleProducts(staticProducts.filter(p => p.flashSale).map(p => ({
          id: p.id,
          name: p.name,
          images: p.images,
          originalPrice: p.originalPrices["1 year"],
          finalPrice: p.prices["1 year"],
          flashSaleDiscount: p.discount,
          flashSaleEnd: p.flashSaleEnd
        })));
        setLoading(false);
      });

    // Fetch active festival
    fetch(`${API_URL}/admin/festivals/active`)
      .then(r => r.json())
      .then(d => setFestival(d.festival || null))
      .catch(() => {});
      
    // Load stock information
    const loadProductStocks = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        const stockData = {};
        
        products.forEach(product => {
          if (product.stock) {
            stockData[product._id] = product.stock;
          }
        });
        
        setProductStocks(stockData);
      } catch (error) {
        console.error('Failed to load product stocks:', error);
      }
    };
    
    loadProductStocks();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimes = {};
      flashSaleProducts.forEach(p => {
        if (p.flashSaleEnd) {
          const diff = new Date(p.flashSaleEnd) - new Date();
          if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            newTimes[p.id] = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
          }
        }
      });
      setFlashSaleTime(newTimes);
    }, 1000);
    return () => clearInterval(timer);
  }, [flashSaleProducts]);

  if (loading) return <div style={{textAlign:'center',padding:'60px',fontSize:'18px'}}>⏳ Loading flash sale...</div>;

  return (
    <div className="section-page">
      <div className="section-header">
        <h1>🔥 {t('flashSale')}</h1>
        {festival && (
          <div style={{background:'#e65100',color:'#fff',padding:'10px 20px',borderRadius:'8px',margin:'10px 0',fontWeight:'bold'}}>
            🎉 {festival.bannerText}
          </div>
        )}
        <p className="section-subtitle">{t('limitedTimeHugeDiscounts')}</p>
      </div>

      {flashSaleProducts.length > 0 ? (
        <div className="flash-sale-section">
          <div className="flash-sale-grid">
            {flashSaleProducts.map(product => {
              const staticProduct = staticProducts.find(p => p.id === product.id || p.name === product.name);
              const lp = staticProduct ? getPrices(staticProduct.id, user?.isPremium) : null;
              const premiumPrice = lp ? lp.prices["1 year"] : product.finalPrice;
              const stockInfo = productStocks[product.id] || { status: 'in-stock', quantity: 50 };
              
              return (
                <div key={product.id} className="flash-sale-card" onClick={() => navigate(`/product/${product.id}`)}>
                  {user?.isPremium && (
                    <div className="premium-flash-top-badge" style={{
                      background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                      color: '#8b4513',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      border: '2px solid #ffd700',
                      boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: '10'
                    }}>
                      🌟 {t('premiumDiscount')}
                    </div>
                  )}
                  {product.images[0] && <img src={product.images[0]} alt={product.name} />}
                  <h3>{product.name}</h3>
                  <div style={{background:'#e65100',color:'#fff',padding:'4px 10px',borderRadius:'12px',display:'inline-block',marginBottom:'6px',fontWeight:'bold'}}>
                    {product.discountType === 'flashSale' ? `🔥 ${product.appliedDiscount}% OFF` : 
                     product.discountType === 'festival' ? `🎉 ${product.appliedDiscount}% OFF` : 
                     `🔥 ${product.flashSaleDiscount}% OFF`}
                  </div>
                  <div className="flash-price">
                    <span className="original">₹{product.originalPrice}</span>
                    <span className="discounted">₹{user?.isPremium ? premiumPrice : product.finalPrice}</span>
                    {user?.isPremium && (
                      <div className="premium-flash-badge" style={{
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                        color: '#8b4513',
                        padding: '3px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '700',
                        marginTop: '5px',
                        display: 'inline-block',
                        border: '1px solid #ffd700',
                        boxShadow: '0 1px 4px rgba(255,215,0,0.3)'
                      }}>
                        🌟 {t('premiumDiscount')}
                      </div>
                    )}
                  </div>
                  
                  {/* Stock Status Display */}
                  {(() => {
                    const stockDisplay = getStockStatusDisplay(stockInfo?.status || 'in-stock', stockInfo?.quantity || 50);
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
                  
                  <div className="flash-timer">
                    ⏰ {flashSaleTime[product.id] || "06:00:00"} {t('left')}
                  </div>
                </div>
              );
            })}}
          </div>
        </div>
      ) : (
        <div className="no-items">
          <div className="no-items-icon">🔥</div>
          <h2>No Flash Sale Items</h2>
          <p>Check back later for amazing deals!</p>
          <button onClick={() => navigate("/")}>Go to Home</button>
        </div>
      )}
    </div>
  );
}

export default FlashSale;
