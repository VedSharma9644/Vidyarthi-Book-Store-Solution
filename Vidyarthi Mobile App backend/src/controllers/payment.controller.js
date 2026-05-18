const paymentService = require('../services/paymentService');
const paymentCheckoutAttemptService = require('../services/paymentCheckoutAttemptService');

/**
 * Create Razorpay order
 * @route POST /api/payment/create-order
 */
const createOrder = async (req, res) => {
    try {
        const { amount, receipt, orderingStudent, cartSnapshot, shippingAddress } = req.body;
        const userId = req.headers['user-id'] || req.body.userId;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount. Amount must be greater than 0.',
            });
        }

        const rzNotes = userId ? { userId: String(userId) } : null;
        const order = await paymentService.createOrder(amount, receipt, rzNotes);

        // Best-effort: record checkout attempt + cart snapshot for webhook / reconciliation (non-blocking for response)
        if (userId && order?.orderId) {
            try {
                await paymentCheckoutAttemptService.recordAttempt({
                    razorpayOrderId: order.orderId,
                    userId: String(userId),
                    amountInr: Number(amount),
                    receipt: receipt || '',
                    orderingStudent: orderingStudent || null,
                    cartSnapshot: cartSnapshot || null,
                    shippingAddress: shippingAddress || null,
                });
            } catch (e) {
                console.error('paymentCheckoutAttemptService.recordAttempt (non-fatal):', e.message);
            }
        }

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

