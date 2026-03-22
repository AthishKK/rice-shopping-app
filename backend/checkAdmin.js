const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const checkAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminUser = await User.findOne({ email: "admin@vetri-rice.com" });
    
    if (!adminUser) {
      console.log("❌ Admin user not found!");
      return;
    }

    console.log("✅ Admin user found:");
    console.log("Name:", adminUser.name);
    console.log("Email:", adminUser.email);
    console.log("isAdmin:", adminUser.isAdmin);
    console.log("isPremium:", adminUser.isPremium);
    console.log("ID:", adminUser._id);
    
    if (!adminUser.isAdmin) {
      console.log("🔧 Fixing admin status...");
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log("✅ Admin status updated!");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
};

checkAdminUser();