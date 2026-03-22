import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/OrderConfirmation.css";

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId = "VRM10233", total = 0 } = location.state || {};

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="success-icon">🎉</div>
        <h1>Order Confirmed!</h1>
        <p className="thank-you">Thank you for your order</p>

        <div className="order-summary">
          <div className="summary-item">
            <span>Order ID:</span>
            <strong>#{orderId}</strong>
          </div>
          <div className="summary-item">
            <span>Total Amount:</span>
            <strong>₹{total}</strong>
          </div>
          <div className="summary-item">
            <span>Estimated Delivery:</span>
            <strong>{estimatedDelivery.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
          </div>
        </div>

        <div className="confirmation-message">
          <p>📧 Order confirmation has been sent to your email</p>
          <p>📱 You will receive SMS updates about your order</p>
        </div>

        <div className="action-buttons">
          <button className="orders-btn" onClick={() => navigate("/my-orders")}>
            View All Orders
          </button>
          <button className="home-btn" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
