const router = require("express").Router();
const { 
  login, 
  register, 
  getProfile, 
  updateProfile, 
  upgradeToPremium, 
  addRicePoints,
  forgotPassword,
  verifyOTP,
  resetPassword
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.post("/login", login);
router.post("/register", register);
router.post("/signup", register); // Add signup alias for frontend compatibility
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Test route
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth routes are working!" });
});

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/upgrade-premium", authMiddleware, upgradeToPremium);
router.post("/add-points", authMiddleware, addRicePoints);

module.exports = router;