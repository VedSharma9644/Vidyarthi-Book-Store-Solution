const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

/**
 * @route   POST /api/payment/create-order
 * @desc    Create Razorpay order
 * @access  Public
 * @body    { amount: number, receipt?: string }
 */
router.post('/create-order', paymentController.createOrder);

/**
 * @route   POST /api/payment/verify-payment
 * @desc    Verify Razorpay payment
 * @access  Public
 * @body    { orderId: string, paymentId: string, signature: string }
 */
router.post('/verify-payment', paymentController.verifyPayment);

module.exports = router;

