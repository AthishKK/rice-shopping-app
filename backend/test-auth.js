// Test both authentication methods
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

async function testAuthentication() {
  console.log('🧪 Testing Authentication System\n');
  
  // Test 1: Regular Signup + Login
  console.log('1️⃣ Testing Regular Signup + Login');
  
  const testUser = {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    password: 'password123',
    confirmPassword: 'password123'
  };
  
  try {
    // Signup
    const signupResponse = await axios.post(`${API_URL}/signup`, testUser);
    console.log('✅ Signup successful:', signupResponse.data.message);
    
    // Login
    const loginResponse = await axios.post(`${API_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.user.fullName);
    
  } catch (error) {
    console.log('❌ Regular auth failed:', error.response?.data?.message || error.message);
  }
  
  // Test 2: Google Login (Mock)
  console.log('\n2️⃣ Testing Google Login (Mock)');
  
  try {
    const googleResponse = await axios.post(`${API_URL}/google`, {
      credential: 'mock_google_token'
    });
    console.log('✅ Google login successful:', googleResponse.data.user.fullName);
    
  } catch (error) {
    console.log('❌ Google auth failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('• Regular Login: Use signup first, then login with email/password');
  console.log('• Google Login: Click "Continue with Google" button (auto-creates account)');
  console.log('• Cannot mix: Google email + random password won\'t work');
}

testAuthentication().catch(console.error);