const express = require('express');
const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Products route - coming soon!' });
});

module.exports = router;