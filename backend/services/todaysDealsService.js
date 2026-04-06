const TodaysDeal = require('../models/TodaysDeal');

// Available deal configurations
const DEAL_CONFIGS = [
  { productId: 1, weight: 5, age: "1 year" },
  { productId: 3, weight: 3, age: "2 years" },
  { productId: 5, weight: 2, age: "1 year" },
  { productId: 7, weight: 4, age: "6 months" },
  { productId: 2, weight: 3, age: "1 year" },
  { productId: 8, weight: 2, age: "2 years" },
  { productId: 4, weight: 5, age: "1 year" },
  { productId: 6, weight: 3, age: "1 year" },
  { productId: 9, weight: 4, age: "2 years" },
  { productId: 10, weight: 2, age: "6 months" }
];

// Get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Generate random deals for a specific date
const generateDealsForDate = (dateString) => {
  // Use date as seed for consistent randomization
  const dateNum = new Date(dateString).getTime();
  const seed = dateNum % 1000000;
  
  // Simple seeded random function
  let random = seed;
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  // Shuffle deal configs using seeded random
  const shuffled = [...DEAL_CONFIGS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Select 6 deals
  return shuffled.slice(0, 6).map(config => ({
    ...config,
    extraDiscount: 5 // Always 5% extra discount for today's deals
  }));
};

// Get or create today's deals
const getTodaysDeals = async () => {
  try {
    const todayDate = getTodayDateString();
    
    // Try to find existing deals for today
    let todaysDeals = await TodaysDeal.findOne({ date: todayDate });
    
    if (!todaysDeals) {
      // Generate new deals for today
      const deals = generateDealsForDate(todayDate);
      
      todaysDeals = await TodaysDeal.create({
        date: todayDate,
        deals: deals
      });
      
      console.log(`Generated new today's deals for ${todayDate}:`, deals);
    }
    
    return todaysDeals.deals;
  } catch (error) {
    console.error('Error getting today\'s deals:', error);
    // Fallback to generating deals without database
    return generateDealsForDate(getTodayDateString());
  }
};

// Initialize today's deals (called on server start)
const initializeTodaysDeals = async () => {
  try {
    const deals = await getTodaysDeals();
    console.log('Today\'s deals initialized:', deals.length, 'deals available');
    return deals;
  } catch (error) {
    console.error('Failed to initialize today\'s deals:', error);
    return [];
  }
};

// Clean up old deals (optional, as MongoDB TTL will handle this)
const cleanupOldDeals = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const result = await TodaysDeal.deleteMany({
      date: { $lt: yesterdayString }
    });
    
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} old today's deals`);
    }
  } catch (error) {
    console.error('Error cleaning up old deals:', error);
  }
};

// Get deals for a specific date (for admin/testing purposes)
const getDealsForDate = async (dateString) => {
  try {
    let deals = await TodaysDeal.findOne({ date: dateString });
    
    if (!deals) {
      // Generate deals for the requested date
      const generatedDeals = generateDealsForDate(dateString);
      deals = await TodaysDeal.create({
        date: dateString,
        deals: generatedDeals
      });
    }
    
    return deals.deals;
  } catch (error) {
    console.error(`Error getting deals for date ${dateString}:`, error);
    return generateDealsForDate(dateString);
  }
};

module.exports = {
  getTodaysDeals,
  initializeTodaysDeals,
  cleanupOldDeals,
  getDealsForDate,
  generateDealsForDate
};