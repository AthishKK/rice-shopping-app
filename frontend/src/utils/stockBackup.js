// Stock backup and recovery utilities for frontend
export const STOCK_BACKUP_KEY = 'rice-app-stock-backup';

// Save stocks to localStorage as backup
export const backupStocks = (stocks) => {
  try {
    const backup = {
      stocks,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(STOCK_BACKUP_KEY, JSON.stringify(backup));
    console.log('📦 Stocks backed up to localStorage');
  } catch (error) {
    console.error('Failed to backup stocks:', error);
  }
};

// Restore stocks from localStorage backup
export const restoreStocks = () => {
  try {
    const backupData = localStorage.getItem(STOCK_BACKUP_KEY);
    if (backupData) {
      const backup = JSON.parse(backupData);
      console.log(`📦 Restored ${backup.stocks?.length || 0} stocks from backup (${backup.timestamp})`);
      return backup.stocks || [];
    }
  } catch (error) {
    console.error('Failed to restore stocks:', error);
  }
  return [];
};

// Check if backup exists
export const hasStockBackup = () => {
  return localStorage.getItem(STOCK_BACKUP_KEY) !== null;
};

// Clear backup
export const clearStockBackup = () => {
  localStorage.removeItem(STOCK_BACKUP_KEY);
  console.log('🗑️ Stock backup cleared');
};

// Generate default stocks for products
export const generateDefaultStocks = (products) => {
  const ageCategories = ['6 months', '1 year', '2 years'];
  const weights = ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'];
  const defaultStocks = [];
  
  products.forEach(product => {
    ageCategories.forEach(age => {
      weights.forEach(weight => {
        defaultStocks.push({
          _id: `${product._id}-${age}-${weight}`,
          productId: product._id,
          ageCategory: age,
          weight: weight,
          quantity: 50,
          lastUpdated: new Date().toISOString()
        });
      });
    });
  });
  
  console.log(`🏭 Generated ${defaultStocks.length} default stock entries`);
  return defaultStocks;
};