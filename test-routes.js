// Test if admin routes are mounted correctly
const API_URL = 'http://localhost:5001/api';

async function testRoutes() {
  try {
    // Test basic admin route
    const response = await fetch(`${API_URL}/admin/dashboard`);
    console.log('Admin dashboard status:', response.status);
    
    // Test if admin routes exist at all
    const response2 = await fetch(`${API_URL}/admin`);
    console.log('Admin base route status:', response2.status);
    
  } catch (error) {
    console.error('Route test failed:', error.message);
  }
}

testRoutes();