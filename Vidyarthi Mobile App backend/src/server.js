require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Firebase (import to trigger initialization)
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/auth.routes');
const schoolRoutes = require('./routes/school.routes');
const gradeRoutes = require('./routes/grade.routes');
const categoryRoutes = require('./routes/category.routes');
const bookRoutes = require('./routes/book.routes');
const cartRoutes = require('./routes/cart.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/cart', cartRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server - bind to 0.0.0.0 to accept connections from network
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 Auth API: http://localhost:${PORT}/api/auth/test`);
    console.log(`🌐 Network access: http://192.168.1.36:${PORT}/health`);
});

module.exports = app;

