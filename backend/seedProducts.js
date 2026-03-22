const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Product = require("./models/Product");
const MarketPrice = require("./models/MarketPrice");
const Stock = require("./models/Stock");

const sampleProducts = [
  { name: "Nei Kichadi Rice", basePremium: 60, category: "Traditional", color: "White", stock: 25, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTrending: false, isTodayDeal: false, healthBenefits: ["Easy to digest", "Good for daily meals", "Provides long lasting energy", "Low fat"] },
  { name: "Seeraga Samba Rice", basePremium: 70, category: "Aromatic", color: "White", stock: 8, isTrending: true, isFlashSale: true, flashSaleDiscount: 15, festivalDiscount: 0, isTodayDeal: false, healthBenefits: ["Helps control blood sugar", "Rich in fiber", "Good for heart health", "Helps digestion"] },
  { name: "Karuppu Kavuni Rice", basePremium: 120, category: "Premium", color: "Black", stock: 5, isTrending: true, isFlashSale: true, flashSaleDiscount: 18, festivalDiscount: 0, isTodayDeal: false, healthBenefits: ["Very high antioxidants", "Improves immunity", "Good for heart health", "Rich in iron"] },
  { name: "Mappillai Samba Rice", basePremium: 90, category: "Traditional", color: "Red", stock: 15, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTrending: false, isTodayDeal: false, healthBenefits: ["Increases body strength", "Rich in fiber", "Good for bones", "Improves stamina"] },
  { name: "Karunguruvai Rice", basePremium: 100, category: "Premium", color: "Black", stock: 30, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTrending: false, isTodayDeal: false, healthBenefits: ["Detoxifies body", "Boosts immunity", "Helps digestion", "Improves metabolism"] },
  { name: "Basmati Rice", basePremium: 60, category: "Aromatic", color: "White", stock: 20, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTrending: false, isTodayDeal: false, healthBenefits: ["Low fat", "Gluten free", "Easy digestion", "Good energy source"] },
  { name: "Kattuyanam Rice", basePremium: 95, category: "Traditional", color: "White", stock: 12, isTrending: true, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTodayDeal: false, healthBenefits: ["High fiber", "Helps weight control", "Supports gut health", "Rich in minerals"] },
  { name: "Poongar Rice", basePremium: 100, category: "Traditional", color: "Brown", stock: 18, isTodayDeal: true, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTrending: false, healthBenefits: ["Good for women's health", "Strengthens immunity", "Helps digestion", "Natural antioxidants"] },
  { name: "Thooyamalli Rice", basePremium: 110, category: "Aromatic", color: "White", stock: 22, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTrending: false, isTodayDeal: false, healthBenefits: ["Aromatic traditional rice", "Improves digestion", "Low glycemic index", "Rich in nutrients"] },
  { name: "Red Rice", basePremium: 80, category: "Traditional", color: "Red", stock: 35, isTodayDeal: true, isFlashSale: false, flashSaleDiscount: 0, festivalDiscount: 0, isTrending: false, healthBenefits: ["High iron content", "Good for heart health", "Rich in antioxidants", "Supports weight loss"] }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Only seed products if none exist
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} products already exist. Deleting and re-seeding...`);
      await Product.deleteMany({});
      await Stock.deleteMany({});
    }

    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${products.length} products`);

    // Seed stock for each product
    const ageCategories = ['6 months', '1 year', '2 years'];
    const weights = ['1kg', '2kg', '3kg', '4kg', '5kg', '10kg', '25kg', '26kg', '50kg'];
    const stockEntries = [];
    for (const product of products) {
      for (const age of ageCategories) {
        for (const weight of weights) {
          stockEntries.push({ productId: product._id, ageCategory: age, weight, quantity: 50 });
        }
      }
    }
    await Stock.insertMany(stockEntries);
    console.log(`✅ Seeded ${stockEntries.length} stock entries`);

    // Seed market price if not exists
    const mp = await MarketPrice.findOne({ commodity: "Rice" });
    if (!mp) {
      await MarketPrice.create({ commodity: "Rice", pricePerKg: 60, previousPrice: 58, priceChange: 2, trend: "up", source: "manual", lastUpdated: new Date() });
      console.log("✅ Seeded market price");
    }

    console.log("\n🎉 Done! Products and stocks seeded successfully.");
    console.log("Products:", products.map(p => p.name).join(", "));
  } catch (error) {
    console.error("❌ Seed error:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

seedProducts();
