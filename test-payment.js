const fetch = require('node-fetch');

async function testPaymentEndpoint() {
  try {
    console.log('Testing payment endpoint...');
    
    // Test the test route first
    const testResponse = await fetch('http://localhost:5001/api/payment/test');
    console.log('Test route status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.text();
      console.log('Test route response:', testData);
    } else {
      console.log('Test route failed');
      const errorText = await testResponse.text();
      console.log('Error response:', errorText);
    }
    
    // Test the main API health
    const healthResponse = await fetch('http://localhost:5001/');
    console.log('Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('Health response:', healthData);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testPaymentEndpoint();