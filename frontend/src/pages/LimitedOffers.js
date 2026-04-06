import React, { useState, useEffect } from "react";
import { useCart } from "../components/CartContext";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import staticProducts from "../data/products";
import { useLivePrice } from "../utils/useLivePrice";
import "../styles/LimitedOffers.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getProduct = (id) => staticProducts.find((p) => p.id === id);

const ages = ["6 months", "1 year", "2 years"];
const ageLabels = { "6 months": "6 Months Aged", "1 year": "1 Year Aged", "2 years": "2 Years Aged" };

function useCountdown(endTime) {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    if (!endTime) {
      setTimeLeft("EXPIRED");
      return;
    }
    
    const updateTimer = () => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        return;
      }
      
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    
    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [endTime]);
  
  return timeLeft;
}

function OfferCard({ offer, onView, onAddToCart, added }) {
  const main = getProduct(offer.mainProduct);
  const free = getProduct(offer.freeProduct);
  const timer = useCountdown(offer.endTime); // Use actual end time instead of expiresIn

  return (
    <div className="offer-card">
      <div className="offer-timer">⏰ {timer === "EXPIRED" ? "EXPIRED" : timer}</div>
      <div className="free-badge">FREE BONUS</div>

      <div className="offer-card-images">
        <div className="offer-card-img-wrap">
          <img src={main.images[0]} alt={main.name} className="offer-card-img" />
          <p className="offer-card-img-name">{main.name}</p>
        </div>
        <span className="offer-card-img-plus">+</span>
        <div className="offer-card-free-img-wrap">
          <span className="offer-card-free-tag">FREE</span>
          <img src={free.images[0]} alt={free.name} className="offer-card-img" />
          <p className="offer-card-img-name">{free.name}</p>
        </div>
      </div>

      <p className="offer-card-weights">
        {offer.mainWeight}kg
        <span className="offer-card-plus"> + </span>
        <span className="offer-card-free">{offer.freeWeight}kg FREE</span>
      </p>

      <p className="offer-card-label">🎁 Limited Offer</p>

      <div className="offer-card-actions">
        <button className="view-combo-btn" onClick={() => onView(offer)}>View Combo</button>
      </div>
    </div>
  );
}

function ComboModal({ offer, onClose, onAddToCart, onBuyNow, added, getPrices }) {
  const [selectedAge, setSelectedAge] = useState("1 year");
  const main = getProduct(offer.mainProduct);
  const free = getProduct(offer.freeProduct);
  const lp = getPrices(main.id);
  const pricePerKg = lp.prices[selectedAge];
  const originalPricePerKg = lp.originalPrices[selectedAge];
  const totalPrice = pricePerKg * offer.mainWeight;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2 className="modal-title">{main.name} Combo Offer</h2>

        <div className="modal-products">
          <div className="modal-product">
            <img src={main.images[0]} alt={main.name} />
            <p className="modal-product-label">Main Product</p>
            <p className="modal-product-name">{main.name}</p>
            <p className="modal-product-weight">Weight: {offer.mainWeight}kg</p>
            <p className="modal-product-price">₹{pricePerKg}/kg</p>
            <p className="modal-product-original" style={{textDecoration:'line-through',color:'#999',fontSize:'0.85em'}}>₹{originalPricePerKg}/kg</p>
          </div>

          <div className="modal-plus">+</div>

          <div className="modal-product modal-free-product">
            <div className="modal-free-tag">FREE</div>
            <img src={free.images[0]} alt={free.name} />
            <p className="modal-product-label">Free Product</p>
            <p className="modal-product-name">{free.name}</p>
            <p className="modal-product-weight">Weight: {offer.freeWeight}kg</p>
            <p className="modal-product-price free-price">₹0</p>
          </div>
        </div>

        <div className="modal-age-section">
          <h3>Choose Rice Age</h3>
          <div className="modal-age-options">
            {ages.map((age) => (
              <label key={age} className={`modal-age-option ${selectedAge === age ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="age"
                  value={age}
                  checked={selectedAge === age}
                  onChange={() => setSelectedAge(age)}
                />
                {ageLabels[age]}
              </label>
            ))}
          </div>
        </div>

        <div className="modal-price-summary">
          <div className="modal-price-row">
            <span>{offer.mainWeight}kg × ₹{pricePerKg}/kg</span>
            <span>₹{totalPrice}</span>
          </div>
          <div className="modal-price-row free-row">
            <span>Free {offer.freeWeight}kg ({free.name})</span>
            <span>₹0</span>
          </div>
          <div className="modal-price-row modal-total">
            <span>Total</span>
            <span>₹{totalPrice}</span>
          </div>
        </div>

        <div className="modal-btn-group">
          <button className="add-combo-btn modal-add-btn" onClick={() => onAddToCart(offer, selectedAge)}>
            {added ? "✅ Added to Cart!" : "Add Combo To Cart"}
          </button>
          <button className="buy-now-combo-btn" onClick={() => { onBuyNow(offer, selectedAge); onClose(); }}>
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

function LimitedOffers() {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [added, setAdded] = useState({});
  const [viewOffer, setViewOffer] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getPrices } = useLivePrice();

  // Fetch combo offers from backend
  useEffect(() => {
    const fetchComboOffers = async () => {
      try {
        const response = await fetch(`${API_URL}/combo-offers`);
        if (response.ok) {
          const data = await response.json();
          // Transform backend data to frontend format
          const transformedOffers = data.map((offer, index) => ({
            id: offer._id,
            mainProduct: offer.mainProduct.productId,
            mainWeight: offer.mainProduct.weight,
            freeProduct: offer.freeProduct.productId,
            freeWeight: offer.freeProduct.weight,
            endTime: new Date(offer.endTime) // Use actual end time from backend
          }));
          
          // Filter out expired offers and limit to 12
          const activeOffers = transformedOffers.filter(offer => {
            const now = new Date();
            return new Date(offer.endTime) > now;
          }).slice(0, 12); // Limit to 12 combos
          
          setOffers(activeOffers);
        } else {
          console.error('Failed to fetch combo offers');
          setOffers([]);
        }
      } catch (error) {
        console.error('Error fetching combo offers:', error);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComboOffers();
    
    // Refresh offers every 30 seconds to check for new ones and remove expired ones
    const interval = setInterval(fetchComboOffers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (offer, age) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/limited-offers", message: "Please login to add items to cart" } });
      return;
    }
    const main = getProduct(offer.mainProduct);
    const free = getProduct(offer.freeProduct);
    const lp = getPrices(main.id);
    const pricePerKg = lp.prices[age];
    const totalPrice = pricePerKg * offer.mainWeight;

    addToCart({
      productId: main.id,
      name: main.name,
      age,
      weight: offer.mainWeight,
      pricePerKg,
      price: totalPrice,
      image: main.images[0],
      isCombo: true,
      freeItem: {
        name: free.name,
        weight: offer.freeWeight,
        image: free.images[0],
      },
    });

    setAdded((prev) => ({ ...prev, [offer.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [offer.id]: false })), 2500);
  };

  const handleBuyNow = (offer, age) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/limited-offers", message: "Please login to continue with purchase" } });
      return;
    }
    const main = getProduct(offer.mainProduct);
    const free = getProduct(offer.freeProduct);
    const lp = getPrices(main.id);
    const pricePerKg = lp.prices[age];
    const totalPrice = pricePerKg * offer.mainWeight;
    navigate("/checkout", {
      state: {
        item: {
          name: main.name,
          age,
          weight: offer.mainWeight,
          pricePerKg,
          price: totalPrice,
          image: main.images[0],
          isCombo: true,
          freeItem: {
            name: free.name,
            weight: offer.freeWeight,
            image: free.images[0],
          },
        }
      }
    });
  };

  return (
    <div className="limited-offers-page">
      <div className="offers-hero">
        <h1>🔥 Limited Rice Offers</h1>
        <p>Grab Special Combo Deals — Today Only!</p>
      </div>

      {loading ? (
        <div className="loading-message">
          <p>⏳ Loading combo offers...</p>
        </div>
      ) : offers.length > 0 ? (
        <div className="offers-grid">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onView={setViewOffer}
              onAddToCart={handleAddToCart}
              added={added[offer.id]}
            />
          ))}
        </div>
      ) : (
        <div className="no-offers-message">
          <h2>🎁 No Active Combo Offers</h2>
          <p>New combo offers will be available soon. Check back later!</p>
        </div>
      )}

      {viewOffer && (
        <ComboModal
          offer={viewOffer}
          onClose={() => setViewOffer(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          added={added[viewOffer.id]}
          getPrices={getPrices}
        />
      )}
    </div>
  );
}

export default LimitedOffers;
