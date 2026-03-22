const calculateDeliveryDate = (pincode) => {
  // Simulate delivery estimation based on pincode
  const deliveryDate = new Date();
  
  // Chennai and nearby areas - 1-2 days
  if (pincode.startsWith('600') || pincode.startsWith('601')) {
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 2) + 1);
  }
  // Tamil Nadu - 2-3 days
  else if (pincode.startsWith('6')) {
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 2) + 2);
  }
  // Other states - 3-5 days
  else {
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3);
  }
  
  return deliveryDate;
};

const generateOrderId = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp.slice(-6)}${random}`;
};

const calculateRicePoints = (orderAmount) => {
  // 1 point for every ₹10 spent
  return Math.floor(orderAmount / 10);
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
};

const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

const getHealthBenefits = (riceName) => {
  const benefits = {
    'Karuppu Kavuni': [
      'Rich in antioxidants',
      'High in iron and zinc',
      'Helps in weight management',
      'Good for diabetics'
    ],
    'Seeraga Samba': [
      'Aromatic and flavorful',
      'Good for digestion',
      'Rich in fiber',
      'Perfect for biryani'
    ],
    'Mappillai Samba': [
      'High in protein',
      'Rich in selenium',
      'Boosts immunity',
      'Traditional variety'
    ],
    'Red Rice': [
      'High in fiber',
      'Rich in antioxidants',
      'Good for heart health',
      'Helps control blood sugar'
    ]
  };
  
  return benefits[riceName] || ['Nutritious and healthy', 'Good source of carbohydrates'];
};

module.exports = {
  calculateDeliveryDate,
  generateOrderId,
  calculateRicePoints,
  formatPrice,
  validatePincode,
  getHealthBenefits
};