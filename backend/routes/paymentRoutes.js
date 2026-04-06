const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  verifyPayment, 
  handlePaymentFailure, 
  testPaymentService,
  createPremiumOrder,
  verifyPremiumPayment
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Test payment service (no auth required)
router.get('/test', testPaymentService);

// Create Razorpay order
router.post('/create-order', authMiddleware, createOrder);

// Verify Razorpay payment
router.post('/verify', authMiddleware, verifyPayment);

// Handle payment failure
router.post('/failure', authMiddleware, handlePaymentFailure);

// Premium payment routes
router.post('/create-premium-order', authMiddleware, createPremiumOrder);
router.post('/verify-premium', authMiddleware, verifyPremiumPayment);

module.exports = router;