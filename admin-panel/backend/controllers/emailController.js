const emailService = require('../services/emailService');
const { db } = require('../config/database');

/**
 * Get email configuration
 */
const getEmailConfig = async (req, res) => {
  try {
    const config = await emailService.getEmailConfig();
    
    if (!config) {
      return res.json({
        success: true,
        data: null,
        message: 'Email configuration not set',
      });
    }

    // Don't send password in response
    const safeConfig = {
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      smtpSecure: config.smtpSecure || false,
      fromEmail: config.fromEmail,
      // Don't include smtpPassword
    };

    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    console.error('Error getting email config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email configuration',
      error: error.message,
    });
  }
};

/**
 * Save email configuration
 */
const saveEmailConfig = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, fromEmail } = req.body;

    // Validate required fields
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      return res.status(400).json({
        success: false,
        message: 'SMTP Host, Port, User, and Password are required',
      });
    }

    const config = {
      smtpHost,
      smtpPort: smtpPort.toString(),
      smtpUser,
      smtpPassword,
      smtpSecure: smtpSecure === true || smtpSecure === 'true',
      fromEmail: fromEmail || smtpUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await emailService.saveEmailConfig(config);

    // Also save admin email for password reset (use fromEmail or smtpUser)
    const { db } = require('../config/database');
    const adminEmail = fromEmail || smtpUser;
    await db.collection('admin_config').doc('credentials').set({
      email: adminEmail,
      updatedAt: new Date(),
    }, { merge: true });

    // Test the configuration
    try {
      await emailService.initializeTransporter();
      res.json({
        success: true,
        message: 'Email configuration saved and verified successfully',
      });
    } catch (testError) {
      // Config saved but test failed
      res.status(400).json({
        success: false,
        message: 'Email configuration saved but connection test failed. Please check your settings.',
        error: testError.message,
      });
    }
  } catch (error) {
    console.error('Error saving email config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save email configuration',
      error: error.message,
    });
  }
};

/**
 * Test email configuration by sending a test email
 */
const testEmailConfig = async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required',
      });
    }

    await emailService.testEmailConfig(testEmail);

    res.json({
      success: true,
      message: 'Test email sent successfully. Please check your inbox.',
    });
  } catch (error) {
    console.error('Error testing email config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
};

/**
 * Request password reset - sends OTP to admin email
 */
const requestPasswordReset = async (req, res) => {
  try {
    // Get admin email from config
    const adminConfigDoc = await db.collection('admin_config').doc('credentials').get();
    if (!adminConfigDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Admin email not configured. Please contact system administrator.',
      });
    }

    const adminConfig = adminConfigDoc.data();
    const adminEmail = adminConfig.email;

    if (!adminEmail) {
      return res.status(404).json({
        success: false,
        message: 'Admin email not configured. Please contact system administrator.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to Firestore
    await db.collection('admin_config').doc('password_reset').set({
      otp,
      otpExpiry,
      email: adminEmail,
      createdAt: new Date(),
    });

    // Send OTP email
    await emailService.sendOTPEmail(adminEmail, otp);

    res.json({
      success: true,
      message: 'OTP has been sent to your registered email address',
      // Don't send email or OTP in response for security
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset OTP',
      error: error.message,
    });
  }
};

/**
 * Verify OTP and reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'OTP and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Get OTP from Firestore
    const resetDoc = await db.collection('admin_config').doc('password_reset').get();
    
    if (!resetDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    const resetData = resetDoc.data();
    const otpExpiry = resetData.otpExpiry?.toDate ? resetData.otpExpiry.toDate() : new Date(resetData.otpExpiry);

    // Check if OTP is expired
    if (new Date() > otpExpiry) {
      // Delete expired OTP
      await db.collection('admin_config').doc('password_reset').delete();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP
    if (resetData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Update admin password
    await db.collection('admin_config').doc('credentials').set({
      password: newPassword,
      updatedAt: new Date(),
    }, { merge: true });

    // Delete OTP after successful reset
    await db.collection('admin_config').doc('password_reset').delete();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

module.exports = {
  getEmailConfig,
  saveEmailConfig,
  testEmailConfig,
  requestPasswordReset,
  resetPassword,
};

