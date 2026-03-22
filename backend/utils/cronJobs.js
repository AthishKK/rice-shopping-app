const cron = require("node-cron");
const { updateMarketPrice, initializeMarketPrice } = require("../services/marketService");
const { createFlashSale, getCurrentFestival, applyFestivalDiscount, seedFestivals } = require("../services/festivalService");

const startCronJobs = () => {
  // Seed festivals and initialize market price on startup
  seedFestivals();
  initializeMarketPrice();

  // Apply current festival discount on startup
  getCurrentFestival().then(applyFestivalDiscount);

  // Refresh market price from real API every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ Scheduled market price refresh...");
    try {
      await updateMarketPrice();
    } catch (err) {
      console.error("Market price update failed:", err);
    }
  });

  // Update market price every 2 hours during business hours (9 AM – 6 PM)
  cron.schedule("0 9-18/2 * * *", async () => {
    console.log("💰 Business hours price update...");
    try {
      await updateMarketPrice();
    } catch (err) {
      console.error("Business hours price update failed:", err);
    }
  });

  // Check and apply festival discounts every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("🎉 Checking festival discounts...");
    try {
      const festival = await getCurrentFestival();
      await applyFestivalDiscount(festival);
      if (festival) {
        console.log(`Festival active: ${festival.name} (${festival.discount}% off)`);
      }
    } catch (err) {
      console.error("Festival check failed:", err);
    }
  });

  // Auto flash sale every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⚡ Creating daily flash sale...");
    try {
      await createFlashSale();
    } catch (err) {
      console.error("Flash sale creation failed:", err);
    }
  });

  console.log("Cron jobs started successfully");
};

module.exports = startCronJobs;
