const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        premiumExpiryDate: user.premiumExpiryDate
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during signup' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if premium has expired
    if (user.isPremium && user.premiumExpiryDate && new Date() > user.premiumExpiryDate) {
      user.isPremium = false;
      user.premiumExpiryDate = null;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        premiumExpiryDate: user.premiumExpiryDate
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// @route   GET /api/auth/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth routes are working!' });
});

// @route   POST /api/auth/upgrade-premium
// @desc    Upgrade user to premium
// @access  Private
router.post('/upgrade-premium', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Set premium status and expiry date (1 year from now)
    user.isPremium = true;
    user.premiumExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    await user.save();

    res.json({
      success: true,
      message: 'Congratulations! You are now a premium member!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        premiumExpiryDate: user.premiumExpiryDate
      }
    });

  } catch (error) {
    console.error('Premium upgrade error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during premium upgrade' 
    });
  }
});

module.exports = router;