const { expireOldFlashSales, getFlashSaleSettings, createFlashSale } = require('./flashSaleService');

class FlashSaleScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('Flash sale scheduler is already running');
      return;
    }

    console.log('Starting flash sale scheduler...');
    this.isRunning = true;

    // Check every minute for expired flash sales
    this.intervalId = setInterval(async () => {
      try {
        await this.checkAndRotateFlashSales();
      } catch (error) {
        console.error('Error in flash sale scheduler:', error);
      }
    }, 60000); // Check every minute

    // Initial check
    setTimeout(() => {
      this.checkAndRotateFlashSales();
    }, 5000); // Initial check after 5 seconds
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Flash sale scheduler stopped');
  }

  // Check for expired flash sales and create new ones if auto-rotation is enabled
  async checkAndRotateFlashSales() {
    try {
      // Check if there are expired flash sales
      const expiredCount = await expireOldFlashSales();
      
      if (expiredCount > 0) {
        console.log(`Flash sale scheduler: ${expiredCount} flash sales expired`);
        
        // Get settings to check if auto-rotation is enabled
        const settings = await getFlashSaleSettings();
        
        if (settings.autoRotationEnabled) {
          console.log('Auto-rotation enabled, creating new flash sale...');
          
          // Wait a bit to ensure cleanup is complete
          setTimeout(async () => {
            try {
              const newFlashSale = await createFlashSale(settings.rotationIntervalHours, false);
              if (newFlashSale) {
                console.log('New flash sale created automatically');
              } else {
                console.log('Failed to create new flash sale automatically');
              }
            } catch (error) {
              console.error('Error creating automatic flash sale:', error);
            }
          }, 3000);
        } else {
          console.log('Auto-rotation disabled, not creating new flash sale');
        }
      }
    } catch (error) {
      console.error('Error in checkAndRotateFlashSales:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    };
  }
}

// Create singleton instance
const flashSaleScheduler = new FlashSaleScheduler();

module.exports = flashSaleScheduler;