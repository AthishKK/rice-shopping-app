const Stock = require('../models/Stock');
const Product = require('../models/Product');

// Initialize stock for all products if they don't exist
const initializeAllProductStocks = async () => {
  try {
    console.log('🔄 Checking stock initialization...');
    
    const products = await Product.find({});
    const ageCategories = ['6 months', '1 year', '2 years'];
    const weights = ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'];
    
    let initializedCount = 0;
    
    for (const product of products) {
      // Check if any stock exists for this product
      const existingStockCount = await Stock.countDocuments({ productId: product._id });
      
      if (existingStockCount === 0) {
        // Only initialize if no stock exists for this product
        const stockEntries = [];
        for (const age of ageCategories) {
          for (const weight of weights) {
            stockEntries.push({
              productId: product._id,
              ageCategory: age,
              weight: weight,
              quantity: 50
            });
          }
        }
        
        await Stock.insertMany(stockEntries);
        initializedCount += stockEntries.length;
        console.log(`📦 Initialized ${stockEntries.length} stock entries for ${product.name}`);
      }
    }
    
    if (initializedCount > 0) {
      console.log(`📦 Initialized ${initializedCount} new stock entries for ${products.length} products`);
    } else {
      console.log('✅ All product stocks already initialized');
    }
    
    return { initialized: initializedCount, products: products.length };
  } catch (error) {
    console.error('❌ Error initializing stocks:', error);
    throw error;
  }
};

// Initialize stock for a specific product
const initializeProductStock = async (productId, initialQuantity = 50) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    const ageCategories = ['6 months', '1 year', '2 years'];
    const weights = ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'];
    
    const stockEntries = [];
    for (const age of ageCategories) {
      for (const weight of weights) {
        stockEntries.push({
          productId,
          ageCategory: age,
          weight,
          quantity: initialQuantity
        });
      }
    }
    
    // Use insertMany with ordered: false to continue on duplicates
    await Stock.insertMany(stockEntries, { ordered: false });
    
    console.log(`📦 Stock initialized for ${product.name} with ${initialQuantity} units per variant`);
    return { success: true, message: `Stock initialized for ${product.name}` };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - stock already exists
      return { success: true, message: 'Stock already exists for this product' };
    }
    console.error('Error initializing product stock:', error);
    throw error;
  }
};

module.exports = {
  initializeAllProductStocks,
  initializeProductStock
};