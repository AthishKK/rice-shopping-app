import React, { useState, useEffect } from "react";
import { useCart } from "../components/CartContext";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import staticProducts from "../data/products";
import { useLivePrice } from "../utils/useLivePrice";
import "../styles/LimitedOffers.css";

const getProduct = (id) => staticProducts.find((p) => p.id === id);

const offers = [
  { id: 1,  mainProduct: 2,  mainWeight: 25, freeProduct: 1,  freeWeight: 1,  expiresIn: 3 * 60 * 60 },
  { id: 2,  mainProduct: 6,  mainWeight: 26, freeProduct: 10, freeWeight: 2,  expiresIn: 5 * 60 * 60 },
  { id: 3,  mainProduct: 3,  mainWeight: 50, freeProduct: 5,  freeWeight: 4,  expiresIn: 1.5 * 60 * 60 },
  { id: 4,  mainProduct: 10, mainWeight: 25, freeProduct: 4,  freeWeight: 1,  expiresIn: 4 * 60 * 60 },
  { id: 5,  mainProduct: 6,  mainWeight: 25, freeProduct: 9,  freeWeight: 1,  expiresIn: 6 * 60 * 60 },
  { id: 6,  mainProduct: 4,  mainWeight: 25, freeProduct: 8,  freeWeight: 2,  expiresIn: 2 * 60 * 60 },
  { id: 7,  mainProduct: 7,  mainWeight: 25, freeProduct: 2,  freeWeight: 1,  expiresIn: 7 * 60 * 60 },
  { id: 8,  mainProduct: 9,  mainWeight: 26, freeProduct: 6,  freeWeight: 1,  expiresIn: 3.5 * 60 * 60 },
  { id: 9,  mainProduct: 2,  mainWeight: 25, freeProduct: 7,  freeWeight: 1,  expiresIn: 2.5 * 60 * 60 },
  { id: 10, mainProduct: 6,  mainWeight: 26, freeProduct: 4,  freeWeight: 2,  expiresIn: 4.5 * 60 * 60 },
  { id: 11, mainProduct: 3,  mainWeight: 50, freeProduct: 8,  freeWeight: 4,  expiresIn: 1 * 60 * 60 },
  { id: 12, mainProduct: 10, mainWeight: 25, freeProduct: 5,  freeWeight: 1,  expiresIn: 5.5 * 60 * 60 },
  { id: 13, mainProduct: 2,  mainWeight: 25, freeProduct: 2,  freeWeight: 1,  expiresIn: 2 * 60 * 60 },
  { id: 14, mainProduct: 6,  mainWeight: 26, freeProduct: 6,  freeWeight: 2,  expiresIn: 3 * 60 * 60 },
  { id: 15, mainProduct: 4,  mainWeight: 25, freeProduct: 4,  freeWeight: 1,  expiresIn: 4 * 60 * 60 },
  { id: 16, mainProduct: 9,  mainWeight: 25, freeProduct: 9,  freeWeight: 1,  expiresIn: 5 * 60 * 60 },
];

const ages = ["6 months", "1 year", "2 years"];
const ageLabels = { "6 months": "6 Months Aged", "1 year": "1 Year Aged", "2 years": "2 Years Aged" };

function useCountdown(seconds) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function OfferCard({ offer, onView, onAddToCart, added }) {
  const main = getProduct(offer.mainProduct);
  const free = getProduct(offer.freeProduct);
  const timer = useCountdown(offer.expiresIn);

  return (
    <div className="offer-card">
      <div className="offer-timer">⏰ {timer}</div>
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
  const { getPrices } = useLivePrice();

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
