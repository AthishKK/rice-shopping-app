const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
        ricePoints: user.ricePoints
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
        address: user.address
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
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { isPremium: true },
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