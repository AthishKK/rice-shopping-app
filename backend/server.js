const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json());

// Serve frontend images statically
app.use("/images", express.static(path.join(__dirname, "../frontend/src/images")));

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    message: "Vetri Rice Shopping Backend API", 
    version: "2.0.0",
    features: [
      "Dynamic Pricing",
      "AI Chatbot", 
      "Festival Offers",
      "Flash Sales",
      "Admin Panel"
    ]
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));
app.use("/api/chat", require("./routes/chatbotRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// Initialize stocks for all products
const { initializeAllProductStocks } = require('./services/stockInitService');

// Start cron jobs
require("./utils/cronJobs")();

const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌾 Vetri Rice Shopping Backend API v2.0.0`);
  console.log(`📊 Features: Dynamic Pricing | AI Chatbot | Admin Panel`);
  
  // Initialize stocks after server starts
  try {
    await initializeAllProductStocks();
  } catch (error) {
    console.error('Failed to initialize stocks:', error);
  }
});