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
  const [useRicePoints, setUseRicePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
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
  
  // Rice Points Calculation
  const userRicePoints = user?.ricePoints || 0;
  const maxPointsUsable = Math.min(userRicePoints, Math.floor(subtotal / 2)); // Max 50% of subtotal
  const pointsDiscount = useRicePoints ? Math.floor(pointsToUse / 2) : 0; // 2 points = ₹1
  
  const finalPrice = subtotal - bundleDiscount - pointsDiscount + deliveryFee;
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
    const isBuyNow = !!item;

    // Build order items - ensure no duplicates for single products
    const orderItems = [];
    const processedItems = new Set();
    
    console.log('=== CHECKOUT DEBUG ===');
    console.log('Items to process:', items);
    console.log('Items count:', items.length);
    
    items.forEach((i, index) => {
      console.log(`Processing item ${index}:`, i);
      
      // Create unique key to prevent duplicates
      const itemKey = `${i.productId || i.id}-${i.age || '1 year'}-${i.weight}-${i.name}`;
      
      if (!processedItems.has(itemKey)) {
        processedItems.add(itemKey);
        
        // Add main item
        const mainItem = {
          productId: i.productId || i.id,
          name: i.name,
          ageCategory: i.age || '1 year',
          weight: String(i.weight) + 'kg',
          quantity: i.quantity || 1,
          price: i.price,
          subtotal: i.price * (i.quantity || 1),
          isFreeItem: false
        };
        
        console.log(`Adding main item:`, mainItem);
        orderItems.push(mainItem);
        
        // Only add free combo item if it exists and is actually a combo offer
        if (i.isCombo && i.freeItem) {
          const freeItemKey = `${i.productId || i.id}-${i.age || '1 year'}-${i.freeItem.weight}-${i.freeItem.name}-free`;
          
          if (!processedItems.has(freeItemKey)) {
            processedItems.add(freeItemKey);
            
            const freeItem = {
              productId: i.productId || i.id,
              name: i.freeItem.name,
              ageCategory: i.age || '1 year',
              weight: String(i.freeItem.weight) + 'kg',
              quantity: 1,
              price: 0,
              subtotal: 0,
              isFreeItem: true
            };
            
            console.log(`Adding free item:`, freeItem);
            orderItems.push(freeItem);
          }
        }
      } else {
        console.log(`Skipping duplicate item with key: ${itemKey}`);
      }
    });
    
    console.log('Final order items:', orderItems);
    console.log('Final order items count:', orderItems.length);

    const orderData = {
      items: orderItems,
      totalAmount: finalPrice,
      deliveryAddress: {
        street: deliveryAddress.address,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode,
        phone: deliveryAddress.phone
      },
      ricePointsUsed: useRicePoints ? pointsToUse : 0,
      ricePointsDiscount: pointsDiscount
    };

    try {
      if (paymentMethod === 'cod') {
        // Handle COD payment (existing logic)
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...orderData,
            paymentMethod: 'COD'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Order failed');
        }
        
        const data = await response.json();
        const orderId = data.order?._id || data.orderId || 'VRM' + Math.floor(10000 + Math.random() * 90000);
        orderPlacedRef.current = true;
        if (!isBuyNow && typeof clearCart === 'function') clearCart();
        navigate('/order-confirmation', { state: { orderId, total: finalPrice.toFixed(2) } });
      } else {
        // Handle Razorpay payment (UPI/Card)
        await handleRazorpayPayment(orderData, token, isBuyNow);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}. Please try again.`);
    }
  };

  const handleRazorpayPayment = async (orderData, token, isBuyNow) => {
    try {
      // Step 1: Create payment order
      const orderResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: 'VRM' + Math.floor(10000 + Math.random() * 90000),
          amount: finalPrice,
          items: orderData.items
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const { razorpayOrderId, amount, currency, key } = await orderResponse.json();

      // Step 2: Open Razorpay payment interface
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Vetri Rice Shopping',
        description: 'Premium Quality Rice',
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Step 3: Verify payment
          await verifyPayment(response, orderData, token, isBuyNow);
        },
        prefill: {
          name: deliveryAddress.fullName,
          email: user.email,
          contact: deliveryAddress.phone
        },
        notes: {
          address: deliveryAddress.address
        },
        theme: {
          color: '#8B4513'
        },
        modal: {
          ondismiss: function() {
            alert('Payment cancelled. You can retry payment anytime.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentResponse, orderData, token, isBuyNow) => {
    try {
      const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          orderData: orderData
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Payment verification failed');
      }

      const data = await verifyResponse.json();
      const orderId = data.order._id;
      
      orderPlacedRef.current = true;
      if (!isBuyNow && typeof clearCart === 'function') clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId, 
          total: finalPrice.toFixed(2),
          paymentId: paymentResponse.razorpay_payment_id
        } 
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support with your payment ID.');
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
            {pointsDiscount > 0 && <div className="summary-row discount"><span>Rice Points Discount:</span><span>-₹{pointsDiscount}</span></div>}
            <div className="summary-row"><span>Delivery Fee:</span><span>{deliveryFee === 0 ? "FREE 🚚" : `₹${deliveryFee}`}</span></div>
            <div className="summary-row total"><span>Total:</span><span>₹{finalPrice.toFixed(2)}</span></div>
          </div>

          {bundleDiscount > 0 && (
            <div className="savings-badge">🎉 You saved ₹{bundleDiscount} with this offer!</div>
          )}
          
          {/* Rice Points Section */}
          <div className="rice-points-section" style={{
            background: 'linear-gradient(135deg, #ffd700, #ffb347)',
            padding: '20px',
            borderRadius: '15px',
            margin: '20px 0',
            border: '2px solid #ffc107'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <span style={{ fontSize: '24px' }}>💰</span>
              <div>
                <h4 style={{ margin: '0', color: '#8b4513' }}>Your Rice Points: {userRicePoints}</h4>
                <p style={{ margin: '0', fontSize: '14px', color: '#8b4513' }}>2 points = ₹1 discount</p>
              </div>
            </div>
            
            {userRicePoints >= 2 && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={useRicePoints} 
                    onChange={(e) => {
                      setUseRicePoints(e.target.checked);
                      if (e.target.checked) {
                        setPointsToUse(Math.min(maxPointsUsable, userRicePoints));
                      } else {
                        setPointsToUse(0);
                      }
                    }}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#8b4513' }}>Use Rice Points for discount</span>
                </label>
                
                {useRicePoints && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#8b4513', fontWeight: 'bold' }}>
                      Points to use: {pointsToUse} (Discount: ₹{Math.floor(pointsToUse / 2)})
                    </label>
                    <input 
                      type="range" 
                      min="2" 
                      max={maxPointsUsable} 
                      step="2" 
                      value={pointsToUse} 
                      onChange={(e) => setPointsToUse(parseInt(e.target.value))}
                      style={{ width: '100%', marginBottom: '5px' }}
                    />
                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '12px', color: '#8b4513' }}>
                      <span>2 points</span>
                      <span>{maxPointsUsable} points (max)</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {userRicePoints < 2 && (
              <p style={{ margin: '0', color: '#8b4513', fontStyle: 'italic' }}>You need at least 2 points to redeem discounts</p>
            )}
          </div>

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
            <label className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}>
              <input type="radio" name="payment" value="upi" checked={paymentMethod === "upi"} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span className="payment-icon">📱</span>
              <span>UPI (Google Pay, PhonePe, Paytm)</span>
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
              {paymentMethod === "cod" ? "Confirm Order" : 
               paymentMethod === "upi" ? "Pay with UPI (GPay/PhonePe)" : "Pay with Card"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
