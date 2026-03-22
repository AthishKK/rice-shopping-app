const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Stock = require('./models/Stock');
const Product = require('./models/Product');

const fixStockPersistence = async () => {
  try {
    console.log('🔧 Starting Stock Persistence Fix...');
    
    // Try multiple connection methods
    const connectionStrings = [
      process.env.MONGO_URI,
      'mongodb://localhost:27017/rice-shopping-app',
      'mongodb://127.0.0.1:27017/rice-shopping-app'
    ];
    
    let connected = false;
    for (const uri of connectionStrings) {
      if (!uri) continue;
      
      try {
        console.log(`🔗 Trying connection: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        await mongoose.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 3000,
        });
        console.log('✅ Connected successfully!');
        connected = true;
        break;
      } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
        continue;
      }
    }
    
    if (!connected) {
      throw new Error('Could not connect to any MongoDB instance');
    }
    
    // Check current state
    const productCount = await Product.countDocuments();
    const stockCount = await Stock.countDocuments();
    
    console.log(`\n📊 Current state:`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Stock entries: ${stockCount}`);
    
    if (productCount === 0) {
      console.log('⚠️ No products found. Creating sample products...');
      
      const sampleProducts = [
        { name: 'Basmati Rice', category: 'Premium', basePremium: 25, image: '/images/basmati.jpg' },
        { name: 'Seeraga Samba Rice', category: 'Traditional', basePremium: 30, image: '/images/seeraga-samba.jpg' },
        { name: 'Red Rice', category: 'Healthy', basePremium: 20, image: '/images/red-rice.jpg' }
      ];
      
      const createdProducts = await Product.insertMany(sampleProducts);
      console.log(`✅ Created ${createdProducts.length} sample products`);
    }
    
    // Get all products
    const products = await Product.find({});
    console.log(`\n🌾 Found ${products.length} products`);
    
    // Initialize stocks for all products
    const ageCategories = ['6 months', '1 year', '2 years'];
    const weights = ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'];
    
    let initializedCount = 0;
    let updatedCount = 0;
    
    for (const product of products) {
      console.log(`\n📦 Processing ${product.name}...`);
      
      for (const age of ageCategories) {
        for (const weight of weights) {
          const existingStock = await Stock.findOne({
            productId: product._id,
            ageCategory: age,
            weight: weight
          });
          
          if (!existingStock) {
            await Stock.create({
              productId: product._id,
              ageCategory: age,
              weight: weight,
              quantity: 50
            });
            initializedCount++;
          } else if (existingStock.quantity === 0) {
            // Reset zero quantities to 50
            existingStock.quantity = 50;
            await existingStock.save();
            updatedCount++;
          }
        }
      }
    }
    
    console.log(`\n✅ Stock initialization completed:`);
    console.log(`   New entries created: ${initializedCount}`);
    console.log(`   Zero quantities reset: ${updatedCount}`);
    
    // Verify final state
    const finalStockCount = await Stock.countDocuments();
    const expectedStockCount = products.length * ageCategories.length * weights.length;
    
    console.log(`\n📊 Final verification:`);
    console.log(`   Total stock entries: ${finalStockCount}`);
    console.log(`   Expected entries: ${expectedStockCount}`);
    console.log(`   Status: ${finalStockCount === expectedStockCount ? '✅ Perfect!' : '⚠️ Mismatch'}`);
    
    // Show stock summary by product
    console.log(`\n📋 Stock summary by product:`);
    for (const product of products) {
      const productStocks = await Stock.find({ productId: product._id });
      const inStock = productStocks.filter(s => s.quantity > 8).length;
      const lowStock = productStocks.filter(s => s.quantity > 0 && s.quantity <= 8).length;
      const outOfStock = productStocks.filter(s => s.quantity === 0).length;
      
      console.log(`   ${product.name}: ${productStocks.length} variants (${inStock} in stock, ${lowStock} low, ${outOfStock} out)`);
    }
    
    console.log(`\n🎉 Stock persistence fix completed successfully!`);
    
  } catch (error) {
    console.error('❌ Stock persistence fix failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB is not running. Please:');
      console.log('1. Start MongoDB service: net start MongoDB');
      console.log('2. Or install MongoDB: https://www.mongodb.com/try/download/community');
      console.log('3. Or use MongoDB Atlas (cloud database)');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from database');
    }
  }
};

fixStockPersistence();