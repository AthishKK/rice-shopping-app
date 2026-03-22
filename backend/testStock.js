const mongoose = require('mongoose');
const Product = require('./models/Product');
const Stock = require('./models/Stock');
require('dotenv').config();

const testStockSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Test 1: Check if products exist
    const products = await Product.find({}).limit(3);
    console.log(`\n✅ Found ${products.length} products:`);
    products.forEach(p => console.log(`  - ${p.name} (ID: ${p._id})`));

    // Test 2: Check if stocks exist
    const stocks = await Stock.find({}).limit(10);
    console.log(`\n✅ Found ${stocks.length} stock entries:`);
    stocks.slice(0, 5).forEach(s => console.log(`  - Product: ${s.productId}, Age: ${s.ageCategory}, Weight: ${s.weight}, Qty: ${s.quantity}`));

    // Test 3: Test stock summary for first product
    if (products.length > 0) {
      const firstProduct = products[0];
      const productStocks = await Stock.find({ productId: firstProduct._id });
      console.log(`\n✅ Stock variants for ${firstProduct.name}: ${productStocks.length}`);
      
      const summary = {
        totalVariants: productStocks.length,
        inStock: productStocks.filter(s => s.quantity > 8).length,
        lowStock: productStocks.filter(s => s.quantity > 0 && s.quantity <= 8).length,
        outOfStock: productStocks.filter(s => s.quantity === 0).length
      };
      
      console.log(`  - Total variants: ${summary.totalVariants}`);
      console.log(`  - In stock: ${summary.inStock}`);
      console.log(`  - Low stock: ${summary.lowStock}`);
      console.log(`  - Out of stock: ${summary.outOfStock}`);
    }

    // Test 4: Update a stock entry
    if (stocks.length > 0) {
      const testStock = stocks[0];
      const originalQty = testStock.quantity;
      testStock.quantity = 5; // Set to low stock
      await testStock.save();
      console.log(`\n✅ Updated stock: ${testStock.productId} ${testStock.ageCategory} ${testStock.weight} from ${originalQty} to ${testStock.quantity}`);
      
      // Restore original quantity
      testStock.quantity = originalQty;
      await testStock.save();
      console.log(`✅ Restored stock to ${originalQty}`);
    }

    console.log('\n🎉 Stock system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test
if (require.main === module) {
  testStockSystem();
}

module.exports = testStockSystem;