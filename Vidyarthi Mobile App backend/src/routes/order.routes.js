const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

/**
 * @route   POST /api/orders/create
 * @desc    Create order after payment
 * @access  Private (requires user-id header)
 * @body    { paymentData: { razorpayOrderId, razorpayPaymentId, razorpaySignature }, shippingAddress?: object }
 */
router.post('/create', orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Get user orders
 * @access  Private (requires user-id header)
 * @query   limit?: number
 */
router.get('/', orderController.getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', orderController.getOrderById);

module.exports = router;

