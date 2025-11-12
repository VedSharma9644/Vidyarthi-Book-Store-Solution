const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

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

// API Routes
app.use('/api/schools', require('./routes/schools'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/books', require('./routes/books'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/upload', require('./routes/upload'));
// app.use('/api/orders', require('./routes/orders'));

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
});

module.exports = app;

