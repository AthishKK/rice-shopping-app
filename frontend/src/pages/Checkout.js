import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import { useAuth } from "../components/AuthContext";
import { useStockCheck } from "../hooks/useStock";
import "../styles/Checkout.css";

function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { item } = location.state || {};

  const items = item ? [item] : cart;
  const orderPlacedRef = useRef(false); // prevents cart-empty redirect after order

  const [step, setStep] = useState(1);
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "", phone: "", address: "", city: "", state: "", pincode: ""
  });
  const [stockValidation, setStockValidation] = useState({});

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login', { state: { from: '/checkout' } });
    return null;
  }

  // Only redirect to cart if cart is empty AND no buy-now item AND order hasn't been placed
  if (!item && cart.length === 0 && !orderPlacedRef.current) {
    navigate("/cart");
    return null;
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const bundleDiscount = items.length >= 3 ? 50 : items.length >= 2 ? 20 : 0;
  const finalPrice = subtotal - bundleDiscount + deliveryFee;
  const ricePoints = Math.floor(finalPrice / 10);

  const handleAddressChange = (e) => {
    setDeliveryAddress({ ...deliveryAddress, [e.target.name]: e.target.value });
  };

  const handleDeliveryNext = () => {
    const { fullName, phone, address, city, state, pincode } = deliveryAddress;
    if (!fullName || !phone || !address || !city || !state || !pincode) {
      alert("Please fill in all delivery address fields");
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = () => {
    setStep(3);
  };

  const handleConfirmPayment = async () => {
    const token = localStorage.getItem('token');
    const paymentMap = { cod: 'COD', card: 'Card' };
    const isBuyNow = !!item; // buy-now passes a single item via location.state

    // Build order items — include free combo items as separate line items
    const orderItems = [];
    items.forEach(i => {
      orderItems.push({
        productId: i.productId || i.id,
        name: i.name,
        ageCategory: i.age || '1 year',
        weight: String(i.weight) + 'kg',
        quantity: i.quantity || 1,
        price: i.price,
        subtotal: i.price * (i.quantity || 1),
        isFreeItem: false
      });
      // If this item has a free combo item, add it as a separate line
      if (i.isCombo && i.freeItem) {
        orderItems.push({
          productId: i.productId || i.id, // Use same productId but mark as free
          name: i.freeItem.name,
          ageCategory: i.age || '1 year',
          weight: String(i.freeItem.weight) + 'kg',
          quantity: 1,
          price: 0,
          subtotal: 0,
          isFreeItem: true
        });
      }
    });

    const orderPayload = {
      items: orderItems,
      totalAmount: finalPrice,
      paymentMethod: paymentMap[paymentMethod] || 'COD',
      deliveryAddress: {
        street: deliveryAddress.address,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode,
        phone: deliveryAddress.phone
      }
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Order failed');
      }
      
      const data = await response.json();
      const orderId = data.order?._id || data.orderId || 'VRM' + Math.floor(10000 + Math.random() * 90000);
      // Set flag before clearing cart so the guard doesn't redirect
      orderPlacedRef.current = true;
      // Only clear cart for cart checkout, not buy-now
      if (!isBuyNow && typeof clearCart === 'function') clearCart();
      navigate('/order-confirmation', { state: { orderId, total: finalPrice.toFixed(2) } });
    } catch (error) {
      console.error('Order error:', error);
      alert(`Order failed: ${error.message}. Please try again.`);
    }
  };

  const stepLabels = ["Delivery Info", "Order Summary", "Payment"];

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-steps">
        {stepLabels.map((label, i) => (
          <div key={i} className={`step-item ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}`}>
            <div className="step-circle">{step > i + 1 ? "✓" : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Delivery */}
      {step === 1 && (
        <div className="checkout-card">
          <h2>📍 Delivery Information</h2>
          <div className="address-form">
            <input type="text" name="fullName" placeholder="Full Name" value={deliveryAddress.fullName} onChange={handleAddressChange} />
            <input type="tel" name="phone" placeholder="Phone Number" value={deliveryAddress.phone} onChange={handleAddressChange} />
            <textarea name="address" placeholder="Address (House No, Building, Street)" value={deliveryAddress.address} onChange={handleAddressChange} rows="3" />
            <div className="form-row">
              <input type="text" name="city" placeholder="City" value={deliveryAddress.city} onChange={handleAddressChange} />
              <input type="text" name="state" placeholder="State" value={deliveryAddress.state} onChange={handleAddressChange} />
            </div>
            <input type="text" name="pincode" placeholder="Pincode" value={deliveryAddress.pincode} onChange={handleAddressChange} />
            <label className="save-address">
              <input type="checkbox" checked={saveAddress} onChange={() => setSaveAddress(!saveAddress)} />
              Save this address for future orders
            </label>
          </div>
          <button className="next-btn" onClick={handleDeliveryNext}>Continue to Order Summary →</button>
        </div>
      )}

      {/* STEP 2: Order Summary */}
      {step === 2 && (
        <div className="checkout-card">
          <h2>📦 Order Summary</h2>
          <div className="order-items">
            {items.map((i, idx) => (
              <div key={idx} className="checkout-item">
                <img src={i.image} alt={i.name} />
                <div className="item-info">
                  <h3>{i.name}</h3>
                  <p>{i.weight}kg – ₹{i.price * (i.quantity || 1)}</p>
                  {i.age && <p>{i.age} Aged</p>}
                  {i.quantity > 1 && <p>Qty: {i.quantity}</p>}
                </div>
              </div>
            ))}
            {items.some(i => i.isCombo && i.freeItem) && items.filter(i => i.isCombo).map((i, idx) => (
              <div key={"free-" + idx} className="checkout-item free-item-row">
                <img src={i.freeItem.image} alt={i.freeItem.name} />
                <div className="item-info">
                  <span className="free-tag">🎁 FREE ITEM</span>
                  <h3>{i.freeItem.name}</h3>
                  <p>{i.freeItem.weight}kg – ₹0</p>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row"><span>Subtotal:</span><span>₹{subtotal}</span></div>
            {bundleDiscount > 0 && <div className="summary-row discount"><span>Bundle Discount:</span><span>-₹{bundleDiscount}</span></div>}
            <div className="summary-row"><span>Delivery Fee:</span><span>{deliveryFee === 0 ? "FREE 🚚" : `₹${deliveryFee}`}</span></div>
            <div className="summary-row total"><span>Total:</span><span>₹{finalPrice.toFixed(2)}</span></div>
          </div>

          {bundleDiscount > 0 && (
            <div className="savings-badge">🎉 You saved ₹{bundleDiscount} with this offer!</div>
          )}

          <div className="rewards-section">
            <span>💎</span>
            <div>
              <p>You will earn <strong>{ricePoints} Rice Points</strong> with this purchase</p>
              <p className="points-note">100 points = ₹50 discount</p>
            </div>
          </div>

          <div className="step-actions">
            <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
            <button className="next-btn" onClick={handlePlaceOrder}>Place Order →</button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment */}
      {step === 3 && (
        <div className="checkout-card">
          <h2>💳 Payment Method</h2>
          <div className="payment-options">
            <label className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span className="payment-icon">💵</span>
              <span>Cash on Delivery</span>
            </label>
            <label className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}>
              <input type="radio" name="payment" value="card" checked={paymentMethod === "card"} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span className="payment-icon">💳</span>
              <span>Credit / Debit Card</span>
            </label>
          </div>

          <div className="payment-total">
            <span>Amount to Pay:</span>
            <span className="pay-amount">₹{finalPrice.toFixed(2)}</span>
          </div>

          <div className="step-actions">
            <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
            <button className="confirm-btn" onClick={handleConfirmPayment}>
              {paymentMethod === "cod" ? "Confirm Order" : "Pay Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
