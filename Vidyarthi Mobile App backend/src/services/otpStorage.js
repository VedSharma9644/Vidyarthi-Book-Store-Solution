// OTP Storage using Firebase Firestore
const { db } = require('../config/firebase');
const { OTP_EXPIRY_MINUTES } = require('../config/constants');
const { Timestamp } = require('firebase-admin/firestore');

class OTPStorage {
    constructor() {
        this.rateLimitMap = new Map(); // Track rate limiting (in-memory for speed)
        this.otpsRef = db.collection('otps');
    }

    /**
     * Check rate limit for phone number
     * @param {string} phoneNumber - Phone number in +91XXXXXXXXXX format
     * @returns {boolean} - true if allowed, false if rate limited
     */
    checkRateLimit(phoneNumber) {
        const { OTP_RATE_LIMIT_WINDOW_MS, OTP_RATE_LIMIT_MAX_REQUESTS } = require('../config/constants');
        const now = Date.now();
        const key = phoneNumber;
        
        if (!this.rateLimitMap.has(key)) {
            this.rateLimitMap.set(key, { count: 1, windowStart: now });
            return true;
        }

        const limitData = this.rateLimitMap.get(key);
        const timeSinceWindowStart = now - limitData.windowStart;

        if (timeSinceWindowStart > OTP_RATE_LIMIT_WINDOW_MS) {
            // Reset window
            this.rateLimitMap.set(key, { count: 1, windowStart: now });
            return true;
        }

        if (limitData.count >= OTP_RATE_LIMIT_MAX_REQUESTS) {
            return false;
        }

        limitData.count++;
        return true;
    }

    /**
     * Save OTP for phone number to Firestore
     * @param {string} phoneNumber - Phone number in +91XXXXXXXXXX format
     * @param {string} otp - OTP code
     * @returns {Promise<boolean>} - true if saved, false if rate limited
     */
    async saveOtp(phoneNumber, otp) {
        // Check rate limit
        if (!this.checkRateLimit(phoneNumber)) {
            return false;
        }

        try {
            // Delete existing OTPs for this phone number
            const existingOtps = await this.otpsRef
                .where('mobileNumber', '==', phoneNumber)
                .get();

            const batch = db.batch();
            existingOtps.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            // Calculate expiry time
            const expiryDateTime = new Date();
            expiryDateTime.setMinutes(expiryDateTime.getMinutes() + OTP_EXPIRY_MINUTES);

            // Save new OTP to Firestore
            await this.otpsRef.add({
                mobileNumber: phoneNumber,
                otp: otp,
                expiryDateTime: Timestamp.fromDate(expiryDateTime),
                createdAt: Timestamp.now(),
            });

            console.log(`✅ OTP saved to Firestore for ${phoneNumber}, expires at ${expiryDateTime.toISOString()}`);
            return true;
        } catch (error) {
            console.error('Error saving OTP to Firestore:', error);
            return false;
        }
    }

    /**
     * Verify OTP for phone number from Firestore
     * @param {string} phoneNumber - Phone number in +91XXXXXXXXXX format
     * @param {string} otp - OTP code to verify
     * @returns {Promise<boolean>} - true if valid, false otherwise
     */
    async verifyOtp(phoneNumber, otp) {
        try {
            // Find OTP in Firestore
            const snapshot = await this.otpsRef
                .where('mobileNumber', '==', phoneNumber)
                .where('otp', '==', otp)
                .limit(1)
                .get();

            if (snapshot.empty) {
                console.log(`❌ No OTP found for ${phoneNumber}`);
                return false;
            }

            const otpDoc = snapshot.docs[0];
            const otpData = otpDoc.data();

            // Check expiry
            const now = Timestamp.now();
            const expiryTime = otpData.expiryDateTime;

            if (expiryTime.toMillis() < now.toMillis()) {
                console.log(`❌ OTP expired for ${phoneNumber}`);
                // Delete expired OTP
                await otpDoc.ref.delete();
                return false;
            }

            // OTP verified, delete it
            await otpDoc.ref.delete();
            console.log(`✅ OTP verified successfully for ${phoneNumber}`);
            return true;
        } catch (error) {
            console.error('Error verifying OTP from Firestore:', error);
            return false;
        }
    }
}

module.exports = new OTPStorage();

