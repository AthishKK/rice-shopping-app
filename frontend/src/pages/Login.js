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
    // Clear form data when component mounts and force clear any autofilled values
    setFormData({ email: "", password: "" });
    
    // Additional cleanup to prevent autofill
    const timer = setTimeout(() => {
      const emailInput = document.querySelector('input[name="email"]');
      const passwordInput = document.querySelector('input[name="password"]');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      setFormData({ email: "", password: "" });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location]);

  // Clear form data when component unmounts
  useEffect(() => {
    return () => {
      setFormData({ email: "", password: "" });
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFocus = (e) => {
    // Clear any autofilled values when user focuses on input
    if (e.target.value && !formData[e.target.name]) {
      e.target.value = '';
      setFormData({ ...formData, [e.target.name]: '' });
    }
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
        
        <form onSubmit={handleSubmit} className="login-form" autoComplete="new-password">
          <div className="form-group">
            <label>{t('email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={handleFocus}
              placeholder={`Enter your ${t('email').toLowerCase()}`}
              disabled={loading}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
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
                onFocus={handleFocus}
                placeholder={`Enter your ${t('password').toLowerCase()}`}
                disabled={loading}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
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