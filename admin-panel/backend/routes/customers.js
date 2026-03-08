const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// GET /api/customers - Get all customers
router.get('/', customerController.getAllCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', customerController.getCustomerById);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;

