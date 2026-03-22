const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const testStockAPI = async () => {
  try {
    console.log('🧪 Testing Stock API...');
    
    // Test getting all stocks
    console.log('\n📊 Getting all stocks...');
    const stocksResponse = await axios.get(`${API_URL}/admin/stocks`, {
      headers: {
        'Authorization': 'Bearer your-admin-token-here' // You'll need to replace this with a real token
      }
    });
    
    console.log(`Found ${stocksResponse.data.length} stock entries`);
    
    // Group by product
    const stocksByProduct = {};
    stocksResponse.data.forEach(stock => {
      const productName = stock.productId?.name || 'Unknown';
      if (!stocksByProduct[productName]) {
        stocksByProduct[productName] = [];
      }
      stocksByProduct[productName].push(stock);
    });
    
    // Display summary
    Object.keys(stocksByProduct).forEach(productName => {
      const stocks = stocksByProduct[productName];
      const inStock = stocks.filter(s => s.quantity > 8).length;
      const lowStock = stocks.filter(s => s.quantity > 0 && s.quantity <= 8).length;
      const outOfStock = stocks.filter(s => s.quantity === 0).length;
      
      console.log(`\n📦 ${productName}:`);
      console.log(`   Total variants: ${stocks.length}`);
      console.log(`   In stock: ${inStock}, Low stock: ${lowStock}, Out of stock: ${outOfStock}`);
    });
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Authentication required. Please provide a valid admin token.');
    } else {
      console.error('❌ Error testing stock API:', error.message);
    }
  }
};

// Test without authentication first - just check if server is running
const testServerHealth = async () => {
  try {
    console.log('🏥 Testing server health...');
    const response = await axios.get(`${API_URL.replace('/api', '')}/`);
    console.log('✅ Server is running:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Server is not responding:', error.message);
    return false;
  }
};

const runTests = async () => {
  const serverRunning = await testServerHealth();
  if (serverRunning) {
    await testStockAPI();
  }
};

runTests();