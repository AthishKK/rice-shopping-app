const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    // Verify user exists and is admin
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      isAdmin: true
    };
    
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = adminMiddleware;