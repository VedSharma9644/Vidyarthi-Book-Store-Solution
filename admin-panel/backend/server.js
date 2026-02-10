const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Load dotenv with explicit path FIRST, before anything else
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Log environment variables immediately after loading
console.log('🔍 Environment Variables Loaded:');
console.log(`   SHIPROCKET_EMAIL: ${process.env.SHIPROCKET_EMAIL ? '✅ Set (' + process.env.SHIPROCKET_EMAIL.substring(0, 5) + '...)' : '❌ Missing'}`);
console.log(`   SHIPROCKET_PASSWORD: ${process.env.SHIPROCKET_PASSWORD ? '✅ Set' : '❌ Missing'}`);

const app = express();
// Cloud Run and App Engine use PORT environment variable (default 8080)
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'https://admin-panel-frontend-594708558503.us-central1.run.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Admin Panel Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check environment variables (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/env', (req, res) => {
    res.json({
      SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL ? 'Set (' + process.env.SHIPROCKET_EMAIL.substring(0, 5) + '...)' : 'Missing',
      SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD ? 'Set (hidden)' : 'Missing',
      SHIPROCKET_PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse (default)',
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
  });

  // Test Shiprocket authentication endpoint
  app.post('/debug/test-shiprocket-auth', async (req, res) => {
    try {
      const shiprocketService = require('./services/shiprocketService');
      const token = await shiprocketService.getAuthToken();
      res.json({
        success: true,
        message: 'Authentication successful',
        tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        error: error.stack,
      });
    }
  });
}

// Authentication routes (public - no auth required)
app.use('/api/auth', require('./routes/auth'));

// Email routes (public for password reset, protected for config)
app.use('/api/email', require('./routes/email'));

// Import authentication middleware
const { authenticate } = require('./middleware/auth');

// Protected API Routes (require authentication)
app.use('/api/schools', authenticate, require('./routes/schools'));
app.use('/api/categories', authenticate, require('./routes/categories'));
app.use('/api/books', authenticate, require('./routes/books'));
app.use('/api/customers', authenticate, require('./routes/customers'));
app.use('/api/grades', authenticate, require('./routes/grades'));
app.use('/api/subgrades', authenticate, require('./routes/subgrades'));
app.use('/api/upload', authenticate, require('./routes/upload'));
app.use('/api/orders', authenticate, require('./routes/orders'));
app.use('/api/webhooks', require('./routes/webhooks')); // Webhooks may need to be public for external services

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Start server - Cloud Run requires binding to 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log environment variables status on startup (for debugging)
  console.log('\n📋 Environment Variables Check:');
  console.log(`   SHIPROCKET_EMAIL: ${process.env.SHIPROCKET_EMAIL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SHIPROCKET_PASSWORD: ${process.env.SHIPROCKET_PASSWORD ? '✅ Set' : '❌ Missing'}`);
  console.log(`   FIREBASE_SERVICE_ACCOUNT_PATH: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'Not set'}`);
});

module.exports = app;

