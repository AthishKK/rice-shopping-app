const testPremiumUpgrade = async () => {
  try {
    console.log('Testing premium upgrade endpoint...');
    
    // First, let's test if the auth routes are loaded
    const testRoutes = await fetch('http://localhost:5000/api/auth/test', {
      method: 'GET',
    });
    
    console.log('Auth routes test status:', testRoutes.status);
    
    // Test the upgrade endpoint with a fake token
    const response = await fetch('http://localhost:5000/api/auth/upgrade-premium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      }
    });
    
    console.log('Premium upgrade status:', response.status);
    const data = await response.json();
    console.log('Premium upgrade response:', data);
    
  } catch (error) {
    console.error('❌ Error testing premium upgrade:', error.message);
  }
};

testPremiumUpgrade();