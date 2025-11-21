const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// GET /api/orders - Get all orders
router.get('/', orderController.getAllOrders);

// PUT /api/orders/:id/status - Update order status (must be before /:id route)
router.put('/:id/status', orderController.updateOrderStatus);

// POST /api/orders/:id/shiprocket - Create Shiprocket order (must be before /:id route)
router.post('/:id/shiprocket', orderController.createShiprocketOrder);

// GET /api/orders/:id/shiprocket-status - Get Shiprocket order status (must be before /:id route)
router.get('/:id/shiprocket-status', orderController.getShiprocketStatus);

// GET /api/orders/:id - Get order by ID (must be last)
router.get('/:id', orderController.getOrderById);

module.exports = router;

