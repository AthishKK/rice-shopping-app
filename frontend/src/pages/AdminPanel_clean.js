import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";
import staticProducts from "../data/products";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Data states
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [marketPrice, setMarketPrice] = useState(null);
  const [flashSaleForm, setFlashSaleForm] = useState({ selectedProducts: [], discount: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [returns, setReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const token = localStorage.getItem('token');

  // Show message helper
  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage("");
      setTimeout(() => setError(""), 4000);
    } else {
      setMessage(msg);
      setError("");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // API call helper
  const adminAPI = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}/admin${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}.`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (err) {
      console.error('Admin API Error:', err);
      throw err;
    }
  };

  // Check admin access on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    adminAPI('/dashboard')
      .then(data => {
        setStats(data);
      })
      .catch(err => {
        showMessage(`Access Denied: ${err.message}. You need admin privileges.`, true);
        setTimeout(() => navigate('/'), 3000);
      });
  }, [isAuthenticated, navigate, token]);

  // Load data based on active tab
  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    
    const loadData = async () => {
      try {
        switch (tab) {
          case 'dashboard':
            const dashData = await adminAPI('/dashboard');
            setStats(dashData);
            break;
            
          case 'products':
            const productsData = await adminAPI('/products');
            setProducts(Array.isArray(productsData) ? productsData : []);
            break;
            
          case 'stocks':
            try {
              const stocksData = await adminAPI('/stocks');
              if (Array.isArray(stocksData) && stocksData.length > 0) {
                setStocks(stocksData);
              } else {
                showMessage('No stock data found. Use "Initialize All Stocks" button to create stock entries.', false);
              }
              
              const productsForStock = await adminAPI('/products');
              setProducts(Array.isArray(productsForStock) ? productsForStock : []);
              
            } catch (err) {
              showMessage(`Failed to load stocks: ${err.message}. Use "Initialize All Stocks" button if needed.`, true);
              
              try {
                const productsForStock = await adminAPI('/products');
                setProducts(Array.isArray(productsForStock) ? productsForStock : []);
              } catch (productErr) {
                showMessage(`Failed to load products: ${productErr.message}`, true);
              }
            }
            break;
            
          case 'orders':
            const ordersData = await adminAPI('/orders');
            setOrders(ordersData.orders || []);
            break;
            
          case 'users':
            const usersData = await adminAPI('/users');
            setUsers(usersData.users || []);
            break;
            
          case 'offers':
            const offersData = await adminAPI('/offers');
            setOffers(Array.isArray(offersData) ? offersData : []);
            break;
            
          case 'pricing':
            const pricingData = await adminAPI('/market-price');
            setMarketPrice(pricingData);
            break;
            
          case 'analytics':
            const analyticsData = await adminAPI('/dashboard');
            setStats(analyticsData);
            
            try {
              const returnAnalytics = await adminAPI('/returns/analytics');
              setStats(prev => ({ ...prev, returnAnalytics }));
            } catch (err) {
              console.error('Failed to load return analytics:', err);
            }
            break;
            
          case 'returns':
            const returnsData = await adminAPI('/returns');
            setReturns(Array.isArray(returnsData) ? returnsData : []);
            break;
            
          case 'reviews':
            try {
              const reviewsData = await adminAPI('/reviews/all');
              setReviews(Array.isArray(reviewsData) ? reviewsData : []);
            } catch (err) {
              showMessage(`Failed to load reviews: ${err.message}`, true);
              setReviews([]);
            }
            break;
            
          case 'flashsale':
            const flashProducts = await adminAPI('/products');
            setProducts(Array.isArray(flashProducts) ? flashProducts : []);
            break;
            
          default:
            break;
        }
      } catch (err) {
        showMessage(`Failed to load ${tab}: ${err.message}`, true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tab, token]);

  if (!isAuthenticated) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Please login to access admin panel.</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%)',
      minHeight: '100vh'
    }}>
      <div style={{ 
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '25px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{ 
          background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          fontSize: '36px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>🌾 {t('adminControlCenter')}</h1>
        <p style={{ 
          color: '#666', 
          margin: '0',
          fontSize: '16px',
          background: 'linear-gradient(90deg, #ff6b35, #f7931e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t('welcomeBack')}, {user?.name} ({user?.email})
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          padding: '15px 20px',
          marginBottom: '25px',
          background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
          color: 'white',
          borderRadius: '15px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
          backdropFilter: 'blur(10px)',
          animation: 'slideInDown 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <span style={{ fontWeight: 'bold' }}>{message}</span>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '15px 20px',
          marginBottom: '25px',
          background: 'linear-gradient(135deg, #f44336, #e57373)',
          color: 'white',
          borderRadius: '15px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)',
          backdropFilter: 'blur(10px)',
          animation: 'shake 0.5s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ fontWeight: 'bold' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ 
        marginBottom: '40px', 
        display: 'flex', 
        gap: '15px', 
        flexWrap: 'wrap',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '20px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(255, 107, 53, 0.2)',
        backdropFilter: 'blur(15px)'
      }}>
        {[
          { key: 'dashboard', label: `📊 ${t('dashboard')}`, gradient: 'linear-gradient(135deg, #ff6b35, #f7931e)' },
          { key: 'products', label: `🌾 ${t('products')}`, gradient: 'linear-gradient(135deg, #4caf50, #66bb6a)' },
          { key: 'stocks', label: `📦 ${t('stockManagement')}`, gradient: 'linear-gradient(135deg, #673ab7, #9c27b0)' },
          { key: 'orders', label: `📦 ${t('orders')}`, gradient: 'linear-gradient(135deg, #2196f3, #42a5f5)' },
          { key: 'users', label: `👥 ${t('users')}`, gradient: 'linear-gradient(135deg, #9c27b0, #ba68c8)' },
          { key: 'returns', label: `🔄 ${t('returns')}`, gradient: 'linear-gradient(135deg, #e53935, #ef5350)' },
          { key: 'reviews', label: `⭐ ${t('reviews')}`, gradient: 'linear-gradient(135deg, #ffc107, #ffca28)' },
          { key: 'flashsale', label: `⚡ ${t('flashSale')}`, gradient: 'linear-gradient(135deg, #ff6b35, #f7931e)' },
          { key: 'pricing', label: `💰 ${t('pricing')}`, gradient: 'linear-gradient(135deg, #795548, #8d6e63)' },
          { key: 'analytics', label: `📈 ${t('analytics')}`, gradient: 'linear-gradient(135deg, #607d8b, #78909c)' }
        ].map(({ key, label, gradient }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '15px 25px',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              background: tab === key ? gradient : 'rgba(255, 255, 255, 0.8)',
              color: tab === key ? 'white' : '#333',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: tab === key ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
              boxShadow: tab === key 
                ? '0 8px 25px rgba(0,0,0,0.15), 0 0 20px rgba(255,107,53,0.3)' 
                : '0 4px 15px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              border: tab === key ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(255, 107, 53, 0.2)',
          backdropFilter: 'blur(15px)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #ff6b35',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <div style={{
            background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>{t('loadingData')}</div>
        </div>
      )}

      {/* Dashboard Tab */}
      {tab === 'dashboard' && stats && (
        <div>
          {/* Market Price Banner */}
          {stats.marketPrice && (
            <div style={{
              background: 'linear-gradient(135deg, #1976d2, #42a5f5, #64b5f6)',
              color: 'white',
              padding: '25px 30px',
              borderRadius: '20px',
              marginBottom: '25px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 15px 35px rgba(25, 118, 210, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>📊 Live Market Price: ₹{stats.marketPrice.pricePerKg}/kg</h4>
                <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
                  Trend: {stats.marketPrice.trend === 'up' ? '⬆️ Up' : stats.marketPrice.trend === 'down' ? '⬇️ Down' : '➡️ Stable'} • 
                  Source: {stats.marketPrice.source} • 
                  Updated: {new Date(stats.marketPrice.lastUpdated).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '25px',
            marginBottom: '35px'
          }}>
            {[
              { label: t('totalUsers'), value: stats.stats?.totalUsers || 0, icon: '👥', gradient: 'linear-gradient(135deg, #1976d2, #42a5f5)' },
              { label: t('totalOrders'), value: stats.stats?.totalOrders || 0, icon: '📦', gradient: 'linear-gradient(135deg, #388e3c, #66bb6a)' },
              { label: t('totalProducts'), value: stats.stats?.totalProducts || 0, icon: '🌾', gradient: 'linear-gradient(135deg, #f57c00, #ffb74d)' },
              { label: t('totalRevenue'), value: `₹${stats.stats?.totalRevenue || 0}`, icon: '💰', gradient: 'linear-gradient(135deg, #7b1fa2, #ba68c8)' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '25px',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(15px)'
              }}>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '15px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                }}>{stat.icon}</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px'
                }}>
                  {stat.value}
                </div>
                <div style={{ 
                  color: '#666', 
                  fontSize: '14px', 
                  fontWeight: '500'
                }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple message for other tabs */}
      {tab !== 'dashboard' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(255, 107, 53, 0.2)'
        }}>
          <h2 style={{ 
            background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '20px'
          }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Management
          </h2>
          <p style={{ color: '#666', fontSize: '18px' }}>
            Festival system has been removed for better stability. This section is now simplified.
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;