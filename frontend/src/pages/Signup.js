import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";
import "../styles/Login.css";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const result = await signup(formData);
    setLoading(false);

    if (result.success) {
      navigate("/login", { 
        state: { message: "Account created successfully! Please login." }
      });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{t('createAccount')}</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>{t('fullName')}</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder={`Enter your ${t('fullName').toLowerCase()}`}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={`Enter your ${t('email').toLowerCase()}`}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>{t('password')}</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={`Enter your ${t('password').toLowerCase()}`}
                disabled={loading}
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
            <label>{t('confirmPassword')}</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={`Confirm your ${t('password').toLowerCase()}`}
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Creating Account..." : t('createAccount')}
          </button>
        </form>
        
        <div className="signup-link">
          {t('alreadyHaveAccount')} <Link to="/login">{t('signIn')}</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;