require('dotenv').config();
const mongoose = require('mongoose');
const Festival = require('./models/Festival');
const Product = require('./models/Product');

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rice-shopping-app';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const deactivateAllFestivals = async () => {
  try {
    console.log('🔄 Deactivating all festivals...');
    
    // Deactivate all festivals
    const festivalResult = await Festival.updateMany({}, { isActive: false });
    console.log(`✅ Deactivated ${festivalResult.modifiedCount} festivals`);
    
    // Clear all festival discounts from products
    const productResult = await Product.updateMany({}, { 
      festivalDiscount: 0, 
      activeFestival: "",
      isFlashSale: false,
      flashSaleDiscount: 0
    });
    console.log(`✅ Cleared festival/flash sale data from ${productResult.modifiedCount} products`);
    
    console.log('🎉 All festivals and flash sales have been deactivated!');
    
  } catch (error) {
    console.error('❌ Error deactivating festivals:', error);
  }
};

const main = async () => {
  await connectDB();
  await deactivateAllFestivals();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

main();