const ComboOffer = require("../models/ComboOffer");

// Predefined combo offer templates
const COMBO_TEMPLATES = [
  { mainProduct: 2,  mainWeight: 25, freeProduct: 1,  freeWeight: 1 },
  { mainProduct: 6,  mainWeight: 26, freeProduct: 10, freeWeight: 2 },
  { mainProduct: 3,  mainWeight: 50, freeProduct: 5,  freeWeight: 4 },
  { mainProduct: 10, mainWeight: 25, freeProduct: 4,  freeWeight: 1 },
  { mainProduct: 6,  mainWeight: 25, freeProduct: 9,  freeWeight: 1 },
  { mainProduct: 4,  mainWeight: 25, freeProduct: 8,  freeWeight: 2 },
  { mainProduct: 7,  mainWeight: 25, freeProduct: 2,  freeWeight: 1 },
  { mainProduct: 9,  mainWeight: 26, freeProduct: 6,  freeWeight: 1 },
  { mainProduct: 2,  mainWeight: 25, freeProduct: 7,  freeWeight: 1 },
  { mainProduct: 6,  mainWeight: 26, freeProduct: 4,  freeWeight: 2 },
  { mainProduct: 3,  mainWeight: 50, freeProduct: 8,  freeWeight: 4 },
  { mainProduct: 10, mainWeight: 25, freeProduct: 5,  freeWeight: 1 },
  { mainProduct: 2,  mainWeight: 25, freeProduct: 2,  freeWeight: 1 },
  { mainProduct: 6,  mainWeight: 26, freeProduct: 6,  freeWeight: 2 },
  { mainProduct: 4,  mainWeight: 25, freeProduct: 4,  freeWeight: 1 },
  { mainProduct: 9,  mainWeight: 25, freeProduct: 9,  freeWeight: 1 },
];

// Create new combo offers with persistent countdown
const createComboOffers = async (count = 12, durationHours = 4, skipExpiration = false) => {
  try {
    // Only expire existing offers if this is not called from expireOldComboOffers
    if (!skipExpiration) {
      await expireOldComboOffers();
    }
    
    // Select random combo templates
    const selectedTemplates = COMBO_TEMPLATES
      .sort(() => 0.5 - Math.random())
      .slice(0, count);

    const now = new Date();
    const comboOffers = [];

    for (let i = 0; i < selectedTemplates.length; i++) {
      const template = selectedTemplates[i];
      // Stagger end times between 1-6 hours for variety
      const randomDuration = (Math.random() * 5 + 1) * 60 * 60 * 1000; // 1-6 hours
      const endTime = new Date(now.getTime() + randomDuration);

      const comboOffer = await ComboOffer.create({
        name: `Combo Offer ${i + 1}`,
        mainProduct: {
          productId: template.mainProduct,
          weight: template.mainWeight
        },
        freeProduct: {
          productId: template.freeProduct,
          weight: template.freeWeight
        },
        startTime: now,
        endTime: endTime,
        isActive: true
      });

      comboOffers.push(comboOffer);
    }

    console.log(`Created ${comboOffers.length} combo offers`);
    return comboOffers;
  } catch (err) {
    console.error("Error creating combo offers:", err);
    return [];
  }
};

// Get current active combo offers
const getActiveComboOffers = async () => {
  try {
    await expireOldComboOffers(); // Clean up expired offers first
    return await ComboOffer.getActiveComboOffers();
  } catch (err) {
    console.error("Error getting active combo offers:", err);
    return [];
  }
};

// Expire old combo offers
const expireOldComboOffers = async () => {
  try {
    const expiredCount = await ComboOffer.expireOldComboOffers();
    
    if (expiredCount > 0) {
      console.log(`Expired ${expiredCount} old combo offers`);
      
      // Add exactly the same number of new offers as expired ones
      console.log(`Creating ${expiredCount} new combo offers to replace expired ones`);
      await createComboOffers(expiredCount, 4, true);
    }
    
    return expiredCount;
  } catch (err) {
    console.error("Error expiring combo offers:", err);
    return 0;
  }
};

// Get combo offers with time remaining
const getComboOffersWithTimeRemaining = async () => {
  try {
    const comboOffers = await getActiveComboOffers();
    const now = new Date();

    const offersWithTime = comboOffers.map(offer => {
      const timeRemaining = Math.max(0, offer.endTime.getTime() - now.getTime());
      return {
        ...offer.toObject(),
        timeRemaining,
        expiresIn: Math.floor(timeRemaining / 1000) // in seconds for frontend countdown
      };
    });

    return offersWithTime;
  } catch (err) {
    console.error("Error getting combo offers with time remaining:", err);
    return [];
  }
};

// Admin: create specific combo offer
const createSpecificComboOffer = async (mainProductId, mainWeight, freeProductId, freeWeight, durationHours = 4) => {
  try {
    const now = new Date();
    const endTime = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));

    const comboOffer = await ComboOffer.create({
      name: "Custom Combo Offer",
      mainProduct: {
        productId: mainProductId,
        weight: mainWeight
      },
      freeProduct: {
        productId: freeProductId,
        weight: freeWeight
      },
      startTime: now,
      endTime: endTime,
      isActive: true
    });

    console.log(`Created custom combo offer: ${mainProductId} + ${freeProductId}`);
    return comboOffer;
  } catch (err) {
    console.error("Error creating specific combo offer:", err);
    return null;
  }
};

// Reset combo offers to exact count
const resetComboOffers = async (count = 12, durationHours = 4) => {
  try {
    // Remove all existing combo offers
    await ComboOffer.deleteMany({});
    console.log('Removed all existing combo offers');
    
    // Create exactly the specified number of new combo offers
    const selectedTemplates = COMBO_TEMPLATES
      .sort(() => 0.5 - Math.random())
      .slice(0, count);

    const now = new Date();
    const comboOffers = [];

    for (let i = 0; i < selectedTemplates.length; i++) {
      const template = selectedTemplates[i];
      // Stagger end times between 1-6 hours for variety
      const randomDuration = (Math.random() * 5 + 1) * 60 * 60 * 1000; // 1-6 hours
      const endTime = new Date(now.getTime() + randomDuration);

      const comboOffer = await ComboOffer.create({
        name: `Combo Offer ${i + 1}`,
        mainProduct: {
          productId: template.mainProduct,
          weight: template.mainWeight
        },
        freeProduct: {
          productId: template.freeProduct,
          weight: template.freeWeight
        },
        startTime: now,
        endTime: endTime,
        isActive: true
      });

      comboOffers.push(comboOffer);
    }

    console.log(`Reset to ${comboOffers.length} combo offers`);
    return comboOffers;
  } catch (err) {
    console.error("Error resetting combo offers:", err);
    return [];
  }
};

module.exports = {
  createComboOffers,
  getActiveComboOffers,
  expireOldComboOffers,
  getComboOffersWithTimeRemaining,
  createSpecificComboOffer,
  resetComboOffers
};