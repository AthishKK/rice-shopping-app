import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "./CartContext";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import "../styles/Navbar.css";

function Navbar({ onToggleFilters }) {
  const { cart } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showCategoriesInMenu, setShowCategoriesInMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);

  const categories = [
    "Nei Kichadi Rice",
    "Seeraga Samba Rice",
    "Karuppu Kavuni Rice",
    "Mappillai Samba Rice",
    "Karunguruvai Rice",
    "Basmati Rice",
    "Kattuyanam Rice",
    "Poongar Rice",
    "Thooyamalli Rice",
    "Red Rice"
  ];

  // Scroll hide/show logic
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 80) {
        setNavVisible(true);
      } else if (currentY < lastScrollY) {
        // Scrolling UP — show navbar
        setNavVisible(true);
      } else if (currentY > lastScrollY + 5) {
        // Scrolling DOWN — hide navbar
        setNavVisible(false);
        setShowProfileMenu(false);
      }
      setLastScrollY(currentY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/all-products?search=${searchTerm}`);
  };

  const handleMenuItemClick = (action) => {
    setShowMenu(false);
    if (action === "filters") {
      // Navigate to all-products with filter panel open
      if (location.pathname !== "/all-products") {
        navigate("/all-products", { state: { openFilters: true } });
      } else {
        onToggleFilters();
      }
    }
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/cart", message: "Please login to continue" } });
      return;
    }
    navigate("/cart");
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    setShowMenu(false);
    navigate("/");
  };

  return (
    <nav className={`navbar ${navVisible ? "navbar-visible" : "navbar-hidden"}`}>
      <div className="navbar-top">
        <div className="navbar-left">
          <button className="hamburger-menu" onClick={() => setShowMenu(!showMenu)}>
            ☰
          </button>

          <Link to="/" className="logo">
            🌾 {t('vetriVinayagarRiceMart')}
          </Link>
        </div>

        <div className="navbar-center">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={t('searchRiceProducts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">🔍</button>
          </form>
        </div>

        <div className="navbar-right">
          <div className="nav-links">
            <Link to="/" className="home-link">{t('home')}</Link>
            <Link to="/my-orders">{t('myOrders')}</Link>
            <Link to="/limited-offers" className="offers-nav-link">🎁 {t('offers')}</Link>
            <Link to="/support">{t('support')}</Link>

            {user ? (
              <div className="profile-wrapper" ref={profileRef}>
                <button className={`profile-btn ${user?.isPremium ? 'premium-user' : ''}`} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <div className="profile-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                  <span className="profile-name">{user.name?.split(' ')[0] || 'User'}</span>
                  <span className="profile-arrow">▾</span>
                </button>
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-header">
                      <div className="profile-avatar-large">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                      <div>
                        <p className="dropdown-name">
                          {user.name || 'User'}
                          {user.isPremium && <span className="premium-badge-nav"> ★ {t('premium')}</span>}
                        </p>
                        <p className="dropdown-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="profile-dropdown-divider" />
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                      👤 {t('profile')}
                    </Link>
                    <Link to="/my-orders" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                      📦 {t('myOrders')}
                    </Link>
                    <button className="dropdown-item" onClick={() => { setShowProfileMenu(false); handleCartClick(); }}>
                      🛒 {t('cart')}
                    </button>
                    {user?.isAdmin && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                        🔑 {t('adminPanel')}
                      </Link>
                    )}
                    <div className="profile-dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      🚪 {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">{t('login')}</Link>
            )}

            <button className="cart-link" onClick={handleCartClick}>
              🛒 {t('cart')} ({cart.length})
            </button>
          </div>
        </div>
      </div>

      <div className="categories-bar">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            to={`/product/${idx + 1}`}
            className="category-item"
            onClick={() => setShowMenu(false)}
          >
            {t(cat)}
          </Link>
        ))}
      </div>

      {showMenu && (
        <>
          <div className="menu-overlay" onClick={() => setShowMenu(false)}></div>
          <div className={`hamburger-menu-panel ${showMenu ? "show" : ""}`}>
            <div className="menu-header">
              {user ? (
                <div className="menu-user-info">
                  <div className="profile-avatar-large">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                  <div>
                    <p className="menu-user-name">
                      Hello, {user.name?.split(' ')[0] || 'User'}
                      {user.isPremium && <span className="premium-badge-nav"> ⭐ {t('premium')}</span>}
                    </p>
                    <p className="menu-user-email">{user.email}</p>
                  </div>
                </div>
              ) : (
                <h3>Menu</h3>
              )}
              <button className="close-menu" onClick={() => setShowMenu(false)}>×</button>
            </div>

            <div className="menu-items">
              <Link to="/" onClick={() => handleMenuItemClick("home")}>
                <span className="menu-icon">🏠</span> {t('home')}
              </Link>

              <Link to="/all-products" onClick={() => handleMenuItemClick("all-products")}>
                <span className="menu-icon">🌾</span> {t('allProducts')}
              </Link>

              <Link to="/flash-sale" onClick={() => handleMenuItemClick("flash-sale")}>
                <span className="menu-icon">🔥</span> {t('flashSale')}
              </Link>

              <Link to="/todays-deals" onClick={() => handleMenuItemClick("todays-deals")}>
                <span className="menu-icon">🛍️</span> {t('todaysDeals')}
              </Link>

              <Link to="/trending-products" onClick={() => handleMenuItemClick("trending")}>
                <span className="menu-icon">📈</span> {t('trendingProducts')}
              </Link>

              <div className="menu-item-with-submenu">
                <button className="submenu-toggle" onClick={() => setShowCategoriesInMenu(!showCategoriesInMenu)}>
                  <span className="menu-icon">📦</span> {t('categories')}
                </button>
                {showCategoriesInMenu && (
                  <div className="submenu">
                    {categories.map((cat, idx) => (
                      <div key={idx} className="submenu-item" onClick={() => { navigate(`/product/${idx + 1}`); setShowMenu(false); }}>
                        {t(cat)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="menu-button" onClick={() => handleMenuItemClick("filters")}>
                <span className="menu-icon">🔍</span> {t('filters')}
              </button>

              <button className="menu-button" onClick={() => { handleMenuItemClick("cart"); handleCartClick(); }}>
                <span className="menu-icon">🛒</span> {t('cart')} ({cart.length})
              </button>

              <Link to="/my-orders" onClick={() => handleMenuItemClick("orders")}>
                <span className="menu-icon">📦</span> {t('myOrders')}
              </Link>

              <Link to="/limited-offers" onClick={() => handleMenuItemClick("offers")} className="menu-offers-link">
                <span className="menu-icon">🎁</span> {t('offers')}
              </Link>

              <Link to="/support" onClick={() => handleMenuItemClick("support")}>
                <span className="menu-icon">❓</span> {t('support')}
              </Link>

              {user ? (
                <button className="menu-button" onClick={handleLogout}>
                  <span className="menu-icon">🚪</span> {t('logout')}
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => handleMenuItemClick("login")}>
                    <span className="menu-icon">👤</span> {t('login')}
                  </Link>
                  <Link to="/signup" onClick={() => handleMenuItemClick("signup")}>
                    <span className="menu-icon">📝</span> {t('signup')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

export default Navbar;
