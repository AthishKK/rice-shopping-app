import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const useStockCheck = (productId, ageCategory, weight, quantity = 1) => {
  const [stockStatus, setStockStatus] = useState({
    available: true,
    currentStock: 50,
    message: 'In Stock',
    loading: false
  });

  useEffect(() => {
    // If no productId yet (mapping still loading), stay available
    if (!productId) {
      setStockStatus({ available: true, currentStock: 50, message: 'In Stock', loading: false });
      return;
    }
    if (!ageCategory || !weight) return;

    const checkStock = async () => {
      try {
        setStockStatus(prev => ({ ...prev, loading: true }));
        
        const response = await fetch(
          `${API_URL}/products/${productId}/stock/${encodeURIComponent(ageCategory)}/${encodeURIComponent(weight)}?quantity=${quantity}`
        );
        
        if (!response.ok) {
          // On error, default to available so users aren't blocked
          setStockStatus({ available: true, currentStock: 50, message: 'In Stock', loading: false });
          return;
        }
        
        const data = await response.json();
        setStockStatus({ ...data, loading: false });
      } catch (error) {
        console.error('Stock check error:', error);
        // On network error, default to available
        setStockStatus({ available: true, currentStock: 50, message: 'In Stock', loading: false });
      }
    };

    checkStock();
  }, [productId, ageCategory, weight, quantity]);

  return stockStatus;
};

export const useProductStockSummary = (productId) => {
  const [stockSummary, setStockSummary] = useState({
    totalVariants: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    variants: [],
    loading: true
  });

  useEffect(() => {
    if (!productId) {
      setStockSummary(prev => ({ ...prev, loading: false }));
      return;
    }

    const getStockSummary = async () => {
      try {
        setStockSummary(prev => ({ ...prev, loading: true }));
        
        const response = await fetch(`${API_URL}/products/${productId}/stock-summary`);
        
        if (!response.ok) {
          throw new Error('Failed to get stock summary');
        }
        
        const data = await response.json();
        setStockSummary({
          ...data,
          loading: false
        });
      } catch (error) {
        console.error('Stock summary error:', error);
        setStockSummary({
          totalVariants: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
          variants: [],
          loading: false,
          error: 'Unable to load stock information'
        });
      }
    };

    getStockSummary();
  }, [productId]);

  return stockSummary;
};

// Helper function to get stock status display
export const getStockStatusDisplay = (status, quantity) => {
  switch (status) {
    case 'out-of-stock':
      return {
        text: 'Out of Stock',
        color: '#f44336',
        icon: '🚫',
        available: false
      };
    case 'low-stock':
      return {
        text: `Only ${quantity} left`,
        color: '#ff9800',
        icon: '⚠️',
        available: true
      };
    case 'in-stock':
      return {
        text: 'In Stock',
        color: '#4caf50',
        icon: '✅',
        available: true
      };
    default:
      return {
        text: 'In Stock',
        color: '#4caf50',
        icon: '✅',
        available: true
      };
  }
};