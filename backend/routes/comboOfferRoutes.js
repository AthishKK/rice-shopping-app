const express = require('express');
const router = express.Router();
const { 
  getComboOffersWithTimeRemaining, 
  createComboOffers, 
  createSpecificComboOffer,
  resetComboOffers 
} = require('../services/comboOfferService');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get active combo offers with time remaining
router.get('/', async (req, res) => {
  try {
    const comboOffers = await getComboOffersWithTimeRemaining();
    res.json(comboOffers);
  } catch (error) {
    console.error('Get combo offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create new combo offers
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { count = 12, durationHours = 4 } = req.body;
    const comboOffers = await createComboOffers(count, durationHours);
    res.json({ 
      message: `Created ${comboOffers.length} combo offers`,
      comboOffers 
    });
  } catch (error) {
    console.error('Create combo offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create specific combo offer
router.post('/create-specific', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { mainProductId, mainWeight, freeProductId, freeWeight, durationHours = 4 } = req.body;
    
    if (!mainProductId || !mainWeight || !freeProductId || !freeWeight) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const comboOffer = await createSpecificComboOffer(
      mainProductId, 
      mainWeight, 
      freeProductId, 
      freeWeight, 
      durationHours
    );
    
    if (comboOffer) {
      res.json({ message: 'Combo offer created successfully', comboOffer });
    } else {
      res.status(500).json({ message: 'Failed to create combo offer' });
    }
  } catch (error) {
    console.error('Create specific combo offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Reset combo offers to exactly 12
router.post('/reset', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { count = 12, durationHours = 4 } = req.body;
    const comboOffers = await resetComboOffers(count, durationHours);
    res.json({ 
      message: `Reset to ${comboOffers.length} combo offers`,
      comboOffers 
    });
  } catch (error) {
    console.error('Reset combo offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;