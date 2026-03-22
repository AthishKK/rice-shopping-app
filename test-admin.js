// Test admin endpoints
const API_URL = 'http://localhost:5001/api';

async function testAdminEndpoints() {
  console.log('🔧 Testing Admin Endpoints...\n');
  
  try {
    // First, let's try to get a token by logging in as admin
    console.log('1. Attempting admin login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@vetri-rice.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Admin login successful');
    
    // Test debug stocks endpoint
    console.log('\n2. Testing debug stocks endpoint...');
    const debugResponse = await fetch(`${API_URL}/admin/stocks/debug`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug stocks response:');
      console.log(`   Total products: ${debugData.totalProducts}`);
      console.log(`   Total stocks: ${debugData.totalStocks}`);
      console.log(`   Products without stock: ${debugData.productsWithoutStock.length}`);
      if (debugData.productsWithoutStock.length > 0) {
        console.log(`   Missing stock for: ${debugData.productsWithoutStock.join(', ')}`);
      }
      console.log(`   Products with stock: ${Object.keys(debugData.stocksByProduct).length}`);
    } else {
      console.log(`❌ Debug stocks failed: ${debugResponse.status}`);
    }
    
    // Test initialize stocks
    console.log('\n3. Testing initialize stocks endpoint...');
    const initResponse = await fetch(`${API_URL}/admin/stocks/initialize-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('✅ Initialize stocks response:');
      console.log(`   Message: ${initData.message}`);
      console.log(`   Initialized: ${initData.initialized || 0}`);
      console.log(`   Products: ${initData.products || 0}`);
    } else {
      console.log(`❌ Initialize stocks failed: ${initResponse.status}`);
    }
    
    // Test get all stocks
    console.log('\n4. Testing get all stocks endpoint...');
    const stocksResponse = await fetch(`${API_URL}/admin/stocks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (stocksResponse.ok) {
      const stocksData = await stocksResponse.json();
      console.log(`✅ Found ${stocksData.length} stock entries`);
      if (stocksData.length > 0) {
        const sample = stocksData[0];
        console.log(`   Sample: ${sample.productId?.name || 'Unknown'} - ${sample.ageCategory} - ${sample.weight} - ${sample.quantity} units`);
      }
    } else {
      console.log(`❌ Get stocks failed: ${stocksResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminEndpoints();