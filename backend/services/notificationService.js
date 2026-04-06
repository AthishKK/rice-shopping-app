const nodemailer = require('nodemailer');

// Simple console logging for development
const sendOrderConfirmationEmail = async (userEmail, userName, orderDetails) => {
  try {
    console.log('📧 EMAIL NOTIFICATION (would be sent to:', userEmail, ')');
    console.log('Subject: Order Confirmation - #' + orderDetails.orderId);
    console.log('Content: Order confirmed for', userName, '- Total: ₹' + orderDetails.totalAmount);
    console.log('Items:', orderDetails.items.map(item => `${item.name} (${item.quantity}x)`).join(', '));
    console.log('Delivery Address:', orderDetails.deliveryAddress.street, orderDetails.deliveryAddress.city);
    console.log('Expected Delivery:', new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-IN'));
    
    return { success: true, message: 'Email logged to console (development mode)' };
  } catch (error) {
    console.error('Failed to log email:', error);
    return { success: false, error: error.message };
  }
};

// Simple SMS logging for development
const sendOrderConfirmationSMS = async (phoneNumber, userName, orderDetails) => {
  try {
    const message = `Hi ${userName}! Your order #${orderDetails.orderId} for ₹${orderDetails.totalAmount} has been confirmed. Expected delivery: ${new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-IN')}. Thank you for choosing Vetri Vinayagar Rice Mart! 🌾`;
    
    console.log('📱 SMS NOTIFICATION (would be sent to:', phoneNumber, ')');
    console.log('Message:', message);
    console.log('Order Details:');
    console.log('- Order ID:', orderDetails.orderId);
    console.log('- Customer:', userName);
    console.log('- Total Amount:', '₹' + orderDetails.totalAmount);
    console.log('- Items Count:', orderDetails.items.length);
    console.log('- Expected Delivery:', new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-IN'));
    
    return { success: true, message: 'SMS logged to console (development mode)' };
  } catch (error) {
    console.error('Failed to log SMS:', error);
    return { success: false, error: error.message };
  }
};

// Simple status update logging for development
const sendOrderStatusUpdateEmail = async (userEmail, userName, orderDetails, newStatus) => {
  try {
    console.log('📧 STATUS UPDATE EMAIL (would be sent to:', userEmail, ')');
    console.log('Subject: Order Update - #' + orderDetails.orderId + ' - ' + newStatus);
    console.log('Content: Order status updated to', newStatus, 'for', userName);
    console.log('Order ID:', orderDetails.orderId);
    console.log('Total Amount: ₹' + orderDetails.totalAmount);
    
    return { success: true, message: 'Status update email logged to console (development mode)' };
  } catch (error) {
    console.error('Failed to log status update email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderConfirmationSMS,
  sendOrderStatusUpdateEmail
};