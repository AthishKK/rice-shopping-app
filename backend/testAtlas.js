const mongoose = require('mongoose');
require('dotenv').config();

const testAtlasConnection = async () => {
  try {
    console.log('🔗 Testing MongoDB Atlas connection...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('📊 Database:', mongoose.connection.name);
    
    // Test basic operations
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
    console.log('✅ Write test successful');
    
    const doc = await testCollection.findOne({ test: 'connection' });
    console.log('✅ Read test successful');
    
    await testCollection.deleteOne({ test: 'connection' });
    console.log('✅ Delete test successful');
    
    console.log('🎉 MongoDB Atlas is working perfectly!');
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('🔐 Check your username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('🌐 Check your internet connection and MongoDB Atlas network settings');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
};

testAtlasConnection();