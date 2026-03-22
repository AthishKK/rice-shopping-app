// Direct database test for stocks
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rice-shopping-app');

// Define schemas (simplified)
const stockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  ageCategory: { type: String, required: true },
  weight: { type: String, required: true },
  quantity: { type: Number, default: 0 }
});

const productSchema = new mongoose.Schema({
  name: String,
  basePremium: Number
});

const Stock = mongoose.model('Stock', stockSchema);
const Product = mongoose.model('Product', productSchema);

async function testDatabase() {
  try {
    console.log('🔍 Testing database directly...\n');
    
    // Check products
    const products = await Product.find({}).limit(3);
    console.log(`📦 Found ${products.length} products in database:`);
    products.forEach(p => console.log(`   - ${p.name} (${p._id})`));
    
    // Check stocks
    const stocks = await Stock.find({}).limit(10);
    console.log(`\n📊 Found ${stocks.length} stock entries in database:`);
    if (stocks.length > 0) {
      stocks.slice(0, 5).forEach(s => {
        console.log(`   - Product: ${s.productId}, Age: ${s.ageCategory}, Weight: ${s.weight}, Qty: ${s.quantity}`);
      });
    } else {
      console.log('   ❌ No stock entries found!');
      
      // Try to initialize stocks
      console.log('\n🔄 Attempting to initialize stocks...');
      const { initializeAllProductStocks } = require('./backend/services/stockInitService');
      const result = await initializeAllProductStocks();
      console.log(`   Result: ${result.initialized} stocks initialized for ${result.products} products`);
    }
    
    // Check if stocks exist for first product
    if (products.length > 0) {
      const firstProduct = products[0];
      const productStocks = await Stock.find({ productId: firstProduct._id });
      console.log(`\n🎯 Stocks for ${firstProduct.name}: ${productStocks.length} variants`);
      if (productStocks.length > 0) {
        productStocks.slice(0, 3).forEach(s => {
          console.log(`   - ${s.ageCategory}, ${s.weight}: ${s.quantity} units`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDatabase();