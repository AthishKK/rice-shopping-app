import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./components/CartContext";
import { AuthProvider } from "./components/AuthContext";
import { LanguageProvider } from "./components/LanguageContext";
import { ThemeProvider } from "./components/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LanguageToggle from "./components/LanguageToggle";
import ErrorBoundary from "./components/ErrorBoundary";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import MyOrders from "./pages/MyOrders";
import Support from "./pages/Support";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import LimitedOffers from "./pages/LimitedOffers";
import Signup from "./pages/Signup";
import FlashSale from "./pages/FlashSale";
import TodaysDeals from "./pages/TodaysDeals";
import TrendingProducts from "./pages/TrendingProducts";
import AllProducts from "./pages/AllProducts";
import UserProfile from "./pages/UserProfile";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <Router>
                <LanguageToggle />
                <Navbar onToggleFilters={() => {}} />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/flash-sale" element={<FlashSale />} />
                  <Route path="/todays-deals" element={<TodaysDeals />} />
                  <Route path="/trending-products" element={<TrendingProducts />} />
                  <Route path="/all-products" element={<AllProducts />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                  <Route path="/track-order" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                  <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/limited-offers" element={<LimitedOffers />} />
                  <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                </Routes>
              </Router>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;