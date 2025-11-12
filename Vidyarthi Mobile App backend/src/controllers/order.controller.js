const orderService = require('../services/orderService');

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

        console.log(`📦 Creating order for user: ${userId}, Razorpay Order: ${paymentData.razorpayOrderId}`);
        const order = await orderService.createOrder(userId, paymentData, shippingAddress);
        console.log(`✅ Order created successfully: ${order.orderNumber} (${order.id})`);

        res.json({
            success: true,
            data: order,
            message: 'Order created successfully',
        });
    } catch (error) {
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
    createOrder,
    getOrders,
    getOrderById,
};

