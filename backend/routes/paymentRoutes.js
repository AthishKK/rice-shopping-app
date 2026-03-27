const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment, handlePaymentFailure } = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

// Create payment order (before payment)
router.post('/create-order', auth, createPaymentOrder);

// Verify payment (after payment success)
router.post('/verify', auth, verifyPayment);

// Handle payment failure
router.post('/failure', auth, handlePaymentFailure);

module.exports = router;