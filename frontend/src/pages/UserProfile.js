import React from "react";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";
import "../styles/UserProfile.css";

function UserProfile() {
  const { user, upgradeToPremium } = useAuth();
  const { t } = useLanguage();

  const handleUpgradeToPremium = async () => {
    if (user?.isPremium) {
      alert("You are already a premium member!");
      return;
    }

    const result = await upgradeToPremium();
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
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
          <h2>Please login to view your profile</h2>
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
            <p className="member-since">Member since: {formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="profile-sections">
          <div className="membership-section">
            <h3>Membership Status</h3>
            <div className="membership-card">
              {user.isPremium ? (
                <div className="premium-active">
                  <div className="premium-icon">⭐</div>
                  <div className="premium-details">
                    <h4>Rice Mart Premium</h4>
                    <p>Active until: {formatDate(user.premiumExpiryDate)}</p>
                    <div className="premium-benefits">
                      <p>✔ 10% discount on all rice</p>
                      <p>✔ Free delivery</p>
                      <p>✔ Early access to sales</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="premium-inactive">
                  <div className="premium-icon">🌾</div>
                  <div className="premium-details">
                    <h4>Standard Member</h4>
                    <p>Upgrade to Premium for exclusive benefits!</p>
                    <div className="premium-benefits">
                      <p>✔ 10% discount on all rice</p>
                      <p>✔ Free delivery</p>
                      <p>✔ Early access to sales</p>
                    </div>
                    <button 
                      className="upgrade-btn"
                      onClick={handleUpgradeToPremium}
                    >
                      Upgrade to Premium - ₹199/year
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="account-section">
            <h3>Account Information</h3>
            <div className="account-details">
              <div className="detail-item">
                <label>Name:</label>
                <span>{user.name}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-item">
                <label>Account Type:</label>
                <span>{user.isPremium ? "Premium Member" : "Standard Member"}</span>
              </div>
              {user.isPremium && (
                <div className="detail-item">
                  <label>Premium Expires:</label>
                  <span>{formatDate(user.premiumExpiryDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;