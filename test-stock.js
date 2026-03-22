// Simple test script to check stock system
const API_URL = 'http://localhost:5001/api';

async function testStockSystem() {
  console.log('🧪 Testing Stock System...\n');
  
  try {
    // Test 1: Get all products
    console.log('1. Testing products endpoint...');
    const productsResponse = await fetch(`${API_URL}/products`);
    if (!productsResponse.ok) {
      throw new Error(`Products API failed: ${productsResponse.status}`);
    }
    const products = await productsResponse.json();
    console.log(`✅ Found ${products.length} products`);
    
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`   First product: ${firstProduct.name} (ID: ${firstProduct._id})`);
      console.log(`   Stock status: ${firstProduct.stock?.status || 'unknown'}`);
      console.log(`   Stock quantity: ${firstProduct.stock?.quantity || 'unknown'}`);
      
      // Test 2: Get stock summary for first product
      console.log('\n2. Testing stock summary endpoint...');
      const stockResponse = await fetch(`${API_URL}/products/${firstProduct._id}/stock-summary`);
      if (stockResponse.ok) {
        const stockSummary = await stockResponse.json();
        console.log(`✅ Stock summary loaded:`);
        console.log(`   Total variants: ${stockSummary.totalVariants}`);
        console.log(`   In stock: ${stockSummary.inStock}`);
        console.log(`   Low stock: ${stockSummary.lowStock}`);
        console.log(`   Out of stock: ${stockSummary.outOfStock}`);
      } else {
        console.log(`❌ Stock summary failed: ${stockResponse.status}`);
      }
      
      // Test 3: Check specific stock
      console.log('\n3. Testing specific stock check...');
      const specificStockResponse = await fetch(`${API_URL}/products/${firstProduct._id}/stock/6 months/1kg?quantity=1`);
      if (specificStockResponse.ok) {
        const specificStock = await specificStockResponse.json();
        console.log(`✅ Specific stock check:`);
        console.log(`   Available: ${specificStock.available}`);
        console.log(`   Current stock: ${specificStock.currentStock}`);
        console.log(`   Message: ${specificStock.message}`);
      } else {
        console.log(`❌ Specific stock check failed: ${specificStockResponse.status}`);
      }
    }
    
    console.log('\n🎉 Stock system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStockSystem();