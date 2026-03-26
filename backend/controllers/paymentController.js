const { createPaymentOrder, verifyPaymentSignature, getPaymentDetails } = require('../services/paymentService');
const Order = require('../models/Order');
const User = require('../models/User');
const { calculateRicePoints } = require('../utils/helpers');
const { reduceStock } = require('../services/stockService');

/**
 * Create payment order (Step 1 of payment flow)
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId, amount, items } = req.body;
    const userId = req.user.userId;

    // Create payment order with Razorpay
    const paymentResult = await createPaymentOrder({
      orderId,
      amount,
      userId,
      items
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        message: 'Failed to create payment order',
        error: paymentResult.error
      });
    }

    res.json({
      success: true,
      razorpayOrderId: paymentResult.razorpayOrderId,
      amount: amount * 100, // Send amount in paise for frontend
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id'
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify payment and complete order (Step 2 of payment flow)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = req.body;
    const userId = req.user.userId;

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(razorpay_payment_id);
    if (!paymentDetails.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }

    // Create order in database
    const order = await Order.create({
      userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      deliveryAddress: orderData.deliveryAddress,
      ricePointsUsed: orderData.ricePointsUsed || 0,
      ricePointsDiscount: orderData.ricePointsDiscount || 0
    });

    // Update user rice points
    const ricePointsEarned = calculateRicePoints(orderData.totalAmount);
    const pointsUpdate = ricePointsEarned - (orderData.ricePointsUsed || 0);
    await User.findByIdAndUpdate(userId, { $inc: { ricePoints: pointsUpdate } });

    // Reduce stock for all items (skip free items)
    try {
      for (let item of orderData.items) {
        if (item.isFreeItem) continue;
        await reduceStock(item.productId, item.ageCategory, item.weight, item.quantity);
      }
    } catch (stockError) {
      console.error('Stock reduction failed after payment:', stockError);
      // Payment is already successful, so we log the error but don't fail the order
    }

    res.json({
      success: true,
      message: 'Payment verified and order created successfully',
      order,
      paymentDetails: paymentDetails.payment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during payment verification'
    });
  }
};

/**
 * Handle payment failure
 */
exports.handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, error } = req.body;
    
    // Log payment failure
    console.log('Payment failed:', {
      razorpay_order_id,
      error,
      userId: req.user.userId,
      timestamp: new Date()
    });

    res.json({
      success: false,
      message: 'Payment failed',
      error: error
    });
  } catch (error) {
    console.error('Handle payment failure error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};