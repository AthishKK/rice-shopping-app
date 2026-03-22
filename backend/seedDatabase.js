const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

// Load environment variables
dotenv.config();

// Import models
const User = require("./models/User");
const Product = require("./models/Product");
const MarketPrice = require("./models/MarketPrice");
const Offer = require("./models/Offer");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Sample data
const sampleProducts = [
  {
    name: "Nei Kichadi Rice",
    basePremium: 60,
    category: "Traditional",
    color: "White",
    images: { packed: "/images/nei kichadi 1.jpeg", grain: "/images/nei kichadi 2.jpeg" },
    stock: 25,
    healthBenefits: ["Easy to digest", "Good for daily meals", "Provides long lasting energy", "Low fat"],
    description: "Traditional white rice, easy to digest and perfect for daily meals."
  },
  {
    name: "Seeraga Samba Rice",
    basePremium: 70,
    category: "Aromatic",
    color: "White",
    images: { packed: "/images/seeraga samba rice 1.jpeg", grain: "/images/seeraga samba rice 2.jpeg" },
    stock: 8,
    isTrending: true,
    isFlashSale: true,
    flashSaleDiscount: 15,
    healthBenefits: ["Helps control blood sugar", "Rich in fiber", "Good for heart health", "Helps digestion"],
    description: "Premium aromatic rice variety, perfect for biryani and special occasions."
  },
  {
    name: "Karuppu Kavuni Rice",
    basePremium: 120,
    category: "Premium",
    color: "Black",
    images: { packed: "/images/karuppu kavuni rice 1.jpeg", grain: "/images/karuppu kavuni rice 2.jpeg" },
    stock: 5,
    isTrending: true,
    isFlashSale: true,
    flashSaleDiscount: 18,
    healthBenefits: ["Very high antioxidants", "Improves immunity", "Good for heart health", "Rich in iron"],
    description: "Nutrient-rich black rice with exceptional health benefits."
  },
  {
    name: "Mappillai Samba Rice",
    basePremium: 90,
    category: "Traditional",
    color: "Red",
    images: { packed: "/images/mappillai samba rice 1.jpeg", grain: "/images/mappillai samba rice 2.jpeg" },
    stock: 15,
    healthBenefits: ["Increases body strength", "Rich in fiber", "Good for bones", "Improves stamina"],
    description: "Traditional red rice variety known for its nutritional value and taste."
  },
  {
    name: "Karunguruvai Rice",
    basePremium: 100,
    category: "Premium",
    color: "Black",
    images: { packed: "/images/karunguruvai rice 1.jpeg", grain: "/images/karunguruvai rice 2.jpeg" },
    stock: 30,
    healthBenefits: ["Detoxifies body", "Boosts immunity", "Helps digestion", "Improves metabolism"],
    description: "Premium black rice with detoxifying and immunity-boosting properties."
  },
  {
    name: "Basmati Rice",
    basePremium: 60,
    category: "Aromatic",
    color: "White",
    images: { packed: "/images/basmati rice 1.jpeg", grain: "/images/basmati rice 2.jpeg" },
    stock: 20,
    healthBenefits: ["Low fat", "Gluten free", "Easy digestion", "Good energy source"],
    description: "Premium long-grain aromatic rice, perfect for special dishes."
  },
  {
    name: "Kattuyanam Rice",
    basePremium: 95,
    category: "Traditional",
    color: "White",
    images: { packed: "/images/kattuyanam rice 1.jpeg", grain: "/images/kattuyanam rice 2.jpeg" },
    stock: 12,
    isTrending: true,
    healthBenefits: ["High fiber", "Helps weight control", "Supports gut health", "Rich in minerals"],
    description: "Traditional variety with high fiber content, great for weight management."
  },
  {
    name: "Poongar Rice",
    basePremium: 100,
    category: "Traditional",
    color: "Brown",
    images: { packed: "/images/poongar rice 1.jpeg", grain: "/images/poongar rice 2.jpeg" },
    stock: 18,
    isTodayDeal: true,
    healthBenefits: ["Good for women's health", "Strengthens immunity", "Helps digestion", "Natural antioxidants"],
    description: "Ancient variety with medicinal properties and high nutritional value."
  },
  {
    name: "Thooyamalli Rice",
    basePremium: 110,
    category: "Aromatic",
    color: "White",
    images: { packed: "/images/thooyamalli rice 1.jpeg", grain: "/images/thooyamalli rice 2.jpeg" },
    stock: 22,
    healthBenefits: ["Aromatic traditional rice", "Improves digestion", "Low glycemic index", "Rich in nutrients"],
    description: "Aromatic traditional rice with low glycemic index and rich nutrients."
  },
  {
    name: "Red Rice",
    basePremium: 80,
    category: "Traditional",
    color: "Red",
    images: { packed: "/images/red rice 1.jpeg", grain: "/images/red rice 2.jpeg" },
    stock: 35,
    isTodayDeal: true,
    healthBenefits: ["High iron content", "Good for heart health", "Rich in antioxidants", "Supports weight loss"],
    description: "Nutritious red rice variety with excellent health benefits."
  }
];

const sampleUsers = [
  {
    name: "Admin User",
    email: "admin@vetri-rice.com",
    password: "admin123",
    isPremium: true,
    isAdmin: true,
    ricePoints: 1000,
    address: {
      street: "123 Admin Street",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001"
    }
  },
  {
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    isPremium: false,
    ricePoints: 50,
    address: {
      street: "456 User Street",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002"
    }
  }
];

const sampleOffers = [
  {
    name: "New Year Special",
    type: "seasonal",
    discount: 15,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    bannerText: "🎊 New Year Special - 15% Off on All Traditional Rice!",
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log("Clearing existing data...");
    await User.deleteMany({});
    await Product.deleteMany({});
    await MarketPrice.deleteMany({});
    await Offer.deleteMany({});

    // Seed Users
    console.log("Seeding users...");
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    await User.insertMany(hashedUsers);

    // Seed Products
    console.log("Seeding products...");
    await Product.insertMany(sampleProducts);

    // Seed Market Price
    console.log("Seeding market price...");
    await MarketPrice.create({
      commodity: "Rice",
      pricePerKg: 60,
      previousPrice: 58,
      priceChange: 2,
      trend: "up",
      lastUpdated: new Date()
    });

    // Seed Offers
    console.log("Seeding offers...");
    await Offer.insertMany(sampleOffers);

    console.log("✅ Database seeded successfully!");
    console.log("\n📊 Seeded Data Summary:");
    console.log(`👥 Users: ${sampleUsers.length}`);
    console.log(`🌾 Products: ${sampleProducts.length}`);
    console.log(`💰 Market Prices: 1`);
    console.log(`🎉 Offers: ${sampleOffers.length}`);
    
    console.log("\n🔐 Admin Credentials:");
    console.log("Email: admin@vetri-rice.com");
    console.log("Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();