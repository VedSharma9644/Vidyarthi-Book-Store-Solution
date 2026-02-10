const orderService = require('../services/orderService');

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
 * Create order after payment
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
        const { paymentData, shippingAddress } = req.body;

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

        // Log shipping address information
        console.log(`📦 Creating order for user: ${userId}, Razorpay Order: ${paymentData.razorpayOrderId}`);
        if (shippingAddress) {
            console.log(`📍 Shipping address provided:`, {
                hasName: !!shippingAddress.name,
                hasPhone: !!shippingAddress.phone,
                hasAddress: !!shippingAddress.address,
                hasCity: !!shippingAddress.city,
                hasState: !!shippingAddress.state,
                hasPostalCode: !!shippingAddress.postalCode,
                hasCountry: !!shippingAddress.country,
            });
        } else {
            console.log(`⚠️ No shipping address provided, will use user's default address`);
        }

        const order = await orderService.createOrder(userId, paymentData, shippingAddress);
        console.log(`✅ Order created successfully: ${order.orderNumber} (${order.id})`);

        res.json({
            success: true,
            data: order,
            message: 'Order created successfully',
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

