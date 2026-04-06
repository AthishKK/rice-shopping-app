const { getTodaysDeals, getDealsForDate } = require('../services/todaysDealsService');

// Get today's deals
exports.getTodaysDeals = async (req, res) => {
  try {
    const deals = await getTodaysDeals();
    
    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      deals: deals,
      message: 'Today\'s deals retrieved successfully'
    });
  } catch (error) {
    console.error('Get today\'s deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s deals',
      error: error.message
    });
  }
};

// Get deals for a specific date (admin only)
exports.getDealsForDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    const deals = await getDealsForDate(date);
    
    res.json({
      success: true,
      date: date,
      deals: deals,
      message: `Deals for ${date} retrieved successfully`
    });
  } catch (error) {
    console.error('Get deals for date error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deals for date',
      error: error.message
    });
  }
};

module.exports = {
  getTodaysDeals: exports.getTodaysDeals,
  getDealsForDate: exports.getDealsForDate
};