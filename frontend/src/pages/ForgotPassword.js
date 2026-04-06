import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../components/LanguageContext";
import "../styles/Login.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("OTP sent to your email. Please check your inbox.");
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.otp) {
      setError("OTP is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: formData.otp 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("OTP verified successfully. Please set your new password.");
        setStep(3);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Both password fields are required");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: formData.otp,
          newPassword: formData.newPassword 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset successfully! You can now login with your new password.");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Reset Password</h1>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="login-form" autoComplete="off">
            <p>Enter your email address and we'll send you an OTP to reset your password.</p>
            <div className="form-group">
              <label>{t('email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="login-form" autoComplete="off">
            <p>Enter the 6-digit OTP sent to {formData.email}</p>
            <div className="form-group">
              <label>OTP</label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                disabled={loading}
                maxLength="6"
                autoComplete="off"
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            
            <div className="resend-otp">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="link-button"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="login-form" autoComplete="off">
            <p>Create a new password for your account</p>
            <div className="form-group">
              <label>New {t('password')}</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  disabled={loading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Confirm {t('password')}</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
        
        <div className="signup-link">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;