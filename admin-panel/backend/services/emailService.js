const nodemailer = require('nodemailer');
const { db } = require('../config/database');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Get email configuration from Firestore
   */
  async getEmailConfig() {
    try {
      const configDoc = await db.collection('admin_config').doc('email').get();
      if (configDoc.exists) {
        return configDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting email config:', error);
      return null;
    }
  }

  /**
   * Save email configuration to Firestore
   */
  async saveEmailConfig(config) {
    try {
      await db.collection('admin_config').doc('email').set({
        ...config,
        updatedAt: new Date(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving email config:', error);
      throw error;
    }
  }

  /**
   * Initialize email transporter with current config
   */
  async initializeTransporter() {
    const config = await this.getEmailConfig();
    
    if (!config || !config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
      throw new Error('Email configuration is incomplete. Please configure email settings first.');
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: config.smtpPort === '465' || config.smtpSecure === true, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    // Verify connection
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (error) {
      console.error('❌ Email server connection failed:', error);
      throw new Error('Failed to connect to email server. Please check your email configuration.');
    }

    return this.transporter;
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(toEmail, otp) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const config = await this.getEmailConfig();
      const fromEmail = config.fromEmail || config.smtpUser;

      const mailOptions = {
        from: `"Admin Panel" <${fromEmail}>`,
        to: toEmail,
        subject: 'Password Reset OTP - Admin Panel',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You have requested to reset your admin panel password.</p>
            <p>Your OTP (One-Time Password) is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4e73df; font-size: 32px; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
          </div>
        `,
        text: `Your password reset OTP is: ${otp}. This OTP will expire in 10 minutes.`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(testEmail) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const config = await this.getEmailConfig();
      const fromEmail = config.fromEmail || config.smtpUser;

      const mailOptions = {
        from: `"Admin Panel" <${fromEmail}>`,
        to: testEmail,
        subject: 'Test Email - Admin Panel Configuration',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Configuration Test</h2>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p>If you received this email, your email settings are configured properly!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">This is an automated test email.</p>
          </div>
        `,
        text: 'This is a test email to verify your email configuration is working correctly.',
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();

