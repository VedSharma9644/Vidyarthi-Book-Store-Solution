const express = require('express');
const router = express.Router();
const { createSession, removeSession, ADMIN_USERNAME, getAdminPassword } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Get admin password from Firestore
    const adminPassword = await getAdminPassword();

    // Check credentials
    if (username === ADMIN_USERNAME && password === adminPassword) {
      // Create session
      const token = createSession();

      console.log(`✅ Admin login successful: ${username}`);

      res.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          username: ADMIN_USERNAME,
        },
      });
    } else {
      console.log(`❌ Admin login failed: Invalid credentials for ${username}`);
      res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Admin logout
 * @access  Private (requires authentication)
 */
router.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7) || 
                  req.cookies?.adminToken || 
                  req.headers['x-admin-token'];

    if (token) {
      removeSession(token);
      console.log('✅ Admin logout successful');
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Private (requires authentication)
 */
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7) || 
                  req.cookies?.adminToken || 
                  req.headers['x-admin-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const { isValidSession } = require('../middleware/auth');
    
    if (isValidSession(token)) {
      res.json({
        success: true,
        message: 'Token is valid',
        user: {
          username: ADMIN_USERNAME,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Token is invalid or expired',
      });
    }
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
    });
  }
});

module.exports = router;

