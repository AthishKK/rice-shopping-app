const mongoose = require('mongoose');
const dns = require('dns');
const { promisify } = require('util');
require('dotenv').config();

const resolveSrv = promisify(dns.resolveSrv);

async function troubleshootMongoDB() {
  console.log('🔍 MongoDB Atlas Connection Troubleshooting\n');
  
  const mongoUri = process.env.MONGODB_URI;
  console.log('📋 Connection String:', mongoUri.replace(/:[^:@]*@/, ':****@'));
  
  // Test 1: DNS Resolution
  console.log('\n1️⃣ Testing DNS Resolution...');
  try {
    const records = await resolveSrv('_mongodb._tcp.cluster0.j8egj2x.mongodb.net');
    console.log('✅ DNS Resolution successful:', records.length, 'records found');
    records.forEach((record, i) => {
      console.log(`   Record ${i + 1}: ${record.name}:${record.port}`);
    });
  } catch (error) {
    console.log('❌ DNS Resolution failed:', error.message);
    console.log('💡 This suggests network/firewall issues');
  }
  
  // Test 2: Alternative Connection Strings
  console.log('\n2️⃣ Testing Alternative Connection Methods...');
  
  const alternativeUris = [
    // Standard connection (non-SRV)
    'mongodb://cluster0-shard-00-00.j8egj2x.mongodb.net:27017,cluster0-shard-00-01.j8egj2x.mongodb.net:27017,cluster0-shard-00-02.j8egj2x.mongodb.net:27017/test?ssl=true&replicaSet=atlas-123abc-shard-0&authSource=admin&retryWrites=true&w=majority',
    
    // With different options
    'mongodb+srv://Athish:9047564020@cluster0.j8egj2x.mongodb.net/ricestore?retryWrites=true&w=majority',
    
    // With SSL disabled (not recommended for production)
    'mongodb+srv://Athish:9047564020@cluster0.j8egj2x.mongodb.net/ricestore?ssl=false'
  ];
  
  for (let i = 0; i < alternativeUris.length; i++) {
    console.log(`\n   Testing URI ${i + 1}...`);
    try {
      await mongoose.connect(alternativeUris[i], { 
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000 
      });
      console.log('✅ Connection successful with alternative URI!');
      await mongoose.disconnect();
      return alternativeUris[i];
    } catch (error) {
      console.log('❌ Failed:', error.message.substring(0, 100) + '...');
      await mongoose.disconnect();
    }
  }
  
  // Test 3: Network connectivity
  console.log('\n3️⃣ Network Connectivity Test...');
  const https = require('https');
  
  return new Promise((resolve) => {
    const req = https.get('https://cloud.mongodb.com', (res) => {
      console.log('✅ Can reach MongoDB Cloud:', res.statusCode);
      resolve(null);
    });
    
    req.on('error', (error) => {
      console.log('❌ Cannot reach MongoDB Cloud:', error.message);
      resolve(null);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Timeout reaching MongoDB Cloud');
      req.destroy();
      resolve(null);
    });
  });
}

// Run troubleshooting
troubleshootMongoDB().then((workingUri) => {
  console.log('\n📊 Troubleshooting Complete');
  
  if (workingUri) {
    console.log('\n✅ Working connection string found!');
    console.log('Update your .env file with:');
    console.log('MONGODB_URI=' + workingUri.replace(/:[^:@]*@/, ':****@'));
  } else {
    console.log('\n❌ No working connection found');
    console.log('\n🛠️  Possible Solutions:');
    console.log('1. Check MongoDB Atlas cluster status');
    console.log('2. Verify network access (IP whitelist)');
    console.log('3. Check firewall/antivirus settings');
    console.log('4. Try different network (mobile hotspot)');
    console.log('5. Contact MongoDB Atlas support');
  }
  
  process.exit(0);
}).catch(console.error);