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

            // Save new OTP to Firestore (always string so verify query matches)
            const otpStr = String(otp).trim();
            await this.otpsRef.add({
                mobileNumber: String(phoneNumber).trim(),
                otp: otpStr,
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
     * @param {object} options - { consume: true } to delete OTP after verify (default). Use consume: false when login returns "user not found" so the same OTP can be used for register.
     * @returns {Promise<boolean>} - true if valid, false otherwise
     */
    async verifyOtp(phoneNumber, otp, options = {}) {
        const consume = options.consume !== false;
        const phoneStr = String(phoneNumber).trim();
        const otpStr = String(otp).trim();
        try {
            const snapshot = await this.otpsRef
                .where('mobileNumber', '==', phoneStr)
                .where('otp', '==', otpStr)
                .limit(1)
                .get();

            if (snapshot.empty) {
                console.log(`❌ No OTP found for ${phoneStr} (otp length ${otpStr.length})`);
                return false;
            }

            const otpDoc = snapshot.docs[0];
            const otpData = otpDoc.data();

            const now = Timestamp.now();
            const expiryTime = otpData.expiryDateTime;

            if (expiryTime.toMillis() < now.toMillis()) {
                console.log(`❌ OTP expired for ${phoneStr}`);
                await otpDoc.ref.delete();
                return false;
            }

            if (consume) {
                await otpDoc.ref.delete();
                console.log(`✅ OTP verified and consumed for ${phoneStr}`);
            } else {
                console.log(`✅ OTP verified (not consumed) for ${phoneStr}`);
            }
            return true;
        } catch (error) {
            console.error('Error verifying OTP from Firestore:', error);
            return false;
        }
    }
}

module.exports = new OTPStorage();

