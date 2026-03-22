const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const Product = require('./models/Product');
require('dotenv').config();

const checkDatabaseHealth = async () => {
  try {
    console.log('🏥 Database Health Check Starting...');
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections found:', collections.map(c => c.name).join(', '));
    
    // Check products
    const productCount = await Product.countDocuments();
    console.log(`\n🌾 Products: ${productCount}`);
    
    // Check stocks
    const stockCount = await Stock.countDocuments();
    console.log(`📦 Stock entries: ${stockCount}`);
    
    if (productCount > 0) {
      const products = await Product.find({}).limit(3);
      console.log('\n📋 Sample products:');
      products.forEach(p => console.log(`  - ${p.name} (ID: ${p._id})`));
    }
    
    if (stockCount > 0) {
      const stocks = await Stock.find({}).populate('productId', 'name').limit(5);
      console.log('\n📊 Sample stock entries:');
      stocks.forEach(s => console.log(`  - ${s.productId?.name || 'Unknown'}: ${s.ageCategory} ${s.weight} = ${s.quantity} units`));
    }
    
    // Test write operation
    console.log('\n🧪 Testing write operation...');
    const testDoc = new Stock({
      productId: new mongoose.Types.ObjectId(),
      ageCategory: '6 months',
      weight: '1kg',
      quantity: 999
    });
    
    await testDoc.save();
    console.log('✅ Write test successful');
    
    // Clean up test document
    await Stock.deleteOne({ _id: testDoc._id });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n✅ Database health check completed successfully!');
    console.log('💡 Your MongoDB Atlas connection is working properly.');
    
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('🔐 Authentication issue - check your username/password in MONGO_URI');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 Network issue - check your internet connection');
    } else if (error.message.includes('timeout')) {
      console.log('⏰ Connection timeout - check your network access settings in MongoDB Atlas');
    }
    
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Verify your MongoDB Atlas credentials');
    console.log('2. Check Network Access settings (allow your IP)');
    console.log('3. Ensure your cluster is running');
    console.log('4. Check your internet connection');
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

checkDatabaseHealth();