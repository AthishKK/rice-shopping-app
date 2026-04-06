import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";
import "../styles/UserProfile.css";

function UserProfile() {
  const { user, upgradeToPremium } = useAuth();
  const { t } = useLanguage();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleUpgradeClick = () => {
    if (user?.isPremium) {
      alert("You are already a premium member!");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessingPayment(true);
    
    try {
      if (paymentMethod === 'upi' || paymentMethod === 'card') {
        await handleRazorpayPayment();
      } else {
        // Direct upgrade for testing
        const result = await upgradeToPremium();
        if (result.success) {
          alert(result.message);
          setShowPaymentModal(false);
        } else {
          alert(result.message);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Create Razorpay order for premium upgrade
      const razorpayResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payment/create-premium-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: 19900, // ₹199 in paise
          currency: 'INR'
        })
      });

      if (!razorpayResponse.ok) {
        const errorData = await razorpayResponse.json();
        throw new Error(errorData.message || 'Payment initialization failed');
      }

      const paymentData = await razorpayResponse.json();
      const { razorpayOrderId } = paymentData;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_SXstmPX9i8z3Xd',
        amount: 19900,
        currency: 'INR',
        name: 'Verti Vinayagar Rice Mart',
        description: 'Premium Membership Upgrade',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment and upgrade user
            const verifyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/payment/verify-premium`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            // Payment successful - upgrade user
            const result = await upgradeToPremium();
            if (result.success) {
              alert('🎉 Welcome to Premium! ' + result.message);
              setShowPaymentModal(false);
            } else {
              alert(result.message);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: {
          color: '#ff6b35'
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <h2>{t('pleaseLoginToViewProfile')}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h2>
              {user.name}
              {user.isPremium && <span className="premium-badge"> ⭐ Premium</span>}
            </h2>
            <p className="profile-email">{user.email}</p>
            <p className="member-since">{t('memberSince')}: {formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="profile-sections">
          <div className="membership-section">
            <h3>{t('membershipStatus')}</h3>
            <div className="membership-card">
              {user.isPremium ? (
                <div className="premium-active">
                  <div className="premium-icon">⭐</div>
                  <div className="premium-details">
                    <h4>{t('riceMartPremium')}</h4>
                    <p>{t('activeUntil')}: {formatDate(user.premiumExpiryDate)}</p>
                    <div className="premium-benefits">
                      <p>✔ {t('tenPercentDiscount')}</p>
                      <p>✔ {t('freeDelivery')}</p>
                      <p>✔ {t('earlyAccessToSales')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="premium-inactive">
                  <div className="premium-icon">🌾</div>
                  <div className="premium-details">
                    <h4>{t('standardMember')}</h4>
                    <p>{t('upgradeToPremiumForBenefits')}</p>
                    <div className="premium-benefits">
                      <p>✔ {t('tenPercentDiscount')}</p>
                      <p>✔ {t('freeDelivery')}</p>
                      <p>✔ {t('earlyAccessToSales')}</p>
                    </div>
                    <button 
                      className="upgrade-btn"
                      onClick={handleUpgradeClick}
                    >
                      {t('upgradeToPremium')} - ₹199/{t('year')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="account-section">
            <h3>{t('accountInformation')}</h3>
            <div className="account-details">
              <div className="detail-item">
                <label>{t('name')}:</label>
                <span>{user.name}</span>
              </div>
              <div className="detail-item">
                <label>{t('email')}:</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-item">
                <label>{t('ricePoints')}:</label>
                <span>{user.ricePoints || 0} {t('points')}</span>
              </div>
              <div className="detail-item">
                <label>{t('accountType')}:</label>
                <span>{user.isPremium ? t('premiumMember') : t('standardMember')}</span>
              </div>
              {user.isPremium && (
                <div className="detail-item">
                  <label>{t('premiumExpires')}:</label>
                  <span>{formatDate(user.premiumExpiryDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h3>🎆 Upgrade to Premium</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="premium-benefits-modal">
                <h4>Premium Benefits:</h4>
                <ul>
                  <li>✓ Free delivery on all orders</li>
                  <li>✓ Early access to flash sales</li>
                  <li>✓ Exclusive premium discounts</li>
                  <li>✓ Priority customer support</li>
                </ul>
              </div>
              
              <div className="payment-amount">
                <span>Amount to Pay: </span>
                <span className="amount">₹199/year</span>
              </div>
              
              <div className="payment-methods">
                <h4>Choose Payment Method:</h4>
                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="card" 
                      checked={paymentMethod === "card"} 
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={isProcessingPayment}
                    />
                    <span className="payment-icon">💳</span>
                    <span>Credit / Debit Card</span>
                  </label>
                  <label className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="upi" 
                      checked={paymentMethod === "upi"} 
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={isProcessingPayment}
                    />
                    <span className="payment-icon">📱</span>
                    <span>UPI (GPay, PhonePe)</span>
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button 
                  className="pay-btn"
                  onClick={handlePaymentConfirm}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    paymentMethod === "upi" ? "Processing UPI..." : "Processing Card..."
                  ) : (
                    paymentMethod === "upi" ? "Pay with UPI" : "Pay with Card"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;