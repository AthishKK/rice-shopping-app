const mongoose = require('mongoose');
const { createFlashSale } = require('./services/flashSaleService');
require('dotenv').config();

const createTestFlashSale = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rice-shopping');
    console.log('Connected to MongoDB');
    
    // Create a flash sale with 6 hour duration
    const flashSale = await createFlashSale(6);
    
    if (flashSale) {
      console.log('✅ Flash sale created successfully!');
      console.log(`Flash sale ID: ${flashSale._id}`);
      console.log(`Products in flash sale: ${flashSale.products.length}`);
      console.log(`End time: ${flashSale.endTime}`);
    } else {
      console.log('❌ Failed to create flash sale');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating flash sale:', error);
    process.exit(1);
  }
};

createTestFlashSale();