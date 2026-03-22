const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Delete ALL existing admin accounts
    const deleted = await User.deleteMany({ email: "admin@vetri-rice.com" });
    console.log(`🗑️ Deleted ${deleted.deletedCount} old admin record(s)`);

    // Create fresh admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    await User.create({
      name: "Admin User",
      email: "admin@vetri-rice.com",
      password: await bcrypt.hash("9047564020", await bcrypt.genSalt(10)),
      isAdmin: true,
      isPremium: true,
      ricePoints: 1000
    });

    console.log("✅ Fresh admin created!");
    console.log("📧 Email: admin@vetri-rice.com");
    console.log("🔑 Password: 9047564020");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

fixAdmin();
