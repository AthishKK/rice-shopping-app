const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/rice-shopping-app';

  console.log('🔗 Connecting to MongoDB...');

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💥 Server will exit. Fix MongoDB connection and restart.');
    process.exit(1);
  }
};

module.exports = connectDB;
