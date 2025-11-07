const axios = require('axios');

class SMSService {
    constructor() {
        this.twoFactorApiKey = process.env.TWO_FACTOR_API_KEY;
        this.fast2smsAuth = process.env.FAST2SMS_AUTHORIZATION;
        this.twoFactorTemplate = process.env.TWO_FACTOR_TEMPLATE || 'OTP1';
    }

    /**
     * Generate 6-digit OTP
     * @returns {string}
     */
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Generate 5-digit OTP (for Fast2SMS)
     * @returns {string}
     */
    generateOtp5Digit() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    }

    /**
     * Format phone number to +91XXXXXXXXXX
     * @param {string} mobileNumber - 10-digit mobile number
     * @returns {string}
     */
    formatPhoneNumber(mobileNumber) {
        const cleaned = mobileNumber.trim().replace(/^\+91/, '');
        if (!/^\d{10}$/.test(cleaned)) {
            throw new Error('Invalid phone number format. Must be 10 digits.');
        }
        return `+91${cleaned}`;
    }

    /**
     * Send OTP via 2Factor.in (Primary)
     * @param {string} phoneNumber - 10-digit or +91XXXXXXXXXX format
     * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
     */
    async sendOtp2Factor(phoneNumber) {
        try {
            const otp = this.generateOtp();
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            
            if (!this.twoFactorApiKey) {
                throw new Error('2Factor.in API key not configured');
            }

            const url = `https://2factor.in/API/V1/${this.twoFactorApiKey}/SMS/${formattedNumber}/${otp}/${this.twoFactorTemplate}`;
            
            const response = await axios.get(url, {
                timeout: 10000, // 10 seconds timeout
            });
            
            if (response.status === 200) {
                console.log(`OTP sent via 2Factor.in to ${formattedNumber}`);
                return { success: true, otp, provider: '2factor' };
            }
            
            return { success: false, error: 'Failed to send OTP' };
        } catch (error) {
            console.error('2Factor.in Error:', error.message);
            // Fallback to Fast2SMS
            console.log('Falling back to Fast2SMS...');
            return this.sendOtpFast2SMS(phoneNumber);
        }
    }

    /**
     * Send OTP via Fast2SMS (Backup)
     * @param {string} phoneNumber - 10-digit or +91XXXXXXXXXX format
     * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
     */
    async sendOtpFast2SMS(phoneNumber) {
        try {
            const otp = this.generateOtp5Digit();
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            const cleanNumber = formattedNumber.replace(/^\+91/, ''); // Fast2SMS needs 10 digits
            
            if (!this.fast2smsAuth) {
                throw new Error('Fast2SMS authorization not configured');
            }

            const baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
            const url = `${baseUrl}?authorization=${this.fast2smsAuth}&route=otp&variables_values=${otp}&flash=0&numbers=${cleanNumber}`;
            
            const response = await axios.get(url, {
                timeout: 10000, // 10 seconds timeout
            });
            
            if (response.status === 200) {
                console.log(`OTP sent via Fast2SMS to ${formattedNumber}`);
                return { success: true, otp, provider: 'fast2sms' };
            }
            
            return { success: false, error: 'Failed to send OTP' };
        } catch (error) {
            console.error('Fast2SMS Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send OTP (tries 2Factor.in first, falls back to Fast2SMS)
     * @param {string} phoneNumber - 10-digit mobile number
     * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
     */
    async sendOtp(phoneNumber) {
        return this.sendOtp2Factor(phoneNumber);
    }
}

module.exports = new SMSService();


