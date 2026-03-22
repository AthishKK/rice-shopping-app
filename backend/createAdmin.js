const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@vetri-rice.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: admin@vetri-rice.com");
      console.log("Password: 9047564020");
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    // Create admin user
    const adminUser = new User({
      name: "Admin User",
      email: "admin@vetri-rice.com",
      password: hashedPassword,
      isAdmin: true,
      isPremium: true,
      ricePoints: 1000
    });

    await adminUser.save();
    
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@vetri-rice.com");
    console.log("🔑 Password: 9047564020");
    console.log("🔐 Admin privileges: Enabled");
    console.log("");
    console.log("You can now login with these credentials to access the admin panel.");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    mongoose.connection.close();
  }
};

createAdminUser();