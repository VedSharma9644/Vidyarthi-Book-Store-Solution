const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/firebase');

class PaymentService {
    constructor() {
        // Razorpay client will be initialized after fetching config from Firestore
        this.razorpay = null;
        this.cachedConfigKey = null; // Track the current API key to detect config changes
    }

    /**
     * Get Razorpay configuration from Firestore
     * @returns {Promise<Object>} Config with ApiKey and SecretKey
     */
    async getPaymentGatewayConfig() {
        try {
            const configSnapshot = await db.collection('paymentGatewayConfigs')
                .where('gatewayName', '==', 'Razorpay')
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (configSnapshot.empty) {
                // Fallback to environment variables if not found in Firestore
                return {
                    apiKey: process.env.RAZORPAY_KEY_ID || '',
                    secretKey: process.env.RAZORPAY_KEY_SECRET || '',
                };
            }

            const configDoc = configSnapshot.docs[0];
            const configData = configDoc.data();

            return {
                apiKey: configData.apiKey || process.env.RAZORPAY_KEY_ID || '',
                secretKey: configData.secretKey || process.env.RAZORPAY_KEY_SECRET || '',
            };
        } catch (error) {
            console.error('Error fetching payment gateway config:', error);
            // Fallback to environment variables on error
            return {
                apiKey: process.env.RAZORPAY_KEY_ID || '',
                secretKey: process.env.RAZORPAY_KEY_SECRET || '',
            };
        }
    }

    /**
     * Initialize Razorpay client with config
     * Reinitializes if config has changed
     * @returns {Promise<Razorpay>} Razorpay client instance
     */
    async getRazorpayClient() {
        const config = await this.getPaymentGatewayConfig();
        
        // Reinitialize if client doesn't exist or config has changed
        if (!this.razorpay || this.cachedConfigKey !== config.apiKey) {
            console.log('Initializing Razorpay client with key:', config.apiKey.substring(0, 10) + '...');
            this.razorpay = new Razorpay({
                key_id: config.apiKey,
                key_secret: config.secretKey,
            });
            this.cachedConfigKey = config.apiKey; // Store current key for comparison
        }
        return this.razorpay;
    }

    /**
     * Create a Razorpay order
     * @param {number} amount - Amount in INR (will be converted to paise)
     * @param {string} receipt - Receipt ID for the order
     * @returns {Promise<Object>} Order details
     */
    async createOrder(amount, receipt) {
        try {
            // Get Razorpay client (will fetch config from Firestore)
            const razorpay = await this.getRazorpayClient();
            const config = await this.getPaymentGatewayConfig();

            // Convert amount to paise (1 INR = 100 paise)
            const amountInPaise = Math.round(amount * 100);

            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: receipt || `receipt_${Date.now()}`,
                payment_capture: 1, // Auto-capture payment
            };

            const order = await razorpay.orders.create(options);

            return {
                success: true,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                keyId: config.apiKey, // Return key ID for frontend
            };
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw new Error(`Failed to create order: ${error.message}`);
        }
    }

    /**
     * Verify payment signature
     * @param {string} orderId - Razorpay order ID
     * @param {string} paymentId - Razorpay payment ID
     * @param {string} signature - Payment signature from Razorpay
     * @returns {Promise<boolean>} True if signature is valid
     */
    async verifyPayment(orderId, paymentId, signature) {
        try {
            // Get Razorpay client and config
            const razorpay = await this.getRazorpayClient();
            const config = await this.getPaymentGatewayConfig();

            // Generate expected signature
            const data = `${orderId}|${paymentId}`;
            const secret = config.secretKey;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(data)
                .digest('hex');

            // Compare signatures
            if (expectedSignature !== signature) {
                console.error('Payment signature verification failed');
                return false;
            }

            // Verify payment status with Razorpay API
            const payment = await razorpay.payments.fetch(paymentId);
            
            if (payment.status !== 'captured') {
                console.error('Payment not captured. Status:', payment.status);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error verifying payment:', error);
            return false;
        }
    }
}

module.exports = new PaymentService();

