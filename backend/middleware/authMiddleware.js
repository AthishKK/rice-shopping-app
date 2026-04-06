const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Authorization header:', req.header("Authorization"));
  
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    console.log('Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    console.log('Token decoded:', decoded);
    
    // Verify user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: "User not found" });
    }

    console.log('User found:', { id: user._id, email: user.email, isPremium: user.isPremium });

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      isPremium: user.isPremium,
      ricePoints: user.ricePoints
    };
    
    console.log('Auth successful, proceeding to next middleware');
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;