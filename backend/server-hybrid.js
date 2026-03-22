const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory storage fallback
let users = [];
let isMongoConnected = false;

// MongoDB connection with fallback
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    isMongoConnected = true;
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('🔄 Using in-memory storage as fallback...');
    isMongoConnected = false;
  });

// User Schema (for MongoDB)
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String },
  googleId: { type: String },
  profilePicture: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'rice_shopping_app_super_secret_jwt_key_2024_secure_token_12345';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper functions for dual storage
const findUserByEmail = async (email) => {
  if (isMongoConnected) {
    return await User.findOne({ email });
  } else {
    return users.find(u => u.email === email);
  }
};

const createUser = async (userData) => {
  if (isMongoConnected) {
    const user = new User(userData);
    return await user.save();
  } else {
    const user = { ...userData, id: Date.now().toString(), createdAt: new Date() };
    users.push(user);
    return user;
  }
};

const findUserById = async (id) => {
  if (isMongoConnected) {
    return await User.findById(id).select('-password');
  } else {
    const user = users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }
};

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date(),
    database: isMongoConnected ? 'MongoDB Atlas' : 'In-Memory',
    usersCount: isMongoConnected ? 'Check MongoDB' : users.length
  });
});

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData = {
      fullName,
      email,
      phone,
      password: hashedPassword
    };

    await createUser(userData);
    console.log('New user registered:', { email, fullName, storage: isMongoConnected ? 'MongoDB' : 'Memory' });

    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('User logged in:', email, 'Storage:', isMongoConnected ? 'MongoDB' : 'Memory');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google Login (simplified for now)
app.post('/api/auth/google', async (req, res) => {
  try {
    // Mock Google user for testing
    const mockGoogleUser = {
      fullName: 'Google User',
      email: 'user@gmail.com',
      googleId: 'google_123',
      profilePicture: 'https://via.placeholder.com/100'
    };

    let user = await findUserByEmail(mockGoogleUser.email);
    
    if (!user) {
      user = await createUser(mockGoogleUser);
    }

    const token = jwt.sign(
      { userId: user._id || user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Google login:', user.email, 'Storage:', isMongoConnected ? 'MongoDB' : 'Memory');

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`💾 Storage: ${isMongoConnected ? 'MongoDB Atlas' : 'In-Memory (Fallback)'}`);
  console.log('🔐 Authentication system ready!');
});