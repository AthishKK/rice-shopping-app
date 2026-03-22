const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date() });
});

// Mock auth routes for testing
app.post('/api/auth/signup', (req, res) => {
  console.log('Signup attempt:', req.body);
  res.json({ message: 'Account created successfully' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.json({ 
    message: 'Login successful',
    token: 'mock_token_123',
    user: {
      id: '1',
      fullName: 'Test User',
      email: req.body.email
    }
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Visit: http://localhost:5001/api/test');
});