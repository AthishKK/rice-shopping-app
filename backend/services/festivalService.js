const Offer = require("../models/Offer");
const Product = require("../models/Product");
const Festival = require("../models/Festival");

// Default Indian festivals — seeded into DB on first run
const DEFAULT_FESTIVALS = [
  { name: "Pongal",          startMonth: 0,  startDay: 14, endMonth: 0,  endDay: 17, discount: 20, bannerText: "🎉 Pongal Special — 20% Off on Traditional Rice!" },
  { name: "Republic Day",    startMonth: 0,  startDay: 25, endMonth: 0,  endDay: 26, discount: 10, bannerText: "🇮🇳 Republic Day Sale — 10% Off Sitewide!" },
  { name: "Tamil New Year",  startMonth: 3,  startDay: 13, endMonth: 3,  endDay: 15, discount: 18, bannerText: "🌸 Tamil New Year — 18% Off on All Rice!" },
  { name: "Holi",            startMonth: 2,  startDay: 24, endMonth: 2,  endDay: 26, discount: 15, bannerText: "🌈 Holi Celebration — 15% Off on Premium Rice!" },
  { name: "Ugadi",           startMonth: 3,  startDay: 8,  endMonth: 3,  endDay: 10, discount: 15, bannerText: "🌺 Ugadi Special — 15% Off!" },
  { name: "Eid ul-Fitr",     startMonth: 3,  startDay: 10, endMonth: 3,  endDay: 12, discount: 18, bannerText: "🌙 Eid Mubarak — 18% Off on Basmati & Premium Rice!" },
  { name: "Onam",            startMonth: 7,  startDay: 28, endMonth: 8,  endDay: 6,  discount: 22, bannerText: "🌸 Onam Harvest Festival — 22% Off on All Rice!" },
  { name: "Independence Day",startMonth: 7,  startDay: 14, endMonth: 7,  endDay: 15, discount: 10, bannerText: "🇮🇳 Independence Day — 10% Off Sitewide!" },
  { name: "Navratri",        startMonth: 9,  startDay: 2,  endMonth: 9,  endDay: 11, discount: 20, bannerText: "🪔 Navratri Special — 20% Off on Traditional Rice!" },
  { name: "Dussehra",        startMonth: 9,  startDay: 12, endMonth: 9,  endDay: 13, discount: 15, bannerText: "🏹 Dussehra Sale — 15% Off!" },
  { name: "Diwali",          startMonth: 9,  startDay: 28, endMonth: 10, endDay: 5,  discount: 25, bannerText: "✨ Diwali Dhamaka — 25% Off on Premium Rice!" },
  { name: "Karthigai Deepam",startMonth: 10, startDay: 26, endMonth: 10, endDay: 28, discount: 15, bannerText: "🪔 Karthigai Deepam — 15% Off on Traditional Rice!" },
  { name: "Christmas",       startMonth: 11, startDay: 23, endMonth: 11, endDay: 26, discount: 15, bannerText: "🎄 Christmas Special — 15% Off on All Rice!" },
  { name: "New Year",        startMonth: 11, startDay: 30, endMonth: 0,  endDay: 2,  discount: 12, bannerText: "🎆 New Year Sale — 12% Off Sitewide!" },
];

// Seed default festivals into DB if empty
const seedFestivals = async () => {
  try {
    const count = await Festival.countDocuments();
    if (count === 0) {
      await Festival.insertMany(DEFAULT_FESTIVALS);
      console.log("Default festivals seeded into DB");
    }
  } catch (err) {
    console.error("Error seeding festivals:", err);
  }
};

// Get currently active festival from DB
const getCurrentFestival = async () => {
  try {
    await seedFestivals();
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    const festivals = await Festival.find({ isActive: true });

    for (const f of festivals) {
      // Handle festivals that span across year boundary (e.g. New Year Dec 30 - Jan 2)
      const startsBeforeEnd = f.startMonth < f.endMonth ||
        (f.startMonth === f.endMonth && f.startDay <= f.endDay);

      if (startsBeforeEnd) {
        const afterStart = month > f.startMonth || (month === f.startMonth && day >= f.startDay);
        const beforeEnd  = month < f.endMonth  || (month === f.endMonth  && day <= f.endDay);
        if (afterStart && beforeEnd) return f;
      } else {
        // Wraps year: e.g. Dec 30 → Jan 2
        const afterStart = month > f.startMonth || (month === f.startMonth && day >= f.startDay);
        const beforeEnd  = month < f.endMonth   || (month === f.endMonth  && day <= f.endDay);
        if (afterStart || beforeEnd) return f;
      }
    }
    return null;
  } catch (err) {
    console.error("Error getting current festival:", err);
    return null;
  }
};

// Apply festival discount to all products
const applyFestivalDiscount = async (festival) => {
  try {
    if (!festival) {
      // Remove festival discounts
      await Product.updateMany({}, { festivalDiscount: 0, activeFestival: "" });
      return;
    }
    await Product.updateMany({}, {
      festivalDiscount: festival.discount,
      activeFestival: festival.name
    });
    console.log(`Festival discount applied: ${festival.name} (${festival.discount}%)`);
  } catch (err) {
    console.error("Error applying festival discount:", err);
  }
};

const getActiveOffers = async () => {
  try {
    const now = new Date();
    return await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate("applicableProducts");
  } catch (err) {
    console.error("Error getting active offers:", err);
    return [];
  }
};

// Auto flash sale — picks random products, applies random discounts
const createFlashSale = async () => {
  try {
    const products = await Product.find({});
    const count = Math.floor(Math.random() * 3) + 2; // 2–4 products
    const selected = products.sort(() => 0.5 - Math.random()).slice(0, count);
    const discounts = [15, 20, 25, 30];

    await Product.updateMany({}, { isFlashSale: false, flashSaleDiscount: 0 });

    const result = [];
    for (const p of selected) {
      const discount = discounts[Math.floor(Math.random() * discounts.length)];
      await Product.findByIdAndUpdate(p._id, { isFlashSale: true, flashSaleDiscount: discount });
      result.push({ id: p._id, name: p.name, discount });
    }

    console.log(`Flash sale created for ${result.length} products`);
    return result;
  } catch (err) {
    console.error("Error creating flash sale:", err);
    return [];
  }
};

// Admin: set flash sale on specific products with specific discounts
const setFlashSaleProducts = async (productDiscounts) => {
  try {
    // productDiscounts = [{ productId, discount }]
    await Product.updateMany({}, { isFlashSale: false, flashSaleDiscount: 0 });

    for (const { productId, discount } of productDiscounts) {
      await Product.findByIdAndUpdate(productId, {
        isFlashSale: true,
        flashSaleDiscount: discount
      });
    }
    console.log(`Manual flash sale set for ${productDiscounts.length} products`);
    return true;
  } catch (err) {
    console.error("Error setting flash sale products:", err);
    return false;
  }
};

const getFlashSaleProducts = async () => {
  try {
    return await Product.find({ isFlashSale: true, flashSaleDiscount: { $gt: 0 } });
  } catch (err) {
    console.error("Error getting flash sale products:", err);
    return [];
  }
};

module.exports = {
  getCurrentFestival,
  applyFestivalDiscount,
  getActiveOffers,
  createFlashSale,
  setFlashSaleProducts,
  getFlashSaleProducts,
  seedFestivals
};
