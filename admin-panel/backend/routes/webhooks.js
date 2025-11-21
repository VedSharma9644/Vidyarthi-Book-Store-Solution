const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// POST /api/webhooks/shiprocket - Handle Shiprocket webhook for order status updates
router.post('/shiprocket', orderController.handleShiprocketWebhook);

module.exports = router;

