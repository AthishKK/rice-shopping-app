const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const Product = require('./models/Product');
require('dotenv').config();

const testStockPersistence = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    // Check existing stocks
    const existingStocks = await Stock.find({});
    console.log(`📊 Found ${existingStocks.length} existing stock entries`);

    // Group stocks by product
    const stocksByProduct = {};
    existingStocks.forEach(stock => {
      const productId = stock.productId.toString();
      if (!stocksByProduct[productId]) {
        stocksByProduct[productId] = [];
      }
      stocksByProduct[productId].push(stock);
    });

    // Display stock summary for each product
    for (const product of products) {
      const productStocks = stocksByProduct[product._id.toString()] || [];
      const totalVariants = productStocks.length;
      const inStock = productStocks.filter(s => s.quantity > 8).length;
      const lowStock = productStocks.filter(s => s.quantity > 0 && s.quantity <= 8).length;
      const outOfStock = productStocks.filter(s => s.quantity === 0).length;
      
      console.log(`\n📋 ${product.name}:`);
      console.log(`   Total variants: ${totalVariants}/27 (expected 27)`);
      console.log(`   In stock (>8): ${inStock}`);
      console.log(`   Low stock (1-8): ${lowStock}`);
      console.log(`   Out of stock (0): ${outOfStock}`);
      
      if (totalVariants < 27) {
        console.log(`   ⚠️  Missing ${27 - totalVariants} stock entries!`);
      }
    }

    // Test stock update and persistence
    console.log('\n🧪 Testing stock update...');
    const testStock = existingStocks[0];
    if (testStock) {
      const originalQuantity = testStock.quantity;
      console.log(`Original quantity: ${originalQuantity}`);
      
      // Update stock
      testStock.quantity = originalQuantity + 10;
      await testStock.save();
      console.log(`Updated quantity: ${testStock.quantity}`);
      
      // Verify persistence
      const reloadedStock = await Stock.findById(testStock._id);
      console.log(`Reloaded quantity: ${reloadedStock.quantity}`);
      
      if (reloadedStock.quantity === originalQuantity + 10) {
        console.log('✅ Stock update persisted correctly');
      } else {
        console.log('❌ Stock update did not persist');
      }
      
      // Restore original quantity
      testStock.quantity = originalQuantity;
      await testStock.save();
      console.log(`Restored to original quantity: ${originalQuantity}`);
    }

    console.log('\n📊 Stock Test Summary:');
    console.log(`Total products: ${products.length}`);
    console.log(`Total stock entries: ${existingStocks.length}`);
    console.log(`Expected stock entries: ${products.length * 27}`);
    
    if (existingStocks.length === products.length * 27) {
      console.log('✅ All stock entries are present');
    } else {
      console.log('❌ Some stock entries are missing');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testStockPersistence();