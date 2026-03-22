const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    
    // Test basic connection
    const response = await fetch('http://localhost:5000/', {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running:', data);
      
      // Test auth endpoint
      const authTest = await fetch('http://localhost:5000/api/auth/upgrade-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log('Auth endpoint status:', authTest.status);
      const authData = await authTest.json();
      console.log('Auth response:', authData);
      
    } else {
      console.log('❌ Backend not responding:', response.status);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('Make sure the backend server is running on port 5000');
  }
};

testBackendConnection();