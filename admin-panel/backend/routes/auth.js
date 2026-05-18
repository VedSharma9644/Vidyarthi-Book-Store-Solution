const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const {
  createSession,
  removeSession,
  ADMIN_USERNAME,
  getAdminPassword,
  authenticate,
} = require('../middleware/auth');

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

/**
 * @route   POST /api/auth/change-password
 * @desc    Update admin password (must know current password)
 * @access  Private (session)
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const adminPassword = await getAdminPassword();
    if (currentPassword !== adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password',
      });
    }

    await db.collection('admin_config').doc('credentials').set(
      {
        password: newPassword,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log('✅ Admin password changed via change-password');

    res.json({
      success: true,
      message: 'Password updated successfully. Please sign in again with your new password.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password. Please try again.',
    });
  }
});

module.exports = router;

