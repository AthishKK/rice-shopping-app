import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location]);

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

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    const result = await login(formData);
    setLoading(false);

    if (result.success) {
      const redirectTo = result.user?.isAdmin ? '/admin' : (location.state?.from || "/");
      console.log('Login successful, redirecting to:', redirectTo);
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 100);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{t('login')}</h1>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
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
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : t('signIn')}
          </button>
        </form>
        
        <div className="signup-link">
          {t('dontHaveAccount')} <Link to="/signup">{t('createAccount')}</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;