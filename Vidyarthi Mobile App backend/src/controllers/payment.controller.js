const paymentService = require('../services/paymentService');
const paymentCheckoutAttemptService = require('../services/paymentCheckoutAttemptService');
const { orderChannelFromRequest } = require('../utils/orderChannel');
const { mobileStudentNameUpgradeGate } = require('../utils/mobileCheckoutGate');
const { buildRazorpayCheckoutNotes } = require('../utils/checkoutMetadata');

/**
 * Create Razorpay order
 * @route POST /api/payment/create-order
 */
const createOrder = async (req, res) => {
    try {
        const { amount, receipt, orderingStudent, cartSnapshot, shippingAddress } = req.body;
        const userId = req.headers['user-id'] || req.body.userId;
        const orderChannel = orderChannelFromRequest(req);

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount. Amount must be greater than 0.',
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required for checkout',
            });
        }

        const upgradeGate = mobileStudentNameUpgradeGate(req, {
            orderingStudent,
            shippingAddress,
        });
        if (upgradeGate) {
            return res.status(upgradeGate.status).json(upgradeGate.body);
        }

        if (orderChannel === 'website') {
            const studentName =
                (orderingStudent?.name && String(orderingStudent.name).trim()) ||
                (shippingAddress?.studentName && String(shippingAddress.studentName).trim());
            if (!studentName) {
                return res.status(400).json({
                    success: false,
                    message: 'Student name is required for website checkout',
                });
            }
        }

        const rzNotes = buildRazorpayCheckoutNotes({
            userId: String(userId),
            orderChannel,
            orderingStudent,
            shippingAddress,
        });
        const order = await paymentService.createOrder(amount, receipt, rzNotes);

        if (!order?.orderId) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment order',
            });
        }

        await paymentCheckoutAttemptService.recordAttempt({
            razorpayOrderId: order.orderId,
            userId: String(userId),
            amountInr: Number(amount),
            receipt: receipt || '',
            orderingStudent: orderingStudent || null,
            cartSnapshot: cartSnapshot || null,
            shippingAddress: shippingAddress || null,
            orderChannel,
        });

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

