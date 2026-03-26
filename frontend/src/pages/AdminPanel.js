import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { backupStocks, restoreStocks, hasStockBackup, generateDefaultStocks } from "../utils/stockBackup";
import staticProducts from "../data/products";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
  const [festivals, setFestivals] = useState([]);
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
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. This usually means authentication failed or the endpoint doesn't exist.`);
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
    console.log('AdminPanel mounted');
    console.log('User:', user);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('Token:', token ? 'exists' : 'missing');
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    // Test admin access by trying to fetch dashboard
    console.log('Testing admin access...');
    adminAPI('/dashboard')
      .then(data => {
        console.log('Admin access confirmed:', data);
        setStats(data);
      })
      .catch(err => {
        console.error('Admin access denied:', err);
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
              console.log('Loading stocks data...');
              const stocksData = await adminAPI('/stocks');
              console.log('Stocks loaded:', stocksData?.length || 0, 'entries');
              
              if (Array.isArray(stocksData) && stocksData.length > 0) {
                setStocks(stocksData);
                // Backup successful stock data
                backupStocks(stocksData);
              } else {
                console.warn('No stocks data received');
                showMessage('No stock data found. Use "Initialize All Stocks" button to create stock entries.', false);
              }
              
              // Load products for stock management
              const productsForStock = await adminAPI('/products');
              console.log('Products loaded:', productsForStock?.length || 0, 'products');
              setProducts(Array.isArray(productsForStock) ? productsForStock : []);
              
            } catch (err) {
              console.error('Failed to load stocks:', err);
              showMessage(`Failed to load stocks: ${err.message}. Use "Initialize All Stocks" button if needed.`, true);
              
              // Only try backup recovery if explicitly requested, not automatically
              // if (hasStockBackup()) {
              //   const backupStocks = restoreStocks();
              //   if (backupStocks.length > 0) {
              //     setStocks(backupStocks);
              //     showMessage(`API failed, restored ${backupStocks.length} stocks from backup`, false);
              //   }
              // }
              
              // Still try to load products
              try {
                const productsForStock = await adminAPI('/products');
                setProducts(Array.isArray(productsForStock) ? productsForStock : []);
              } catch (productErr) {
                console.error('Failed to load products:', productErr);
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
            
          case 'festivals':
            const festivalsData = await adminAPI('/festivals');
            setFestivals(Array.isArray(festivalsData) ? festivalsData : []);
            break;
            
          case 'pricing':
            const pricingData = await adminAPI('/market-price');
            setMarketPrice(pricingData);
            break;
            
          case 'analytics':
            const analyticsData = await adminAPI('/dashboard');
            setStats(analyticsData);
            break;
            
          case 'returns':
            const returnsData = await adminAPI('/returns');
            setReturns(Array.isArray(returnsData) ? returnsData : []);
            break;
            
          case 'reviews':
            console.log('Loading reviews for admin panel...');
            try {
              const reviewsData = await adminAPI('/reviews/all');
              console.log('Reviews loaded:', reviewsData.length, 'reviews');
              setReviews(Array.isArray(reviewsData) ? reviewsData : []);
            } catch (err) {
              console.error('Failed to load reviews:', err);
              showMessage(`Failed to load reviews: ${err.message}`, true);
              setReviews([]);
            }
            break;
            
          case 'flashsale':
            // Load products for flash sale selection
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

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminAPI(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      showMessage('Order status updated successfully!');
      
      // Reload orders
      const ordersData = await adminAPI('/orders');
      setOrders(ordersData.orders || []);
    } catch (err) {
      showMessage(`Failed to update order: ${err.message}`, true);
    }
  };

  // Toggle offer status
  const toggleOffer = async (offerId) => {
    try {
      await adminAPI(`/offers/${offerId}/toggle`, { method: 'PUT' });
      showMessage('Offer status updated!');
      
      // Reload offers
      const offersData = await adminAPI('/offers');
      setOffers(Array.isArray(offersData) ? offersData : []);
    } catch (err) {
      showMessage(`Failed to toggle offer: ${err.message}`, true);
    }
  };

  // Festival management functions
  const toggleFestival = async (festivalId) => {
    try {
      await adminAPI(`/festivals/${festivalId}/toggle`, { method: 'PUT' });
      showMessage('Festival status updated!');
      
      // Reload festivals
      const festivalsData = await adminAPI('/festivals');
      setFestivals(Array.isArray(festivalsData) ? festivalsData : []);
    } catch (err) {
      showMessage(`Failed to toggle festival: ${err.message}`, true);
    }
  };

  const applyFestivalNow = async () => {
    try {
      const result = await adminAPI('/festivals/apply-now', { method: 'POST' });
      showMessage(result.message || 'Festival discounts applied!');
    } catch (err) {
      showMessage(`Failed to apply festival: ${err.message}`, true);
    }
  };

  const createFestival = async (festivalData) => {
    try {
      await adminAPI('/festivals', {
        method: 'POST',
        body: JSON.stringify(festivalData)
      });
      showMessage('Festival created successfully!');
      
      // Reload festivals
      const festivalsData = await adminAPI('/festivals');
      setFestivals(Array.isArray(festivalsData) ? festivalsData : []);
    } catch (err) {
      showMessage(`Failed to create festival: ${err.message}`, true);
    }
  };

  const deleteFestival = async (festivalId) => {
    if (!window.confirm('Are you sure you want to delete this festival?')) return;
    
    try {
      await adminAPI(`/festivals/${festivalId}`, { method: 'DELETE' });
      showMessage('Festival deleted successfully!');
      
      // Reload festivals
      const festivalsData = await adminAPI('/festivals');
      setFestivals(Array.isArray(festivalsData) ? festivalsData : []);
    } catch (err) {
      showMessage(`Failed to delete festival: ${err.message}`, true);
    }
  };

  // Flash Sale Manual Control functions
  const createAutoFlashSale = async () => {
    try {
      const result = await adminAPI('/flash-sale/auto', { method: 'POST' });
      showMessage(`Auto flash sale created for ${result.products?.length || 0} products!`);
    } catch (err) {
      showMessage(`Failed to create auto flash sale: ${err.message}`, true);
    }
  };

  const createManualFlashSale = async () => {
    if (flashSaleForm.selectedProducts.length === 0 || !flashSaleForm.discount) {
      showMessage('Please select products and enter discount percentage', true);
      return;
    }

    try {
      const products = flashSaleForm.selectedProducts.map(productId => ({
        productId,
        discount: parseInt(flashSaleForm.discount)
      }));

      await adminAPI('/flash-sale/manual', {
        method: 'POST',
        body: JSON.stringify({ products })
      });
      
      showMessage(`Manual flash sale created for ${products.length} products with ${flashSaleForm.discount}% discount!`);
      setFlashSaleForm({ selectedProducts: [], discount: '' });
    } catch (err) {
      showMessage(`Failed to create manual flash sale: ${err.message}`, true);
    }
  };

  const clearFlashSale = async () => {
    if (!window.confirm('Clear all flash sales?')) return;
    
    try {
      await adminAPI('/flash-sale/clear', { method: 'POST' });
      showMessage('All flash sales cleared!');
    } catch (err) {
      showMessage(`Failed to clear flash sales: ${err.message}`, true);
    }
  };

  const toggleProductSelection = (productId) => {
    setFlashSaleForm(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }));
  };

  // User management functions
  const updateUserStatus = async (userId, updates) => {
    try {
      await adminAPI(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      showMessage('User updated successfully!');
      
      // Reload users
      const usersData = await adminAPI('/users');
      setUsers(usersData.users || []);
    } catch (err) {
      showMessage(`Failed to update user: ${err.message}`, true);
    }
  };

  const toggleUserPremium = (userId, currentStatus) => {
    updateUserStatus(userId, { isPremium: !currentStatus });
  };

  const updateRicePoints = (userId, newPoints) => {
    if (newPoints < 0) {
      showMessage('Rice points cannot be negative', true);
      return;
    }
    updateUserStatus(userId, { ricePoints: parseInt(newPoints) });
  };

  // Pricing management functions
  const refreshMarketPrice = async () => {
    try {
      const result = await adminAPI('/market-price/refresh', { method: 'POST' });
      showMessage(`Market price refreshed from ${result.source}!`);
      
      // Reload market price
      const pricingData = await adminAPI('/market-price');
      setMarketPrice(pricingData);
    } catch (err) {
      showMessage(`Failed to refresh market price: ${err.message}`, true);
    }
  };

  const setManualMarketPrice = async (price) => {
    if (!price || price <= 0) {
      showMessage('Please enter a valid price', true);
      return;
    }

    try {
      await adminAPI('/market-price/set', {
        method: 'POST',
        body: JSON.stringify({ price: parseFloat(price) })
      });
      showMessage(`Market price manually set to ₹${price}/kg!`);
      
      // Reload market price
      const pricingData = await adminAPI('/market-price');
      setMarketPrice(pricingData);
    } catch (err) {
      showMessage(`Failed to set market price: ${err.message}`, true);
    }
  };

  // Order details modal functions
  const openOrderModal = async (orderId) => {
    try {
      const orderDetails = await adminAPI(`/orders/${orderId}`);
      setSelectedOrder(orderDetails);
      setShowOrderModal(true);
    } catch (err) {
      showMessage(`Failed to load order details: ${err.message}`, true);
    }
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  // Stock recovery function - if stocks are empty, try to reload them
  const recoverStocks = async () => {
    if (stocks.length === 0) {
      try {
        console.log('🔄 Attempting to recover stocks...');
        const stocksData = await adminAPI('/stocks');
        if (Array.isArray(stocksData) && stocksData.length > 0) {
          setStocks(stocksData);
          showMessage(`Recovered ${stocksData.length} stock entries!`);
        } else {
          showMessage('No stock data found. Please initialize stocks.', true);
        }
      } catch (err) {
        console.error('Stock recovery failed:', err);
        showMessage(`Stock recovery failed: ${err.message}`, true);
      }
    }
  };

  // Auto-recover stocks when stocks tab is opened and stocks are empty - DISABLED
  // This was causing auto-refill issues
  // useEffect(() => {
  //   if (tab === 'stocks' && stocks.length === 0 && !loading) {
  //     console.log('🔄 Auto-recovering stocks...');
  //     recoverStocks();
  //   }
  // }, [tab, stocks.length, loading]);

  // Stock initialization function
  const initializeAllStocks = async () => {
    try {
      setLoading(true);
      showMessage('Initializing stocks for all products...', false);
      
      console.log('Calling initialize stocks API...');
      const response = await adminAPI('/stocks/initialize-all', {
        method: 'POST'
      });
      
      console.log('Initialize stocks response:', response);
      showMessage(response.message || 'Stocks initialized successfully!');
      
      // Reload stocks data after initialization
      const stocksData = await adminAPI('/stocks');
      console.log('Reloaded stocks after initialization:', stocksData.length, 'entries');
      
      if (Array.isArray(stocksData) && stocksData.length > 0) {
        setStocks(stocksData);
        backupStocks(stocksData);
      } else {
        // If API still returns empty, generate defaults and try to save them
        const productsForStock = await adminAPI('/products');
        if (productsForStock.length > 0) {
          const defaultStocks = generateDefaultStocks(productsForStock);
          
          // Try to save the generated stocks to backend
          try {
            await adminAPI('/stocks/bulk', {
              method: 'PUT',
              body: JSON.stringify({ stocks: defaultStocks })
            });
            
            // Reload after saving
            const savedStocks = await adminAPI('/stocks');
            if (savedStocks.length > 0) {
              setStocks(savedStocks);
              backupStocks(savedStocks);
              showMessage(`Generated and saved ${savedStocks.length} stock entries!`);
            } else {
              setStocks(defaultStocks);
              backupStocks(defaultStocks);
              showMessage(`Generated ${defaultStocks.length} default stock entries (local only)`);
            }
          } catch (saveErr) {
            console.error('Failed to save generated stocks:', saveErr);
            setStocks(defaultStocks);
            backupStocks(defaultStocks);
            showMessage(`Generated ${defaultStocks.length} default stock entries (local backup)`);
          }
        }
      }
      
    } catch (err) {
      console.error('Initialize stocks error:', err);
      showMessage(`Failed to initialize stocks: ${err.message}`, true);
      
      // Fallback: try to restore from backup or generate defaults
      if (hasStockBackup()) {
        const backupStocks = restoreStocks();
        if (backupStocks.length > 0) {
          setStocks(backupStocks);
          showMessage(`Restored ${backupStocks.length} stocks from backup`, false);
        }
      } else {
        // Generate defaults as last resort
        try {
          const productsForStock = await adminAPI('/products');
          if (productsForStock.length > 0) {
            const defaultStocks = generateDefaultStocks(productsForStock);
            setStocks(defaultStocks);
            backupStocks(defaultStocks);
            showMessage(`Generated ${defaultStocks.length} default stock entries as fallback`, false);
          }
        } catch (productErr) {
          console.error('Failed to load products for fallback:', productErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functions
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Please login to access admin panel.</div>;
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideInDown {
            from {
              opacity: 0;
              transform: translate3d(0, -100%, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translate3d(0, 30px, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          }
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>
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
        }}>🌾 Admin Control Center</h1>
        <p style={{ 
          color: '#666', 
          margin: '0',
          fontSize: '16px',
          background: 'linear-gradient(90deg, #ff6b35, #f7931e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome back, {user?.name} ({user?.email})
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
          { key: 'dashboard', label: '📊 Dashboard', gradient: 'linear-gradient(135deg, #ff6b35, #f7931e)' },
          { key: 'products', label: '🌾 Products', gradient: 'linear-gradient(135deg, #4caf50, #66bb6a)' },
          { key: 'stocks', label: '📦 Stock Management', gradient: 'linear-gradient(135deg, #673ab7, #9c27b0)' },
          { key: 'orders', label: '📦 Orders', gradient: 'linear-gradient(135deg, #2196f3, #42a5f5)' },
          { key: 'users', label: '👥 Users', gradient: 'linear-gradient(135deg, #9c27b0, #ba68c8)' },
          { key: 'returns', label: '🔄 Returns', gradient: 'linear-gradient(135deg, #e53935, #ef5350)' },
          { key: 'reviews', label: '⭐ Reviews', gradient: 'linear-gradient(135deg, #ffc107, #ffca28)' },
          { key: 'flashsale', label: '⚡ Flash Sale', gradient: 'linear-gradient(135deg, #ff6b35, #f7931e)' },
          { key: 'pricing', label: '💰 Pricing', gradient: 'linear-gradient(135deg, #795548, #8d6e63)' },
          { key: 'analytics', label: '📈 Analytics', gradient: 'linear-gradient(135deg, #607d8b, #78909c)' }
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
          }}>Loading amazing data...</div>
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
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }}></div>
              <div style={{ zIndex: 2 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>📊 Live Market Price: ₹{stats.marketPrice.pricePerKg}/kg</h4>
                <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
                  Trend: {stats.marketPrice.trend === 'up' ? '⬆️ Up' : stats.marketPrice.trend === 'down' ? '⬇️ Down' : '➡️ Stable'} • 
                  Source: {stats.marketPrice.source} • 
                  Updated: {new Date(stats.marketPrice.lastUpdated).toLocaleString('en-IN')}
                </p>
              </div>
              <div style={{ 
                fontSize: '48px', 
                zIndex: 2,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}>
                {stats.marketPrice.trend === 'up' ? '📈' : stats.marketPrice.trend === 'down' ? '📉' : '📊'}
              </div>
            </div>
          )}

          {/* Active Festival Banner */}
          {stats.activeFestival && (
            <div style={{
              background: 'linear-gradient(135deg, #7b1fa2, #ab47bc, #ce93d8)',
              color: 'white',
              padding: '25px 30px',
              borderRadius: '20px',
              marginBottom: '25px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 15px 35px rgba(123, 31, 162, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30%',
                left: '-10%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                borderRadius: '50%'
              }}></div>
              <div style={{ zIndex: 2 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>🎉 Active Festival: {stats.activeFestival.name}</h4>
                <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
                  {stats.activeFestival.discount}% discount • {stats.activeFestival.bannerText}
                </p>
              </div>
              <div style={{ 
                fontSize: '48px', 
                zIndex: 2,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }}>🎆</div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '25px',
            marginBottom: '35px'
          }}>
            {[
              { label: 'Total Users', value: stats.stats?.totalUsers || 0, icon: '👥', gradient: 'linear-gradient(135deg, #1976d2, #42a5f5)' },
              { label: 'Total Orders', value: stats.stats?.totalOrders || 0, icon: '📦', gradient: 'linear-gradient(135deg, #388e3c, #66bb6a)' },
              { label: 'Total Products', value: stats.stats?.totalProducts || 0, icon: '🌾', gradient: 'linear-gradient(135deg, #f57c00, #ffb74d)' },
              { label: 'Total Revenue', value: `₹${stats.stats?.totalRevenue || 0}`, icon: '💰', gradient: 'linear-gradient(135deg, #7b1fa2, #ba68c8)' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '25px',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(15px)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-20%',
                  width: '120px',
                  height: '120px',
                  background: stat.gradient,
                  borderRadius: '50%',
                  opacity: 0.1
                }}></div>
                <div style={{ 
                  fontSize: '48px', 
                  marginBottom: '15px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                  zIndex: 2,
                  position: 'relative'
                }}>{stat.icon}</div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  background: stat.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '8px',
                  zIndex: 2,
                  position: 'relative'
                }}>
                  {stat.value}
                </div>
                <div style={{ 
                  color: '#666', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  zIndex: 2,
                  position: 'relative'
                }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Order Status Breakdown */}
          {stats.orderStats && stats.orderStats.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: '0', color: '#333' }}>Order Status Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                {stats.orderStats.map((status, index) => {
                  const colors = {
                    'Placed': '#2196f3',
                    'Processing': '#ff9800',
                    'Shipped': '#9c27b0',
                    'Delivered': '#4caf50',
                    'Cancelled': '#f44336'
                  };
                  return (
                    <div key={index} style={{
                      textAlign: 'center',
                      padding: '15px',
                      backgroundColor: colors[status._id] || '#666',
                      color: 'white',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{status.count}</div>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase' }}>{status._id}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Low Stock Alert */}
          {stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f44336, #e57373)',
              color: 'white',
              padding: '25px 30px',
              borderRadius: '20px',
              marginBottom: '25px',
              boxShadow: '0 15px 35px rgba(244, 67, 54, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden',
              animation: 'pulse 2s infinite'
            }}>
              <div style={{
                position: 'absolute',
                top: '-40%',
                right: '-15%',
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }}></div>
              <h3 style={{ 
                marginTop: '0', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px',
                fontSize: '22px',
                fontWeight: 'bold',
                zIndex: 2,
                position: 'relative'
              }}>
                <span style={{ fontSize: '28px' }}>⚠️</span>
                Critical Stock Alert ({stats.lowStockProducts.length} products)
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                zIndex: 2,
                position: 'relative'
              }}>
                {stats.lowStockProducts.slice(0, 6).map((product, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ fontWeight: 'bold', color: 'white', fontSize: '16px', marginBottom: '5px' }}>{product.name}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>Stock: {product.stock} units left</div>
                  </div>
                ))}
              </div>
              {stats.lowStockProducts.length > 6 && (
                <div style={{ 
                  marginTop: '15px', 
                  fontSize: '14px', 
                  color: 'rgba(255,255,255,0.9)',
                  zIndex: 2,
                  position: 'relative'
                }}>
                  +{stats.lowStockProducts.length - 6} more products need immediate attention
                </div>
              )}
            </div>
          )}

          {/* Recent Orders */}
          <div className="glass-card hover-lift" style={{
            padding: '30px',
            borderRadius: '20px',
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <h3 style={{ 
              marginTop: '0', 
              background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '25px'
            }}>Recent Orders</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                    color: 'white'
                  }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderRadius: '10px 0 0 0', fontWeight: 'bold' }}>Order ID</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Customer</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Amount</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderRadius: '0 10px 0 0', fontWeight: 'bold' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders?.slice(0, 10).map((order, index) => (
                    <tr key={order._id} style={{
                      background: index % 2 === 0 ? 'rgba(255, 107, 53, 0.05)' : 'transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 53, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 107, 53, 0.05)' : 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    >
                      <td style={{ padding: '15px', borderBottom: '1px solid rgba(255, 107, 53, 0.1)' }}>
                        <button
                          onClick={() => openOrderModal(order._id)}
                          style={{
                            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                          }}
                        >
                          #{order._id?.slice(-8).toUpperCase()}
                        </button>
                      </td>
                      <td style={{ padding: '15px', borderBottom: '1px solid rgba(255, 107, 53, 0.1)', fontWeight: '500' }}>
                        {order.userId?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '15px', borderBottom: '1px solid rgba(255, 107, 53, 0.1)' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: order.status === 'Delivered' ? 'linear-gradient(135deg, #4caf50, #66bb6a)' : 
                                     order.status === 'Cancelled' ? 'linear-gradient(135deg, #f44336, #e57373)' : 
                                     order.status === 'Shipped' ? 'linear-gradient(135deg, #9c27b0, #ba68c8)' : 'linear-gradient(135deg, #ff9800, #ffb74d)',
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', borderBottom: '1px solid rgba(255, 107, 53, 0.1)', fontWeight: 'bold', color: '#ff6b35' }}>
                        ₹{order.totalAmount}
                      </td>
                      <td style={{ padding: '15px', borderBottom: '1px solid rgba(255, 107, 53, 0.1)', color: '#666' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>Products ({products.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Base Premium</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{product.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{product.category}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>₹{product.basePremium}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {product.isFlashSale && <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>🔥 Flash Sale</span>}
                      {product.festivalDiscount > 0 && <span style={{ color: '#7b1fa2', fontWeight: 'bold' }}>🎉 Festival</span>}
                      {!product.isFlashSale && product.festivalDiscount === 0 && <span style={{ color: '#666' }}>Normal</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: '0', color: '#333' }}>Orders ({filteredOrders.length})</h3>
            
            {/* Search and Filter Controls */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '250px'
                }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="All">All Status</option>
                <option value="Placed">Placed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <button
                        onClick={() => openOrderModal(order._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1976d2',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: '14px'
                        }}
                      >
                        #{order._id?.slice(-8).toUpperCase()}
                      </button>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div>{order.userId?.name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{order.userId?.email}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>₹{order.totalAmount}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: order.status === 'Delivered' ? '#e8f5e9' : 
                                       order.status === 'Cancelled' ? '#ffebee' : '#fff3e0',
                        color: order.status === 'Delivered' ? '#2e7d32' : 
                               order.status === 'Cancelled' ? '#c62828' : '#f57c00'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '12px'
                        }}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>Users ({users.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Premium</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Rice Points</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Joined</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                      {user.isAdmin && <div style={{ fontSize: '12px', color: '#ff6b35', fontWeight: 'bold' }}>🔑 Admin</div>}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{user.email}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user.isPremium ? (
                          <span style={{ color: '#ffd700', fontWeight: 'bold' }}>⭐ Premium</span>
                        ) : (
                          <span style={{ color: '#666' }}>Regular</span>
                        )}
                        {!user.isAdmin && (
                          <button
                            onClick={() => toggleUserPremium(user._id, user.isPremium)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              backgroundColor: user.isPremium ? '#c62828' : '#ffd700',
                              color: user.isPremium ? 'white' : '#333'
                            }}
                          >
                            {user.isPremium ? 'Remove Premium' : 'Make Premium'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#ff6b35' }}>{user.ricePoints || 0}</span>
                        {!user.isAdmin && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => updateRicePoints(user._id, (user.ricePoints || 0) + 100)}
                              style={{
                                padding: '2px 6px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                backgroundColor: '#4caf50',
                                color: 'white'
                              }}
                              title="Add 100 points"
                            >
                              +100
                            </button>
                            <button
                              onClick={() => updateRicePoints(user._id, Math.max(0, (user.ricePoints || 0) - 50))}
                              style={{
                                padding: '2px 6px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                backgroundColor: '#f44336',
                                color: 'white'
                              }}
                              title="Remove 50 points"
                            >
                              -50
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {!user.isAdmin && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              const points = prompt('Enter new rice points:', user.ricePoints || 0);
                              if (points !== null && !isNaN(points)) {
                                updateRicePoints(user._id, parseInt(points));
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              backgroundColor: '#2196f3',
                              color: 'white'
                            }}
                          >
                            Edit Points
                          </button>
                        </div>
                      )}
                      {user.isAdmin && (
                        <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>Admin User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offers Tab */}
      {tab === 'offers' && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>Offers ({offers.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Discount</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => (
                  <tr key={offer._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{offer.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{offer.type}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{offer.discount}%</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: offer.isActive ? '#e8f5e9' : '#ffebee',
                        color: offer.isActive ? '#2e7d32' : '#c62828'
                      }}>
                        {offer.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <button
                        onClick={() => toggleOffer(offer._id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          backgroundColor: offer.isActive ? '#c62828' : '#2e7d32',
                          color: 'white'
                        }}
                      >
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Festivals Tab */}
      {tab === 'festivals' && (
        <div>
          {/* Active Festival Banner */}
          {stats?.activeFestival && (
            <div style={{
              backgroundColor: '#7b1fa2',
              color: 'white',
              padding: '15px 20px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>🎉 Active Festival: {stats.activeFestival.name}</h4>
                <p style={{ margin: '0', fontSize: '14px' }}>
                  {stats.activeFestival.discount}% discount • {stats.activeFestival.bannerText}
                </p>
              </div>
              <button
                onClick={applyFestivalNow}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Apply Now
              </button>
            </div>
          )}

          {/* Festival Management */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: '0', color: '#333' }}>Festivals ({festivals.length})</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const name = prompt('Festival Name:');
                    if (!name) return;
                    const startMonth = parseInt(prompt('Start Month (1-12):')) - 1;
                    const startDay = parseInt(prompt('Start Day (1-31):'));
                    const endMonth = parseInt(prompt('End Month (1-12):')) - 1;
                    const endDay = parseInt(prompt('End Day (1-31):'));
                    const discount = parseInt(prompt('Discount Percentage (1-50):'));
                    const bannerText = prompt('Banner Text:') || `${name} Special - ${discount}% Off!`;
                    
                    if (isNaN(startMonth) || isNaN(startDay) || isNaN(endMonth) || isNaN(endDay) || isNaN(discount)) {
                      alert('Please enter valid numbers for dates and discount');
                      return;
                    }
                    
                    if (discount < 1 || discount > 50) {
                      alert('Discount must be between 1-50%');
                      return;
                    }
                    
                    createFestival({
                      name,
                      startMonth,
                      startDay,
                      endMonth,
                      endDay,
                      discount,
                      bannerText,
                      isActive: true
                    });
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  🎆 Add New Festival
                </button>
                <button
                  onClick={applyFestivalNow}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🎯 Apply Festival Now
                </button>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Festival Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Period</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Discount</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {festivals.map(festival => (
                    <tr key={festival._id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <div style={{ fontWeight: 'bold' }}>{festival.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{festival.bannerText}</div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        {festival.startDay}/{festival.startMonth} - {festival.endDay}/{festival.endMonth}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <span style={{ fontWeight: 'bold', color: '#7b1fa2' }}>{festival.discount}%</span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: festival.isActive ? '#e8f5e9' : '#ffebee',
                          color: festival.isActive ? '#2e7d32' : '#c62828'
                        }}>
                          {festival.isActive ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => toggleFestival(festival._id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              backgroundColor: festival.isActive ? '#c62828' : '#2e7d32',
                              color: 'white'
                            }}
                          >
                            {festival.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteFestival(festival._id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              backgroundColor: '#f44336',
                              color: 'white'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Flash Sale Tab */}
      {tab === 'flashsale' && (
        <div>
          {/* Flash Sale Controls */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: '0', color: '#333' }}>⚡ Flash Sale Control</h3>
            
            {/* Auto Flash Sale */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '1px solid #ffcc80' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#e65100' }}>Auto Flash Sale</h4>
              <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>Randomly selects 2-4 products and applies flash sale discounts (15-25%)</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={createAutoFlashSale}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🎲 Create Auto Flash Sale
                </button>
                <button
                  onClick={clearFlashSale}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#c62828',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Clear All Flash Sales
                </button>
              </div>
            </div>

            {/* Manual Flash Sale */}
            <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #90caf9' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Manual Flash Sale</h4>
              <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>Select specific products and set custom discount percentage</p>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Discount Percentage:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Enter discount % (1-50)"
                  value={flashSaleForm.discount}
                  onChange={(e) => setFlashSaleForm(prev => ({ ...prev, discount: e.target.value }))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '200px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Selected Products: {flashSaleForm.selectedProducts.length}</label>
              </div>

              <button
                onClick={createManualFlashSale}
                disabled={flashSaleForm.selectedProducts.length === 0 || !flashSaleForm.discount}
                style={{
                  padding: '10px 20px',
                  backgroundColor: flashSaleForm.selectedProducts.length === 0 || !flashSaleForm.discount ? '#ccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: flashSaleForm.selectedProducts.length === 0 || !flashSaleForm.discount ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🎯 Create Manual Flash Sale
              </button>
            </div>
          </div>

          {/* Product Selection */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: '0', color: '#333' }}>Select Products for Flash Sale</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Select</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Stock</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id} style={{ backgroundColor: flashSaleForm.selectedProducts.includes(product._id) ? '#e8f5e9' : 'white' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <input
                          type="checkbox"
                          checked={flashSaleForm.selectedProducts.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          style={{ transform: 'scale(1.2)' }}
                        />
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontWeight: flashSaleForm.selectedProducts.includes(product._id) ? 'bold' : 'normal' }}>
                        {product.name}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{product.category}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        <span style={{
                          color: product.stock < 10 ? '#c62828' : '#2e7d32',
                          fontWeight: product.stock < 10 ? 'bold' : 'normal'
                        }}>
                          {product.stock} {product.stock < 10 && '⚠️'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                        {product.isFlashSale ? (
                          <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>🔥 Flash Sale ({product.flashSaleDiscount}%)</span>
                        ) : product.festivalDiscount > 0 ? (
                          <span style={{ color: '#7b1fa2', fontWeight: 'bold' }}>🎉 Festival ({product.festivalDiscount}%)</span>
                        ) : (
                          <span style={{ color: '#666' }}>Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {tab === 'pricing' && (
        <div>
          {/* Current Market Price */}
          {marketPrice && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: '0', color: '#333' }}>📊 Current Market Price</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '10px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>₹{marketPrice.pricePerKg}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Per KG</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: marketPrice.trend === 'up' ? '#e8f5e9' : marketPrice.trend === 'down' ? '#ffebee' : '#fff3e0', borderRadius: '10px' }}>
                  <div style={{ fontSize: '24px', color: marketPrice.trend === 'up' ? '#4caf50' : marketPrice.trend === 'down' ? '#f44336' : '#ff9800' }}>
                    {marketPrice.trend === 'up' ? '⬆️' : marketPrice.trend === 'down' ? '⬇️' : '➡️'}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', textTransform: 'capitalize' }}>{marketPrice.trend}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '10px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#7b1fa2', textTransform: 'capitalize' }}>{marketPrice.source}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Source</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '10px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f57c00' }}>
                    {new Date(marketPrice.lastUpdated).toLocaleString('en-IN')}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>Last Updated</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={refreshMarketPrice}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  🔄 Refresh from API
                </button>
                <button
                  onClick={() => {
                    const price = prompt('Enter new market price per kg (₹):', marketPrice.pricePerKg);
                    if (price !== null && !isNaN(price) && parseFloat(price) > 0) {
                      setManualMarketPrice(price);
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  ✏️ Set Manual Price
                </button>
              </div>
            </div>
          )}

          {/* Pricing Information */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: '0', color: '#333' }}>💰 Dynamic Pricing System</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '10px', border: '2px solid #4caf50' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2e7d32' }}>🌾 Product Pricing Formula</h4>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                  <strong>Base Price:</strong> Market Price + Product Premium<br/>
                  <strong>6 Months:</strong> Base Price<br/>
                  <strong>1 Year:</strong> Base Price + ₹20<br/>
                  <strong>2 Years:</strong> Base Price + ₹40<br/>
                  <br/>
                  <strong>Premium Users:</strong> 10% discount<br/>
                  <strong>Today's Deals:</strong> 5% extra discount
                </div>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '10px', border: '2px solid #ff9800' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#f57c00' }}>⚡ Flash Sale System</h4>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                  <strong>Auto Flash Sale:</strong> Random 2-4 products<br/>
                  <strong>Discount Range:</strong> 15-25%<br/>
                  <strong>Manual Flash Sale:</strong> Admin selects products<br/>
                  <strong>Custom Discount:</strong> 1-50%<br/>
                  <br/>
                  <strong>Priority:</strong> Flash Sale &gt; Festival &gt; Premium
                </div>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '10px', border: '2px solid #9c27b0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#7b1fa2' }}>🎉 Festival System</h4>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
                  <strong>Date-based:</strong> Auto-activates during festival periods<br/>
                  <strong>Manual Control:</strong> Admin can toggle anytime<br/>
                  <strong>Discount Range:</strong> 5-30%<br/>
                  <strong>Apply to:</strong> All products<br/>
                  <br/>
                  <strong>Examples:</strong> Diwali, Pongal, Onam
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>📦 Order Details</h2>
              <button
                onClick={closeOrderModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>ORDER ID</div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>#{selectedOrder._id?.slice(-8).toUpperCase()}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>STATUS</div>
                  <div style={{
                    fontWeight: 'bold',
                    color: selectedOrder.status === 'Delivered' ? '#2e7d32' : 
                           selectedOrder.status === 'Cancelled' ? '#c62828' : '#f57c00'
                  }}>
                    {selectedOrder.status}
                  </div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>TOTAL AMOUNT</div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>₹{selectedOrder.totalAmount}</div>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>ORDER DATE</div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>👤 Customer Information</h4>
              <div style={{ fontSize: '14px', color: '#333' }}>
                <div><strong>Name:</strong> {selectedOrder.userId?.name || 'N/A'}</div>
                <div><strong>Email:</strong> {selectedOrder.userId?.email || 'N/A'}</div>
                <div><strong>Phone:</strong> {selectedOrder.deliveryAddress?.phone || 'N/A'}</div>
              </div>
            </div>

            {/* Delivery Address */}
            {selectedOrder.deliveryAddress && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>🏠 Delivery Address</h4>
                <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.8' }}>
                  <div>{selectedOrder.deliveryAddress.street}</div>
                  <div>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}</div>
                  <div>Pincode: {selectedOrder.deliveryAddress.pincode}</div>
                  {selectedOrder.deliveryAddress.phone && <div>Phone: {selectedOrder.deliveryAddress.phone}</div>}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🛒 Order Items</h4>
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#666' }}>PRODUCT</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>QTY</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>PRICE</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#666' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#333' }}>{item.name || item.productId?.name || 'Product'}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Age: {item.age || item.ageCategory} • Weight: {item.weight}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>₹{item.price}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{item.subtotal || (item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Information */}
            <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>💳 Payment Information</h4>
              <div style={{ fontSize: '14px', color: '#333' }}>
                <div><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'Cash on Delivery'}</div>
                <div><strong>Payment Status:</strong> {selectedOrder.paymentStatus || 'Pending'}</div>
              </div>
            </div>

            {/* Update Status */}
            <div style={{ padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>📦 Update Order Status</h4>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  defaultValue={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', flex: 1 }}
                >
                  <option value="Placed">Placed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && stats && (
        <div>
          {/* Revenue Analytics */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: '0', color: '#333' }}>📈 Revenue Analytics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '10px', border: '2px solid #4caf50' }}>
                <div style={{ fontSize: '14px', color: '#2e7d32', marginBottom: '5px' }}>TOTAL REVENUE</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32' }}>₹{stats.stats?.totalRevenue || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>All time earnings</div>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '10px', border: '2px solid #2196f3' }}>
                <div style={{ fontSize: '14px', color: '#1976d2', marginBottom: '5px' }}>AVG ORDER VALUE</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>
                  ₹{stats.stats?.totalOrders > 0 ? Math.round(stats.stats.totalRevenue / stats.stats.totalOrders) : 0}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Per order average</div>
              </div>
              
              <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '10px', border: '2px solid #ff9800' }}>
                <div style={{ fontSize: '14px', color: '#f57c00', marginBottom: '5px' }}>CONVERSION RATE</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f57c00' }}>
                  {stats.stats?.totalUsers > 0 ? Math.round((stats.stats.totalOrders / stats.stats.totalUsers) * 100) : 0}%
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Users to orders</div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginTop: '0', color: '#333' }}>⚙️ System Health</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>📊</span>
                  <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>Market Price System</div>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Status: Active</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Last Update: {stats.marketPrice ? new Date(stats.marketPrice.lastUpdated).toLocaleString('en-IN') : 'N/A'}</div>
              </div>
              
              <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '1px solid #ff9800' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <div style={{ fontWeight: 'bold', color: '#f57c00' }}>Flash Sales</div>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Active Sales: {stats.activeFlashSales || 0}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Products on Sale: {stats.flashSaleProducts || 0}</div>
              </div>
              
              <div style={{ padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '8px', border: '1px solid #9c27b0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🎉</span>
                  <div style={{ fontWeight: 'bold', color: '#7b1fa2' }}>Festivals</div>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Active Festival: {stats.activeFestival ? stats.activeFestival.name : 'None'}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Discount: {stats.activeFestival ? `${stats.activeFestival.discount}%` : '0%'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Management Tab */}
      {tab === 'reviews' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>⭐ Reviews Management ({reviews.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Rating</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Comment</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review._id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div>{review.userId?.name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{review.userId?.email}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{review.productId?.name || 'N/A'}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} style={{ color: star <= review.rating ? '#ffc107' : '#ddd', fontSize: '16px' }}>★</span>
                        ))}
                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>({review.rating})</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {review.comment || 'No comment'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: review.isVisible ? '#e8f5e9' : '#ffebee',
                        color: review.isVisible ? '#2e7d32' : '#c62828'
                      }}>
                        {review.isVisible ? '👁️ Visible' : '🚫 Hidden'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {new Date(review.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={async () => {
                            try {
                              await adminAPI(`/reviews/${review._id}/visibility`, { method: 'PUT' });
                              showMessage(`Review ${review.isVisible ? 'hidden' : 'shown'}!`);
                              // Reload reviews
                              const reviewsData = await adminAPI('/reviews/all');
                              setReviews(Array.isArray(reviewsData) ? reviewsData : []);
                            } catch (err) {
                              showMessage('Failed to update review visibility', true);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            backgroundColor: review.isVisible ? '#f44336' : '#4caf50',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {review.isVisible ? '🚫 Hide' : '👁️ Show'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
                            try {
                              await adminAPI(`/reviews/${review._id}`, { method: 'DELETE' });
                              showMessage('Review deleted successfully!');
                              // Reload reviews
                              const reviewsData = await adminAPI('/reviews/all');
                              setReviews(Array.isArray(reviewsData) ? reviewsData : []);
                            } catch (err) {
                              showMessage('Failed to delete review', true);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No reviews yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Returns Management Tab */}
      {tab === 'returns' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: '0', color: '#333' }}>🔄 Returns Management ({returns.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Return ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(ret => (
                  <tr key={ret._id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedReturn(ret); setShowReturnModal(true); }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 'bold' }}>#{ret._id?.slice(-8).toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>#{String(ret.orderId?._id || ret.orderId).slice(-8).toUpperCase()}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <div>{ret.userId?.name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{ret.userId?.email}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{ret.productName}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontSize: '13px' }}>{ret.reason}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: ret.status === 'Approved' || ret.status === 'Refund Processed' || ret.status === 'Replacement Shipped' ? '#e8f5e9' :
                                         ret.status === 'Rejected' ? '#ffebee' : '#fff3e0',
                        color: ret.status === 'Approved' || ret.status === 'Refund Processed' || ret.status === 'Replacement Shipped' ? '#2e7d32' :
                               ret.status === 'Rejected' ? '#c62828' : '#f57c00'
                      }}>{ret.status}</span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{new Date(ret.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No return requests yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {showReturnModal && selectedReturn && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '30px', maxWidth: '600px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>🔄 Return Details</h2>
              <button onClick={() => setShowReturnModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Product & User Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>RETURN ID</div>
                <div style={{ fontWeight: 'bold' }}>#{selectedReturn._id?.slice(-8).toUpperCase()}</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>ORDER ID</div>
                <div style={{ fontWeight: 'bold' }}>#{String(selectedReturn.orderId?._id || selectedReturn.orderId).slice(-8).toUpperCase()}</div>
              </div>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>👤 Customer</h4>
              <div><strong>Name:</strong> {selectedReturn.userId?.name || 'N/A'}</div>
              <div><strong>Email:</strong> {selectedReturn.userId?.email || 'N/A'}</div>
            </div>

            <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>📦 Product Info</h4>
              <div><strong>Product:</strong> {selectedReturn.productName}</div>
              <div><strong>Reason:</strong> {selectedReturn.reason}</div>
              {selectedReturn.description && <div><strong>Details:</strong> {selectedReturn.description}</div>}
            </div>

            {selectedReturn.orderId?.totalAmount && (
              <div style={{ padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '8px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>💳 Order Info</h4>
                <div><strong>Amount:</strong> ₹{selectedReturn.orderId.totalAmount}</div>
                <div><strong>Payment:</strong> {selectedReturn.orderId.paymentMethod}</div>
                <div><strong>Order Date:</strong> {new Date(selectedReturn.orderId.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
            )}

            {/* Admin Actions */}
            <div style={{ padding: '15px', backgroundColor: '#fce4ec', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#c62828' }}>⚙️ Admin Actions</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                {[['Approved', '✅ Approve', '#4caf50'], ['Rejected', '❌ Reject', '#f44336'], ['Pickup Scheduled', '📦 Schedule Pickup', '#2196f3'], ['Picked Up', '🚚 Mark Picked Up', '#9c27b0'], ['Refund Processed', '💸 Process Refund', '#ff9800'], ['Replacement Shipped', '🔁 Ship Replacement', '#00bcd4']].map(([status, label, color]) => (
                  <button key={status} onClick={async () => {
                    try {
                      await adminAPI(`/returns/${selectedReturn._id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
                      showMessage(`Return ${status}!`);
                      const returnsData = await adminAPI('/returns');
                      setReturns(Array.isArray(returnsData) ? returnsData : []);
                      setSelectedReturn(prev => ({ ...prev, status }));
                    } catch (err) { showMessage(`Failed: ${err.message}`, true); }
                  }} style={{ padding: '8px 14px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}><strong>Current Status:</strong> {selectedReturn.status}</div>
            </div>

            <button onClick={() => setShowReturnModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
          </div>
        </div>
      )}

      {/* Stock Management Tab */}
      {tab === 'stocks' && (
        <div className="stock-management">
          <div className="stock-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(255, 107, 53, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              margin: '0',
              background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>📦 Stock Management</h2>
            <div className="stock-filters">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={stockFilter} 
                  onChange={(e) => setStockFilter(e.target.value)}
                  style={{
                    padding: '10px 15px',
                    border: '2px solid rgba(255, 107, 53, 0.3)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <option value="All">All Products</option>
                  <option value="low">Low Stock (≤8)</option>
                  <option value="out">Out of Stock</option>
                </select>
                <button
                  onClick={recoverStocks}
                  style={{
                    padding: '10px 15px',
                    background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
                  }}
                >
                  🔄 Recover Stocks
                </button>
                <button
                  onClick={initializeAllStocks}
                  style={{
                    padding: '10px 15px',
                    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                  }}
                >
                  🔄 Initialize All Stocks
                </button>
                <button
                  onClick={async () => {
                    try {
                      const debug = await adminAPI('/stocks/debug');
                      console.log('Stock debug info:', debug);
                      showMessage(`Debug: ${debug.totalProducts} products, ${debug.totalStocks} stocks. Check console for details.`);
                    } catch (err) {
                      showMessage(`Debug failed: ${err.message}`, true);
                    }
                  }}
                  style={{
                    padding: '10px 15px',
                    background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)'
                  }}
                >
                  🔍 Debug Stocks
                </button>
              </div>
            </div>
          </div>
          
          <div className="stock-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {products.filter(product => {
              if (stockFilter === 'All') return true;
              const productStocks = stocks.filter(s => s.productId === product._id || s.productId?._id === product._id);
              if (stockFilter === 'low') {
                return productStocks.some(s => s.quantity > 0 && s.quantity <= 8);
              }
              if (stockFilter === 'out') {
                return productStocks.some(s => s.quantity === 0);
              }
              return true;
            }).map(product => {
              const productStocks = stocks.filter(s => s.productId === product._id || s.productId?._id === product._id);
              const lowStockCount = productStocks.filter(s => s.quantity > 0 && s.quantity <= 8).length;
              const outOfStockCount = productStocks.filter(s => s.quantity === 0).length;
              
              return (
                <div key={product._id} className="stock-card hover-lift" style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '25px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(15px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div className="stock-card-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    {(() => {
                      const staticMatch = staticProducts.find(s => s.name === product.name);
                      const imgSrc = staticMatch?.images?.[0] || product.images?.packed || null;
                      return imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={product.name} 
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            border: '3px solid rgba(255, 107, 53, 0.2)'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '24px', border: '3px solid rgba(255, 107, 53, 0.2)'
                        }}>🌾</div>
                      );
                    })()}
                    <div>
                      <h3 style={{
                        margin: '0 0 5px 0',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>{product.name}</h3>
                      <p style={{
                        margin: '0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>₹{product.basePremium}</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    {productStocks.length === 0 ? (
                      <div style={{
                        padding: '10px 15px',
                        background: 'linear-gradient(135deg, #9e9e9e, #bdbdbd)',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '8px'
                      }}>
                        ⚙️ Not initialized — click Initialize All Stocks
                      </div>
                    ) : (
                      <>
                        {lowStockCount > 0 && (
                          <div style={{
                            padding: '10px 15px',
                            background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)'
                          }}>
                            ⚠️ {lowStockCount} variants low stock
                          </div>
                        )}
                        {outOfStockCount > 0 && (
                          <div style={{
                            padding: '10px 15px',
                            background: 'linear-gradient(135deg, #f44336, #e57373)',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)',
                            animation: 'pulse 2s infinite'
                          }}>
                            🚫 {outOfStockCount} variants out of stock
                          </div>
                        )}
                        {lowStockCount === 0 && outOfStockCount === 0 && (
                          <div style={{
                            padding: '10px 15px',
                            background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                            color: 'white',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                          }}>
                            ✅ All variants in stock
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowStockModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)'
                    }}
                  >
                    📊 Manage Stock
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {showStockModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }} onClick={() => setShowStockModal(false)}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '25px',
            padding: '0',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(20px)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
              color: 'white',
              padding: '25px 30px',
              borderRadius: '25px 25px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>📦 Stock Management - {selectedProduct.name}</h2>
              <button 
                onClick={() => setShowStockModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
              >×</button>
            </div>
            
            <div style={{ padding: '30px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'white',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #673ab7, #9c27b0)',
                      color: 'white'
                    }}>
                      <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Age Category</th>
                      <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 'bold' }}>Weight</th>
                      <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: 'bold' }}>Stock</th>
                      <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                      <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['6 months', '1 year', '2 years'].map(age => 
                      ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'].map(weight => {
                        const stockItem = stocks.find(s => 
                          (s.productId === selectedProduct._id || s.productId?._id === selectedProduct._id) && 
                          s.ageCategory === age && 
                          s.weight === weight
                        );
                        const quantity = stockItem?.quantity || 0;
                        
                        return (
                          <tr key={`${age}-${weight}`} style={{
                            background: quantity <= 8 && quantity > 0 ? 'rgba(255, 152, 0, 0.1)' : 
                                       quantity === 0 ? 'rgba(244, 67, 54, 0.1)' : 'white',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                          }}>
                            <td style={{ padding: '15px', fontWeight: '500' }}>{age}</td>
                            <td style={{ padding: '15px', fontWeight: '500' }}>{weight}</td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                              <input 
                                type="number" 
                                value={quantity}
                                min="0"
                                style={{
                                  width: '80px',
                                  padding: '8px 12px',
                                  border: '2px solid ' + (quantity === 0 ? '#f44336' : quantity <= 8 ? '#ff9800' : '#4caf50'),
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  fontSize: '14px',
                                  fontWeight: 'bold'
                                }}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 0;
                                  setStocks(prev => {
                                    const existing = prev.find(s => 
                                      (s.productId === selectedProduct._id || s.productId?._id === selectedProduct._id) && 
                                      s.ageCategory === age && 
                                      s.weight === weight
                                    );
                                    if (existing) {
                                      return prev.map(s => 
                                        s === existing ? {...s, quantity: newQuantity} : s
                                      );
                                    } else {
                                      return [...prev, {
                                        productId: selectedProduct._id,
                                        ageCategory: age,
                                        weight: weight,
                                        quantity: newQuantity
                                      }];
                                    }
                                  });
                                }}
                              />
                            </td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                background: quantity === 0 ? 'linear-gradient(135deg, #f44336, #e57373)' : 
                                           quantity <= 8 ? 'linear-gradient(135deg, #ff9800, #ffb74d)' : 'linear-gradient(135deg, #4caf50, #66bb6a)',
                                color: 'white'
                              }}>
                                {quantity === 0 ? '🚫 Out of Stock' : 
                                 quantity <= 8 ? '⚠️ Low Stock' : '✅ In Stock'}
                              </span>
                            </td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => {
                                    setStocks(prev => {
                                      const existing = prev.find(s => 
                                        (s.productId === selectedProduct._id || s.productId?._id === selectedProduct._id) && 
                                        s.ageCategory === age && 
                                        s.weight === weight
                                      );
                                      if (existing) {
                                        return prev.map(s => 
                                          s === existing ? {...s, quantity: s.quantity + 10} : s
                                        );
                                      } else {
                                        return [...prev, {
                                          productId: selectedProduct._id,
                                          ageCategory: age,
                                          weight: weight,
                                          quantity: 10
                                        }];
                                      }
                                    });
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  +10
                                </button>
                                <button 
                                  onClick={() => {
                                    setStocks(prev => {
                                      const existing = prev.find(s => 
                                        (s.productId === selectedProduct._id || s.productId?._id === selectedProduct._id) && 
                                        s.ageCategory === age && 
                                        s.weight === weight
                                      );
                                      if (existing && existing.quantity > 0) {
                                        return prev.map(s => 
                                          s === existing ? {...s, quantity: Math.max(0, s.quantity - 1)} : s
                                        );
                                      }
                                      return prev;
                                    });
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #f44336, #e57373)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  -1
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={{
              padding: '25px 30px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '0 0 25px 25px',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button 
                onClick={async () => {
                  try {
                    const stocksToSave = stocks.filter(s => s.productId === selectedProduct._id || s.productId?._id === selectedProduct._id);
                    
                    // Backup before saving
                    backupStocks(stocks);
                    
                    await adminAPI('/stocks/bulk', {
                      method: 'PUT',
                      body: JSON.stringify({ stocks: stocksToSave })
                    });
                    showMessage('Stock data saved successfully!');
                    setShowStockModal(false);
                    
                    // Reload stocks data and backup again
                    const updatedStocks = await adminAPI('/stocks');
                    if (Array.isArray(updatedStocks) && updatedStocks.length > 0) {
                      setStocks(updatedStocks);
                      backupStocks(updatedStocks);
                    }
                  } catch (err) {
                    showMessage(`Failed to save stock data: ${err.message}`, true);
                  }
                }}
                style={{
                  padding: '15px 30px',
                  background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default AdminPanel;