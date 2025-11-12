const paymentService = require('../services/paymentService');

/**
 * Create Razorpay order
 * @route POST /api/payment/create-order
 */
const createOrder = async (req, res) => {
    try {
        const { amount, receipt } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount. Amount must be greater than 0.',
            });
        }

        // Create order
        const order = await paymentService.createOrder(amount, receipt);

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error('Error in createOrder controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order',
        });
    }
};

/**
 * Verify payment
 * @route POST /api/payment/verify-payment
 */
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        // Validate required fields
        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: orderId, paymentId, signature',
            });
        }

        // Verify payment
        const isValid = await paymentService.verifyPayment(orderId, paymentId, signature);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed',
            });
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId,
                paymentId,
            },
        });
    } catch (error) {
        console.error('Error in verifyPayment controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify payment',
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
};

