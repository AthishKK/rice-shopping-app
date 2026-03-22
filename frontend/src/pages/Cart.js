import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import { useLanguage } from "../components/LanguageContext";
import "../styles/Cart.css";

function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  };

  const getBundleDiscount = () => {
    const itemCount = cart.length;
    if (itemCount >= 3) return 50;
    if (itemCount >= 2) return 20;
    return 0;
  };

  const subtotal = calculateTotal();
  const bundleDiscount = getBundleDiscount();
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const total = subtotal - bundleDiscount + deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="cart-page">
      <h1>{t('yourCart')}</h1>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>{t('emptyCart')}</p>
          <button onClick={() => navigate("/")}>{t('continueShopping')}</button>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            {bundleDiscount > 0 && (
              <div className="bundle-offer">
                🎁 Bundle Offer Applied: Save ₹{bundleDiscount}!
                {cart.length === 2 && <p>Add 1 more item to save ₹50!</p>}
              </div>
            )}
            {cart.length === 1 && (
              <div className="bundle-promo">
                🎁 Buy 2 Get ₹20 Off | Buy 3 Get ₹50 Off
              </div>
            )}
            {cart.map((item) => (
              <div key={item.cartId} className="cart-item">
                <img src={item.image} alt={t(item.name)} />
                <div className="item-details">
                  <h3>{t(item.name)}</h3>
                  <p>{t('age')}: {item.age}</p>
                  <p>{t('weight')}: {item.weight} {t('kg')}</p>
                  <p>{t('price')} per {t('kg')}: ₹{item.pricePerKg}</p>
                  <p className="item-price">₹{item.price * (item.quantity || 1)}</p>
                  <div className="quantity-control">
                    <span className="quantity-label">{t('quantity')}:</span>
                    <button onClick={() => updateQuantity(item.cartId, Math.max(1, (item.quantity || 1) - 1))}>−</button>
                    <span>{item.quantity || 1}</span>
                    <button onClick={() => updateQuantity(item.cartId, (item.quantity || 1) + 1)}>+</button>
                  </div>
                  {item.isCombo && item.freeItem && (
                    <div className="combo-free-item">
                      <img src={item.freeItem.image} alt={t(item.freeItem.name)} />
                      <div>
                        <p className="free-item-tag">🎁 FREE ITEM</p>
                        <p className="free-item-name">{t(item.freeItem.name)}</p>
                        <p>{t('weight')}: {item.freeItem.weight} {t('kg')}</p>
                        <p className="free-item-price">₹0</p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.cartId)}
                >
                  {t('removeFromCart')}
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>{t('orderSummary')}</h2>
            <div className="summary-row">
              <span>{t('subtotal')} ({cart.length} items):</span>
              <span>₹{subtotal}</span>
            </div>
            {bundleDiscount > 0 && (
              <div className="summary-row discount">
                <span>Bundle {t('discount')}:</span>
                <span>-₹{bundleDiscount}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Delivery:</span>
              <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
            </div>
            {subtotal >= 500 && deliveryFee === 0 && (
              <div className="free-delivery-note">🚚 {t('freeDelivery')}</div>
            )}
            <div className="summary-row total">
              <span>{t('total')}:</span>
              <span>₹{total}</span>
            </div>
            <div className="rewards-info">
              💎 You'll earn {Math.floor(total / 10)} Rice Points
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              {t('proceedToCheckout')}
            </button>
            <button className="continue-btn" onClick={() => navigate("/")}>
              🛍️ {t('continueShopping')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
