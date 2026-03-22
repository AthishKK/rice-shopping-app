import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signup = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.fullName,
          email: userData.email,
          password: userData.password
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const upgradeToPremium = async () => {
    try {
      console.log('Starting premium upgrade...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        console.log('No token found');
        return { success: false, message: 'Please login first' };
      }

      console.log('Making API call to upgrade premium...');
      const response = await fetch(`${API_BASE_URL}/auth/upgrade-premium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, message: 'Congratulations! You are now a premium member!' };
      } else {
        return { success: false, message: data.message || 'Upgrade failed' };
      }
    } catch (error) {
      console.error('Premium upgrade error:', error);
      return { success: false, message: `Network error: ${error.message}. Please make sure the backend server is running.` };
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    upgradeToPremium,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};