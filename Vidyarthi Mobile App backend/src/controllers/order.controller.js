const orderService = require('../services/orderService');
const { fulfillCapturedPaymentIfNeeded } = require('../services/capturedPaymentFulfillmentService');
const { orderChannelFromRequest } = require('../utils/orderChannel');
const { mobileStudentNameUpgradeGate } = require('../utils/mobileCheckoutGate');

/**
 * Validate cart for checkout (inventory check only).
 * @route POST /api/orders/validate-cart
 */
const validateCartForCheckout = async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.body.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }
        await orderService.validateCartForCheckout(userId);
        return res.json({
            success: true,
            valid: true,
        });
    } catch (error) {
        if (error.code === 'INSUFFICIENT_STOCK') {
            return res.status(400).json({
                success: false,
                valid: false,
                message: error.message || 'Insufficient stock',
                code: 'INSUFFICIENT_STOCK',
                insufficientBundles: error.insufficientBundles || null,
            });
        }
        if (error.message === 'Cart is empty') {
            return res.status(400).json({
                success: false,
                valid: false,
                message: error.message,
            });
        }
        console.error('Error in validateCartForCheckout:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to validate cart',
        });
    }
};

/**
 * Create order after payment (atomic — same path as webhook / reconciliation).
 * @route POST /api/orders/create
 */
const createOrder = async (req, res) => {
    try {
        console.log('📦 Creating order - Request received:', {
            userId: req.headers['user-id'] || req.body.userId,
            hasPaymentData: !!req.body.paymentData,
            paymentDataKeys: req.body.paymentData ? Object.keys(req.body.paymentData) : [],
        });

        const userId = req.headers['user-id'] || req.body.userId;
        const { paymentData, shippingAddress, orderingStudent } = req.body;
        const orderChannel = orderChannelFromRequest(req);

        if (!userId) {
            console.error('❌ Order creation failed: User ID is missing');
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        if (!paymentData || !paymentData.razorpayOrderId || !paymentData.razorpayPaymentId) {
            console.error('❌ Order creation failed: Payment data is missing or invalid', {
                hasPaymentData: !!paymentData,
                hasOrderId: !!paymentData?.razorpayOrderId,
                hasPaymentId: !!paymentData?.razorpayPaymentId,
            });
            return res.status(400).json({
                success: false,
                message: 'Payment data is required',
            });
        }

        const upgradeGate = mobileStudentNameUpgradeGate(req, {
            orderingStudent,
            shippingAddress,
        });
        if (upgradeGate) {
            return res.status(upgradeGate.status).json(upgradeGate.body);
        }

        console.log(
            `📦 Fulfilling order for user: ${userId}, Razorpay Order: ${paymentData.razorpayOrderId}`
        );

        const result = await fulfillCapturedPaymentIfNeeded({
            razorpayOrderId: paymentData.razorpayOrderId,
            razorpayPaymentId: paymentData.razorpayPaymentId,
            source: 'client',
            razorpaySignature: paymentData.razorpaySignature,
            clientUserId: userId,
            shippingAddress: shippingAddress || null,
            orderingStudent: orderingStudent || null,
            orderChannel,
        });

        if (!result.ok) {
            const reason = result.reason || 'fulfillment_failed';
            if (reason === 'user_mismatch') {
                return res.status(403).json({
                    success: false,
                    message: 'Payment does not belong to this account',
                });
            }
            if (reason.startsWith('payment_not_captured')) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment has not been captured yet',
                });
            }
            if (reason === 'fulfillment_in_progress') {
                return res.status(503).json({
                    success: false,
                    message: 'Order is being created. Please check My Orders in a moment.',
                    code: 'FULFILLMENT_IN_PROGRESS',
                });
            }
            console.error('❌ Order fulfillment failed:', reason);
            return res.status(500).json({
                success: false,
                message: 'Failed to create order',
                reason,
            });
        }

        let orderPayload = result.order;
        if (orderPayload?.id) {
            try {
                const patched = await orderService.patchShippingAddressIfMissing(
                    orderPayload.id,
                    shippingAddress,
                    userId
                );
                if (patched) {
                    orderPayload = patched;
                }
            } catch (patchErr) {
                console.error('patchShippingAddressIfMissing (non-fatal):', patchErr.message);
            }
            try {
                const metaPatched = await orderService.patchOrderCheckoutMetadataIfMissing(
                    orderPayload.id,
                    { orderingStudent, orderChannel, shippingAddress },
                    userId
                );
                if (metaPatched) {
                    orderPayload = metaPatched;
                }
            } catch (metaErr) {
                console.error('patchOrderCheckoutMetadataIfMissing (non-fatal):', metaErr.message);
            }
        }

        const message = result.created ? 'Order created successfully' : 'Order already exists';
        if (result.created) {
            console.log(
                `✅ Order created successfully: ${orderPayload.orderNumber} (${orderPayload.id})`
            );
        } else {
            console.log(
                `✅ Returning existing order: ${orderPayload.orderNumber} (${orderPayload.id})`
            );
        }

        res.json({
            success: true,
            data: orderPayload,
            message,
        });
    } catch (error) {
        if (error.code === 'INSUFFICIENT_STOCK') {
            return res.status(400).json({
                success: false,
                message: error.message || 'Insufficient stock',
                code: 'INSUFFICIENT_STOCK',
                insufficientBundles: error.insufficientBundles || null,
            });
        }
        if (error.code === 'FULFILLMENT_LOCK_TIMEOUT') {
            return res.status(503).json({
                success: false,
                message: 'Order is being created. Please check My Orders in a moment.',
                code: 'FULFILLMENT_IN_PROGRESS',
            });
        }
        console.error('❌ Error in createOrder controller:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order',
        });
    }
};

/**
 * Get user orders
 * @route GET /api/orders
 */
const getOrders = async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;
        const limit = parseInt(req.query.limit) || 50;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const orders = await orderService.getOrdersByUserId(userId, limit);

        res.json({
            success: true,
            data: orders,
            count: orders.length,
        });
    } catch (error) {
        console.error('Error in getOrders controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch orders',
        });
    }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderService.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        console.error('Error in getOrderById controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch order',
        });
    }
};

module.exports = {
    validateCartForCheckout,
    createOrder,
    getOrders,
    getOrderById,
};
