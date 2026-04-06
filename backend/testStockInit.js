const mongoose = require('mongoose');
const Stock = require('./models/Stock');
const { initializeAllProductStocks } = require('./services/stockInitService');

// Connect to MongoDB
mongoose.connect('mongodb://Athish:athisk123@ac-scgowxi-shard-00-00.j8egj2x.mongodb.net:27017,ac-scgowxi-shard-00-01.j8egj2x.mongodb.net:27017,ac-scgowxi-shard-00-02.j8egj2x.mongodb.net:27017/rice-shopping-app?ssl=true&replicaSet=atlas-oshoz9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testStockInitialization() {
  try {
    console.log('🧪 Testing stock initialization behavior...');
    
    // First, let's set some stocks to low values to test
    console.log('📉 Setting some stocks to low values for testing...');
    
    // Find a few stocks and set them to low values
    const testStocks = await Stock.find({}).limit(5);
    const originalValues = [];
    
    for (let i = 0; i < testStocks.length; i++) {
      const stock = testStocks[i];
      originalValues.push({
        id: stock._id,
        original: stock.quantity
      });
      
      // Set different test values
      const testValues = [10, 25, 60, 0, 45];
      stock.quantity = testValues[i];
      await stock.save();
      
      console.log(`  - Set ${stock.productId} (${stock.ageCategory}, ${stock.weight}) to ${testValues[i]} units`);
    }
    
    console.log('\n🚀 Running initializeAllProductStocks...');
    const result = await initializeAllProductStocks();
    console.log('✅ Result:', result);
    
    console.log('\n📊 Checking updated values...');
    for (const original of originalValues) {
      const updatedStock = await Stock.findById(original.id);
      console.log(`  - Stock ${original.id}: ${original.original} → ${updatedStock.quantity} units`);
    }
    
    // Restore original values
    console.log('\n🔄 Restoring original values...');
    for (const original of originalValues) {
      await Stock.findByIdAndUpdate(original.id, { quantity: original.original });
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testStockInitialization();