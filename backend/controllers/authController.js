const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address: address || {}
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        ricePoints: user.ricePoints,
        createdAt: user.createdAt,
        premiumStartDate: user.premiumStartDate,
        premiumExpiryDate: user.premiumExpiryDate
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError' || error.message?.includes('connect')) {
      return res.status(503).json({ message: "Database unavailable. Please try again in a moment." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if premium has expired
    if (user.isPremium && user.premiumExpiryDate && new Date() > user.premiumExpiryDate) {
      user.isPremium = false;
      user.premiumStartDate = null;
      user.premiumExpiryDate = null;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        isAdmin: user.isAdmin,
        ricePoints: user.ricePoints,
        address: user.address,
        createdAt: user.createdAt,
        premiumStartDate: user.premiumStartDate,
        premiumExpiryDate: user.premiumExpiryDate
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError' || error.message?.includes('connect')) {
      return res.status(503).json({ message: "Database unavailable. Please try again in a moment." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, address },
      { new: true }
    ).select('-password');

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.upgradeToPremium = async (req, res) => {
  try {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        isPremium: true,
        premiumStartDate: now,
        premiumExpiryDate: expiryDate
      },
      { new: true }
    ).select('-password');

    res.json({
      message: "Upgraded to premium successfully",
      user
    });
  } catch (error) {
    console.error("Premium upgrade error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addRicePoints = async (req, res) => {
  try {
    const { points } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $inc: { ricePoints: points } },
      { new: true }
    ).select('-password');

    res.json({
      message: "Rice points added successfully",
      user
    });
  } catch (error) {
    console.error("Add rice points error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordExpiry = otpExpiry;
    await user.save();

    console.log(`OTP for ${email}: ${otp}`);
    
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    
    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};