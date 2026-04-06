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
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [useRicePoints, setUseRicePoints] = useState(false);
  const [ricePointsToUse, setRicePointsToUse] = useState(0);
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
  // Premium users get free delivery, otherwise free delivery above ₹500
  const deliveryFee = user?.isPremium ? 0 : (subtotal >= 500 ? 0 : 40);
  const bundleDiscount = items.length >= 3 ? 50 : items.length >= 2 ? 20 : 0;
  
  // Rice points calculation (100 points = ₹50 discount)
  const maxRicePointsDiscount = Math.min(
    Math.floor((user?.ricePoints || 0) / 100) * 50, // Max discount from available points
    Math.floor((subtotal - bundleDiscount) * 0.8) // Max 80% of subtotal can be paid with points
  );
  const ricePointsDiscount = useRicePoints ? ricePointsToUse : 0;
  const pointsNeededForDiscount = ricePointsDiscount * 2; // 100 points = ₹50, so 2 points per rupee discount
  
  const finalPrice = subtotal - bundleDiscount - ricePointsDiscount + deliveryFee;
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
    // Prevent multiple submissions
    if (isProcessingOrder) {
      return;
    }
    
    setIsProcessingOrder(true);
    
    try {
      // Test backend connectivity first
      console.log('Testing backend connectivity...');
      const healthCheck = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/../`, {
        method: 'GET'
      });
      console.log('Health check status:', healthCheck.status);
      if (healthCheck.ok) {
        const healthData = await healthCheck.text();
        console.log('Backend is accessible:', healthData);
      } else {
        console.error('Backend health check failed:', healthCheck.status);
      }
      
      const token = localStorage.getItem('token');
      const paymentMap = { cod: 'COD', card: 'Card', upi: 'UPI' };
      const isBuyNow = !!item; // buy-now passes a single item via location.state

      // Build order items — include free combo items as separate line items
      const orderItems = [];
      console.log('Processing items for order:', items);
      
      items.forEach(i => {
        console.log('Processing item:', i);
        
        // Ensure we have the required fields with proper defaults
        const productId = i.productId || i.id;
        const ageCategory = i.age || i.ageCategory || '1 year';
        const weight = i.weight ? (String(i.weight).includes('kg') ? String(i.weight) : String(i.weight) + 'kg') : '1kg';
        const quantity = i.quantity || 1;
        
        console.log('Mapped item data:', { productId, ageCategory, weight, quantity, name: i.name });
        
        orderItems.push({
          productId,
          name: i.name,
          ageCategory,
          weight,
          quantity,
          price: i.price,
          subtotal: i.price * quantity,
          isFreeItem: false
        });
        
        // If this item has a free combo item, add it as a separate line
        if (i.isCombo && i.freeItem) {
          const freeWeight = i.freeItem.weight ? (String(i.freeItem.weight).includes('kg') ? String(i.freeItem.weight) : String(i.freeItem.weight) + 'kg') : '1kg';
          
          orderItems.push({
            productId,
            name: i.freeItem.name,
            ageCategory,
            weight: freeWeight,
            quantity: 1,
            price: 0,
            subtotal: 0,
            isFreeItem: true
          });
        }
      });
      
      console.log('Final order items:', orderItems);

      // Handle Razorpay payment for UPI and Card
      if (paymentMethod === 'upi' || paymentMethod === 'card') {
        await handleRazorpayPayment(orderItems, isBuyNow);
      } else {
        // Handle COD payment
        await handleCODPayment(orderItems, isBuyNow);
      }
    } catch (error) {
      console.error('Order error:', error);
      alert(`Order failed: ${error.message}. Please try again.`);
      setIsProcessingOrder(false); // Re-enable button on error
    }
  };

  const handleCODPayment = async (orderItems, isBuyNow) => {
    const orderPayload = {
      items: orderItems,
      totalAmount: finalPrice,
      ricePointsUsed: ricePointsDiscount > 0 ? pointsNeededForDiscount : 0,
      ricePointsDiscount: ricePointsDiscount,
      paymentMethod: 'COD',
      deliveryAddress: {
        street: deliveryAddress.address,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        pincode: deliveryAddress.pincode,
        phone: deliveryAddress.phone
      }
    };

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderPayload)
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
  };

  const handleRazorpayPayment = async (orderItems, isBuyNow) => {
    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }
      
      // Debug token
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'exists' : 'missing');
      console.log('Token length:', token?.length);
      console.log('User object:', user);
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Create order on backend first
      const orderPayload = {
        items: orderItems,
        totalAmount: finalPrice,
        ricePointsUsed: ricePointsDiscount > 0 ? pointsNeededForDiscount : 0,
        ricePointsDiscount: ricePointsDiscount,
        paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Card',
        deliveryAddress: {
          street: deliveryAddress.address,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          pincode: deliveryAddress.pincode,
          phone: deliveryAddress.phone
        }
      };

      console.log('Creating Razorpay order with payload:', orderPayload);
      console.log('API URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payment/create-order`);

      // Create Razorpay order
      const razorpayResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Math.round(finalPrice * 100), // Convert to paise
          currency: 'INR',
          orderData: orderPayload
        })
      });

      console.log('Razorpay response status:', razorpayResponse.status);
      console.log('Razorpay response content-type:', razorpayResponse.headers.get('content-type'));

      if (!razorpayResponse.ok) {
        const responseText = await razorpayResponse.text();
        console.error('Payment API error response:', responseText);
        
        let errorMessage = 'Payment initialization failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          if (responseText.includes('<!DOCTYPE')) {
            errorMessage = 'Payment service unavailable. Please try again later.';
          } else {
            errorMessage = `Server error (${razorpayResponse.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const responseText = await razorpayResponse.text();
      console.log('Payment API success response:', responseText);
      
      let paymentData;
      try {
        paymentData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse payment response:', e);
        throw new Error('Invalid response from payment service');
      }

      const { razorpayOrderId, orderId } = paymentData;

    // Initialize Razorpay
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_SXstmPX9i8z3Xd', // Use env variable with fallback
      amount: Math.round(finalPrice * 100),
      currency: 'INR',
      name: 'Verti Vinayagar Rice Mart',
      description: 'Rice Purchase',
      order_id: razorpayOrderId,
      handler: async function (response) {
        try {
          // Verify payment on backend
          const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId
            })
          });

          if (!verifyResponse.ok) {
            const responseText = await verifyResponse.text();
            console.error('Verification error response:', responseText);
            
            let errorMessage = 'Payment verification failed';
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              errorMessage = `Verification failed (${verifyResponse.status})`;
            }
            throw new Error(errorMessage);
          }

          // Payment successful
          orderPlacedRef.current = true;
          if (!isBuyNow && typeof clearCart === 'function') clearCart();
          navigate('/order-confirmation', { state: { orderId, total: finalPrice.toFixed(2) } });
        } catch (error) {
          console.error('Payment verification error:', error);
          alert('Payment verification failed. Please contact support.');
          setIsProcessingOrder(false);
        }
      },
      prefill: {
        name: deliveryAddress.fullName,
        email: user?.email || '',
        contact: deliveryAddress.phone
      },
      theme: {
        color: '#ff6b35'
      },
      modal: {
        ondismiss: function() {
          setIsProcessingOrder(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Razorpay payment error:', error);
    throw error; // Re-throw to be caught by handleConfirmPayment
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
            
            {/* Rice Points Usage Section */}
            {user?.ricePoints > 0 && (
              <div className="rice-points-section">
                <div className="rice-points-header">
                  <span>🌾 Rice Points Available: {user.ricePoints}</span>
                  <label className="use-points-toggle">
                    <input 
                      type="checkbox" 
                      checked={useRicePoints} 
                      onChange={(e) => {
                        setUseRicePoints(e.target.checked);
                        if (e.target.checked) {
                          setRicePointsToUse(maxRicePointsDiscount);
                        } else {
                          setRicePointsToUse(0);
                        }
                      }}
                    />
                    Use Rice Points
                  </label>
                </div>
                {useRicePoints && (
                  <div className="points-slider">
                    <input 
                      type="range" 
                      min="0" 
                      max={maxRicePointsDiscount} 
                      step="50" 
                      value={ricePointsToUse} 
                      onChange={(e) => setRicePointsToUse(parseInt(e.target.value))}
                    />
                    <div className="points-info">
                      <span>Using: ₹{ricePointsToUse} ({pointsNeededForDiscount} points)</span>
                      <span>Max: ₹{maxRicePointsDiscount}</span>
                    </div>
                  </div>
                )}
                {ricePointsDiscount > 0 && (
                  <div className="summary-row discount">
                    <span>Rice Points Discount:</span>
                    <span>-₹{ricePointsDiscount}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="summary-row">
              <span>Delivery Fee:</span>
              <span>
                {deliveryFee === 0 ? (
                  user?.isPremium ? "FREE 🎆 (Premium)" : "FREE 🚚"
                ) : (
                  `₹${deliveryFee}`
                )}
              </span>
            </div>
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
            <label className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}>
              <input type="radio" name="payment" value="upi" checked={paymentMethod === "upi"} onChange={(e) => setPaymentMethod(e.target.value)} />
              <span className="payment-icon">📱</span>
              <span>UPI (GPay, PhonePe)</span>
            </label>
          </div>

          <div className="payment-total">
            <span>Amount to Pay:</span>
            <span className="pay-amount">₹{finalPrice.toFixed(2)}</span>
          </div>

          <div className="step-actions">
            <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
            <button 
              className="confirm-btn" 
              onClick={handleConfirmPayment}
              disabled={isProcessingOrder}
              style={{
                opacity: isProcessingOrder ? 0.6 : 1,
                cursor: isProcessingOrder ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessingOrder ? (
                paymentMethod === "cod" ? "Processing Order..." : "Processing Payment..."
              ) : (
                paymentMethod === "cod" ? "Confirm Order" : paymentMethod === "upi" ? "Pay with UPI" : "Pay with Card"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
