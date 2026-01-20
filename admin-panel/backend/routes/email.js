const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');

// GET /api/email/config - Get email configuration (protected)
router.get('/config', authenticate, emailController.getEmailConfig);

// POST /api/email/config - Save email configuration (protected)
router.post('/config', authenticate, emailController.saveEmailConfig);

// POST /api/email/test - Test email configuration (protected)
router.post('/test', authenticate, emailController.testEmailConfig);

// POST /api/email/request-reset - Request password reset (sends OTP)
router.post('/request-reset', emailController.requestPasswordReset);

// POST /api/email/reset-password - Reset password with OTP
router.post('/reset-password', emailController.resetPassword);

module.exports = router;

