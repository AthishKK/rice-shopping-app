const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

/**
 * Create a payment order with Razorpay
 */
exports.createPaymentOrder = async (orderData) => {
  try {
    const options = {
      amount: Math.round(orderData.amount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderData.orderId,
      notes: {
        orderId: orderData.orderId,
        userId: orderData.userId,
        items: JSON.stringify(orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })))
      }
    };

    const paymentOrder = await razorpay.orders.create(options);
    return {
      success: true,
      paymentOrder,
      razorpayOrderId: paymentOrder.id
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify payment signature
 */
exports.verifyPaymentSignature = (paymentData) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
};

/**
 * Get payment details from Razorpay
 */
exports.getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment
    };
  } catch (error) {
    console.error('Get payment details error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Refund payment
 */
exports.refundPayment = async (paymentId, amount = null) => {
  try {
    const refundData = {};
    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundData);
    return {
      success: true,
      refund
    };
  } catch (error) {
    console.error('Refund error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};