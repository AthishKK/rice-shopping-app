const cron = require("node-cron");
const { updateMarketPrice, initializeMarketPrice } = require("../services/marketService");
const { createFlashSale, expireOldFlashSales } = require("../services/flashSaleService");
const { createComboOffers, expireOldComboOffers } = require("../services/comboOfferService");

const startCronJobs = () => {
  // Initialize market price on startup
  initializeMarketPrice();

  // Expire old flash sales and combo offers on startup
  expireOldFlashSales();
  expireOldComboOffers();
  
  // Create initial combo offers if none exist
  createComboOffers(6, 4);

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

  // Auto flash sale every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("⚡ Creating new flash sale...");
    try {
      await createFlashSale(6); // 6 hour duration
    } catch (err) {
      console.error("Flash sale creation failed:", err);
    }
  });

  // Create new combo offers every 4 hours
  cron.schedule("0 */4 * * *", async () => {
    console.log("🎁 Creating new combo offers...");
    try {
      await createComboOffers(6, 4); // 6 offers, 4 hour duration
    } catch (err) {
      console.error("Combo offer creation failed:", err);
    }
  });

  // Clean up expired flash sales and combo offers every hour
  cron.schedule("0 * * * *", async () => {
    try {
      await expireOldFlashSales();
      await expireOldComboOffers();
    } catch (err) {
      console.error("Cleanup failed:", err);
    }
  });

  console.log("Cron jobs started successfully");
};

module.exports = startCronJobs;
