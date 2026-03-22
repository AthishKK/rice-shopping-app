const Stock = require('../models/Stock');
const Product = require('../models/Product');

// Check if a specific product variant is available
exports.checkStockAvailability = async (productId, ageCategory, weight, requestedQuantity = 1) => {
  try {
    const stock = await Stock.findOne({ productId, ageCategory, weight });
    
    if (!stock) {
      return { available: false, currentStock: 0, message: 'Stock not found' };
    }
    
    const available = stock.quantity >= requestedQuantity;
    return {
      available,
      currentStock: stock.quantity,
      message: available ? 'In stock' : `Only ${stock.quantity} units available`
    };
  } catch (error) {
    console.error('Stock availability check error:', error);
    return { available: false, currentStock: 0, message: 'Error checking stock' };
  }
};

// Get all stock for a product
exports.getProductStockSummary = async (productId) => {
  try {
    const stocks = await Stock.find({ productId }).sort({ ageCategory: 1, weight: 1 });
    
    const summary = {
      totalVariants: stocks.length,
      inStock: stocks.filter(s => s.quantity > 8).length,
      lowStock: stocks.filter(s => s.quantity > 0 && s.quantity <= 8).length,
      outOfStock: stocks.filter(s => s.quantity === 0).length,
      variants: stocks.map(s => ({
        ageCategory: s.ageCategory,
        weight: s.weight,
        quantity: s.quantity,
        status: s.quantity === 0 ? 'out-of-stock' : s.quantity <= 8 ? 'low-stock' : 'in-stock'
      }))
    };
    
    return summary;
  } catch (error) {
    console.error('Product stock summary error:', error);
    return null;
  }
};

// Reduce stock when order is placed
exports.reduceStock = async (productId, ageCategory, weight, quantity) => {
  try {
    const stock = await Stock.findOne({ productId, ageCategory, weight });
    
    if (!stock) {
      throw new Error('Stock not found');
    }
    
    if (stock.quantity < quantity) {
      throw new Error(`Insufficient stock. Only ${stock.quantity} units available`);
    }
    
    stock.quantity -= quantity;
    stock.lastUpdated = new Date();
    await stock.save();
    
    return {
      success: true,
      remainingStock: stock.quantity,
      message: `Stock reduced by ${quantity} units`
    };
  } catch (error) {
    console.error('Reduce stock error:', error);
    throw error;
  }
};

// Restore stock when order is cancelled
exports.restoreStock = async (productId, ageCategory, weight, quantity) => {
  try {
    const stock = await Stock.findOneAndUpdate(
      { productId, ageCategory, weight },
      { 
        $inc: { quantity: quantity },
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    return {
      success: true,
      newStock: stock.quantity,
      message: `Stock restored by ${quantity} units`
    };
  } catch (error) {
    console.error('Restore stock error:', error);
    throw error;
  }
};

// Get stock status for product display
exports.getStockStatus = async (productId, ageCategory, weight) => {
  try {
    const stock = await Stock.findOne({ productId, ageCategory, weight });
    
    if (!stock || stock.quantity === 0) {
      return { status: 'out-of-stock', quantity: 0, message: 'Out of Stock' };
    }
    
    if (stock.quantity <= 8) {
      return { status: 'low-stock', quantity: stock.quantity, message: `Only ${stock.quantity} left` };
    }
    
    return { status: 'in-stock', quantity: stock.quantity, message: 'In Stock' };
  } catch (error) {
    console.error('Get stock status error:', error);
    return { status: 'unknown', quantity: 0, message: 'Stock status unavailable' };
  }
};

// Initialize stock for new products
exports.initializeProductStock = async (productId, initialQuantity = 50) => {
  try {
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
    
    await Stock.insertMany(stockEntries, { ordered: false });
    return { success: true, message: `Stock initialized with ${initialQuantity} units per variant` };
  } catch (error) {
    if (error.code === 11000) {
      return { success: true, message: 'Stock already exists for this product' };
    }
    console.error('Initialize stock error:', error);
    throw error;
  }
};