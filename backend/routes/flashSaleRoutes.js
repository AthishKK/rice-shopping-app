const express = require('express');
const router = express.Router();
const { 
  getFlashSaleProducts, 
  getCurrentFlashSale,
  createFlashSale,
  setFlashSaleProducts,
  getFlashSaleSettings,
  updateFlashSaleSettings,
  clearAllFlashSales
} = require('../services/flashSaleService');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET /api/flash-sale/current
// @desc    Get current flash sale information including end time
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const flashSaleData = await getFlashSaleProducts();
    
    if (!flashSaleData.endTime) {
      return res.json({
        success: false,
        message: 'No active flash sale',
        endTime: null,
        timeRemaining: 0
      });
    }

    res.json({
      success: true,
      endTime: flashSaleData.endTime,
      timeRemaining: flashSaleData.timeRemaining,
      productsCount: flashSaleData.products.length,
      flashSaleId: flashSaleData.flashSaleId
    });
  } catch (error) {
    console.error('Error getting current flash sale:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting flash sale information'
    });
  }
});

// @route   GET /api/flash-sale/products
// @desc    Get flash sale products with timing
// @access  Public
router.get('/products', async (req, res) => {
  try {
    const flashSaleData = await getFlashSaleProducts();
    
    res.json({
      success: true,
      products: flashSaleData.products,
      endTime: flashSaleData.endTime,
      timeRemaining: flashSaleData.timeRemaining
    });
  } catch (error) {
    console.error('Error getting flash sale products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting flash sale products',
      products: []
    });
  }
});

// @route   GET /api/flash-sale/settings
// @desc    Get flash sale settings (admin)
// @access  Admin
router.get('/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const settings = await getFlashSaleSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting flash sale settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting flash sale settings'
    });
  }
});

// @route   POST /api/flash-sale/settings
// @desc    Update flash sale settings (admin)
// @access  Admin
router.post('/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { autoRotationEnabled, rotationIntervalHours } = req.body;
    
    const settings = await updateFlashSaleSettings(autoRotationEnabled, rotationIntervalHours);
    
    if (settings) {
      res.json({
        success: true,
        message: 'Flash sale settings updated successfully',
        settings
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update flash sale settings'
      });
    }
  } catch (error) {
    console.error('Error updating flash sale settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating flash sale settings'
    });
  }
});

// @route   POST /api/flash-sale/create
// @desc    Create new flash sale (admin)
// @access  Admin
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { durationHours = 6 } = req.body;
    
    const flashSale = await createFlashSale(durationHours, true); // skipAutoCheck = true for manual creation
    
    if (flashSale) {
      res.json({
        success: true,
        message: 'Flash sale created successfully',
        flashSale
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create flash sale'
      });
    }
  } catch (error) {
    console.error('Error creating flash sale:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating flash sale'
    });
  }
});

// @route   POST /api/flash-sale/set-products
// @desc    Set specific products for flash sale (admin)
// @access  Admin
router.post('/set-products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productDiscounts, durationHours = 6 } = req.body;
    
    if (!productDiscounts || !Array.isArray(productDiscounts) || productDiscounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product discounts array is required'
      });
    }
    
    const flashSale = await setFlashSaleProducts(productDiscounts, durationHours);
    
    if (flashSale) {
      res.json({
        success: true,
        message: 'Flash sale products set successfully',
        flashSale
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to set flash sale products'
      });
    }
  } catch (error) {
    console.error('Error setting flash sale products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting flash sale products'
    });
  }
});

// @route   POST /api/flash-sale/clear-all
// @desc    Clear all flash sales and stop auto-rotation (admin)
// @access  Admin
router.post('/clear-all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const success = await clearAllFlashSales();
    
    if (success) {
      res.json({
        success: true,
        message: 'All flash sales cleared and auto-rotation stopped'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to clear flash sales'
      });
    }
  } catch (error) {
    console.error('Error clearing flash sales:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing flash sales'
    });
  }
});

module.exports = router;