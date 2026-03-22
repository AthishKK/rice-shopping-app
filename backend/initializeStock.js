const mongoose = require('mongoose');
const Product = require('./models/Product');
const Stock = require('./models/Stock');
require('dotenv').config();

const initializeStockForAllProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    const ageCategories = ['6 months', '1 year', '2 years'];
    const weights = ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'];
    
    let totalStockEntries = 0;
    let skippedEntries = 0;

    for (const product of products) {
      console.log(`Initializing stock for: ${product.name}`);
      
      for (const age of ageCategories) {
        for (const weight of weights) {
          try {
            // Check if stock entry already exists
            const existingStock = await Stock.findOne({
              productId: product._id,
              ageCategory: age,
              weight: weight
            });

            if (existingStock) {
              skippedEntries++;
              continue;
            }

            // Create new stock entry with default quantity based on product's current stock
            const defaultQuantity = product.stock || 50;
            
            await Stock.create({
              productId: product._id,
              ageCategory: age,
              weight: weight,
              quantity: defaultQuantity
            });
            
            totalStockEntries++;
          } catch (error) {
            if (error.code === 11000) {
              // Duplicate key error - stock already exists
              skippedEntries++;
            } else {
              console.error(`Error creating stock for ${product.name} (${age}, ${weight}):`, error.message);
            }
          }
        }
      }
    }

    console.log(`\n✅ Stock initialization completed!`);
    console.log(`📦 Created ${totalStockEntries} new stock entries`);
    console.log(`⏭️  Skipped ${skippedEntries} existing entries`);
    console.log(`🎯 Total products processed: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error initializing stock:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  initializeStockForAllProducts();
}

module.exports = initializeStockForAllProducts;