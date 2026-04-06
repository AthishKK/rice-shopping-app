const express = require('express');
const router = express.Router();
const { getTodaysDeals, getDealsForDate } = require('../controllers/todaysDealsController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public route - Get today's deals
router.get('/', getTodaysDeals);

// Admin route - Get deals for specific date
router.get('/date/:date', adminMiddleware, getDealsForDate);

module.exports = router;