const { FlashSale, FlashSaleSettings } = require("../models/FlashSale");
const Product = require("../models/Product");

// Get or create flash sale settings
const getFlashSaleSettings = async () => {
  try {
    let settings = await FlashSaleSettings.findOne();
    if (!settings) {
      settings = await FlashSaleSettings.create({
        autoRotationEnabled: true,
        rotationIntervalHours: 6
      });
    }
    return settings;
  } catch (err) {
    console.error("Error getting flash sale settings:", err);
    return { autoRotationEnabled: true, rotationIntervalHours: 6 };
  }
};

// Update flash sale settings
const updateFlashSaleSettings = async (autoRotationEnabled, rotationIntervalHours) => {
  try {
    let settings = await FlashSaleSettings.findOne();
    if (!settings) {
      settings = await FlashSaleSettings.create({
        autoRotationEnabled,
        rotationIntervalHours: rotationIntervalHours || 6
      });
    } else {
      settings.autoRotationEnabled = autoRotationEnabled;
      if (rotationIntervalHours) {
        settings.rotationIntervalHours = rotationIntervalHours;
      }
      settings.lastUpdated = new Date();
      await settings.save();
    }
    return settings;
  } catch (err) {
    console.error("Error updating flash sale settings:", err);
    return null;
  }
};

// Clear all flash sales and stop auto-rotation
const clearAllFlashSales = async () => {
  try {
    // Disable auto-rotation
    await updateFlashSaleSettings(false);
    
    // Expire all active flash sales
    await FlashSale.updateMany({ isActive: true }, { isActive: false });
    
    // Clear flash sale flags from all products
    await Product.updateMany({}, { 
      isFlashSale: false, 
      flashSaleDiscount: 0 
    });
    
    console.log("All flash sales cleared and auto-rotation disabled");
    return true;
  } catch (err) {
    console.error("Error clearing all flash sales:", err);
    return false;
  }
};

// Create a new flash sale with persistent countdown
const createFlashSale = async (durationHours = 6, skipAutoCheck = false) => {
  try {
    // Check if auto-rotation is enabled (unless manually triggered)
    if (!skipAutoCheck) {
      const settings = await getFlashSaleSettings();
      if (!settings.autoRotationEnabled) {
        console.log("Auto-rotation disabled, skipping flash sale creation");
        return null;
      }
      durationHours = settings.rotationIntervalHours || 6;
    }
    
    // Expire any existing flash sales first
    await expireOldFlashSales();
    
    // Clear existing flash sale flags from products
    await Product.updateMany({}, { isFlashSale: false, flashSaleDiscount: 0 });
    
    const products = await Product.find({});
    const count = Math.floor(Math.random() * 3) + 2; // 2–4 products
    const selected = products.sort(() => 0.5 - Math.random()).slice(0, count);
    const discounts = [15, 20, 25, 30];

    const now = new Date();
    const endTime = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));

    const flashSaleProducts = [];
    for (const p of selected) {
      const discount = discounts[Math.floor(Math.random() * discounts.length)];
      flashSaleProducts.push({
        productId: p._id,
        discount: discount
      });
      
      // Update product with flash sale info
      await Product.findByIdAndUpdate(p._id, { 
        isFlashSale: true, 
        flashSaleDiscount: discount 
      });
    }

    // Create flash sale record
    const flashSale = await FlashSale.create({
      name: skipAutoCheck ? "Manual Flash Sale" : "Auto Flash Sale",
      startTime: now,
      endTime: endTime,
      products: flashSaleProducts,
      isActive: true
    });

    console.log(`Flash sale created with ${flashSaleProducts.length} products, ending at ${endTime}`);
    return flashSale;
  } catch (err) {
    console.error("Error creating flash sale:", err);
    return null;
  }
};

// Get current active flash sale
const getCurrentFlashSale = async () => {
  try {
    await expireOldFlashSales(); // Clean up expired sales first
    return await FlashSale.getCurrentFlashSale();
  } catch (err) {
    console.error("Error getting current flash sale:", err);
    return null;
  }
};

// Expire old flash sales and update products
const expireOldFlashSales = async () => {
  try {
    const expiredCount = await FlashSale.expireOldFlashSales();
    
    if (expiredCount > 0) {
      // Clear flash sale flags from all products when sales expire
      await Product.updateMany({}, { isFlashSale: false, flashSaleDiscount: 0 });
      console.log(`Expired ${expiredCount} old flash sales`);
      
      // Check if auto-rotation is enabled and create new flash sale
      const settings = await getFlashSaleSettings();
      if (settings.autoRotationEnabled) {
        console.log("Auto-rotation enabled, creating new flash sale");
        setTimeout(() => {
          createFlashSale(settings.rotationIntervalHours, false);
        }, 2000); // 2 second delay to ensure cleanup is complete
      }
    }
    
    return expiredCount;
  } catch (err) {
    console.error("Error expiring flash sales:", err);
    return 0;
  }
};

// Admin: set flash sale on specific products with specific discounts
const setFlashSaleProducts = async (productDiscounts, durationHours = 6) => {
  try {
    // Expire existing flash sales
    await expireOldFlashSales();
    await Product.updateMany({}, { isFlashSale: false, flashSaleDiscount: 0 });

    const now = new Date();
    const endTime = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));

    const flashSaleProducts = [];
    for (const { productId, discount } of productDiscounts) {
      await Product.findByIdAndUpdate(productId, {
        isFlashSale: true,
        flashSaleDiscount: discount
      });
      
      flashSaleProducts.push({ productId, discount });
    }

    // Create flash sale record
    const flashSale = await FlashSale.create({
      name: "Admin Flash Sale",
      startTime: now,
      endTime: endTime,
      products: flashSaleProducts,
      isActive: true
    });

    // Temporarily disable auto-rotation when admin manually sets products
    await updateFlashSaleSettings(false);

    console.log(`Manual flash sale set for ${productDiscounts.length} products, ending at ${endTime}`);
    return flashSale;
  } catch (err) {
    console.error("Error setting flash sale products:", err);
    return null;
  }
};

// Get flash sale products with time remaining
const getFlashSaleProducts = async () => {
  try {
    const flashSale = await getCurrentFlashSale();
    if (!flashSale) {
      return { products: [], timeRemaining: 0, endTime: null };
    }

    const products = await Product.find({ 
      isFlashSale: true, 
      flashSaleDiscount: { $gt: 0 } 
    });

    const now = new Date();
    const timeRemaining = Math.max(0, flashSale.endTime.getTime() - now.getTime());

    return {
      products,
      timeRemaining,
      endTime: flashSale.endTime,
      flashSaleId: flashSale._id
    };
  } catch (err) {
    console.error("Error getting flash sale products:", err);
    return { products: [], timeRemaining: 0, endTime: null };
  }
};

module.exports = {
  createFlashSale,
  getCurrentFlashSale,
  expireOldFlashSales,
  setFlashSaleProducts,
  getFlashSaleProducts,
  getFlashSaleSettings,
  updateFlashSaleSettings,
  clearAllFlashSales
};