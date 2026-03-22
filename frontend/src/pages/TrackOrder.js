import React, { useState } from "react";
import "../styles/TrackOrder.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    if (!orderId.trim()) { setError("Please enter an Order ID"); return; }
    setLoading(true);
    setError("");
    setTrackingData(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/orders/${orderId.trim()}/track`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) { setError("Order not found. Please check your Order ID."); setLoading(false); return; }
      const data = await res.json();
      setTrackingData(data);
    } catch {
      setError("Failed to connect to server. Make sure the backend is running.");
    }
    setLoading(false);
  };

  const statusIcons = { Placed: "📋", Processing: "⚙️", Shipped: "🚚", Delivered: "✅", Cancelled: "❌" };

  return (
    <div className="track-order-page">
      <h1>Track Your Order</h1>

      <div className="track-input-section">
        <input
          type="text"
          placeholder="Enter Order ID (from My Orders)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
        />
        <button onClick={handleTrack} disabled={loading}>
          {loading ? "Tracking..." : "Track Order"}
        </button>
      </div>

      {error && <p style={{color:'red', textAlign:'center', marginTop:'12px'}}>{error}</p>}

      {trackingData && (
        <div className="tracking-result">
          <div className="order-info">
            <h2>Order #{trackingData.order?.id?.slice(-8).toUpperCase()}</h2>
            {trackingData.order?.items?.map((item, i) => (
              <p key={i} className="product-name">{item.name?.name || item.name} — {item.weight}kg</p>
            ))}
            <p className="delivery-estimate">
              Estimated Delivery: {trackingData.order?.estimatedDelivery
                ? new Date(trackingData.order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Calculating...'}
            </p>
            <p><strong>Total: ₹{trackingData.order?.totalAmount}</strong></p>
          </div>

          <div className="tracking-timeline">
            {trackingData.timeline?.map((step, index) => (
              <div key={index} className={`timeline-item ${step.completed ? 'completed' : ''}`}>
                <div className="timeline-icon">
                  {step.completed ? '✓' : statusIcons[step.status] || '○'}
                </div>
                <div className="timeline-content">
                  <div className="timeline-label">{step.status}</div>
                  <div className="timeline-desc">{step.description}</div>
                  {step.completed && (
                    <div className="timeline-date">
                      {new Date(step.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;
