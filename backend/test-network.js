const mongoose = require('mongoose');
require('dotenv').config();

// Test with different DNS servers
async function testWithDifferentDNS() {
  console.log('🌐 Testing with different DNS configurations...\n');
  
  // Set DNS to Google's public DNS
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  
  console.log('📡 Using Google DNS (8.8.8.8, 8.8.4.4)');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4 // Force IPv4
    });
    
    console.log('✅ SUCCESS! MongoDB connected with Google DNS');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Failed with Google DNS:', error.message.substring(0, 100));
    await mongoose.disconnect();
  }
  
  // Try Cloudflare DNS
  dns.setServers(['1.1.1.1', '1.0.0.1']);
  console.log('\n📡 Using Cloudflare DNS (1.1.1.1, 1.0.0.1)');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4
    });
    
    console.log('✅ SUCCESS! MongoDB connected with Cloudflare DNS');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Failed with Cloudflare DNS:', error.message.substring(0, 100));
    await mongoose.disconnect();
  }
  
  return false;
}

// Test direct IP connection (if we can resolve the IPs)
async function testDirectConnection() {
  console.log('\n🎯 Testing direct IP connection...');
  
  // These are common MongoDB Atlas IPs (may vary)
  const directUri = 'mongodb://cluster0-shard-00-00.j8egj2x.mongodb.net:27017,cluster0-shard-00-01.j8egj2x.mongodb.net:27017,cluster0-shard-00-02.j8egj2x.mongodb.net:27017/test?ssl=true&replicaSet=atlas-123abc-shard-0&authSource=admin&retryWrites=true&w=majority&authMechanism=SCRAM-SHA-1';
  
  try {
    await mongoose.connect(directUri.replace('test?', `test?authSource=admin&ssl=true&username=Athish&password=9047564020&`), {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ SUCCESS! Direct connection worked');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ Direct connection failed:', error.message.substring(0, 100));
    await mongoose.disconnect();
  }
  
  return false;
}

async function runNetworkTests() {
  console.log('🔧 Network Solutions Test\n');
  
  let success = false;
  
  success = await testWithDifferentDNS();
  if (success) return;
  
  success = await testDirectConnection();
  if (success) return;
  
  console.log('\n❌ All network solutions failed');
  console.log('\n🚨 IMMEDIATE ACTIONS TO TRY:');
  console.log('1. 📱 Try mobile hotspot (different network)');
  console.log('2. 🔥 Disable Windows Firewall temporarily');
  console.log('3. 🛡️  Disable antivirus temporarily');
  console.log('4. 🌐 Check if your ISP blocks MongoDB ports');
  console.log('5. 🏢 If on corporate network, contact IT admin');
}

runNetworkTests().catch(console.error);