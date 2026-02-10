const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

/**
 * @route   GET /api/cart/getcart
 * @desc    Get user's cart
 * @access  Public (requires user-id header)
 * @header  { user-id: string }
 */
router.get('/getcart', cartController.getCart);

/**
 * @route   GET /api/cart/count
 * @desc    Get cart item count
 * @access  Public (requires user-id header)
 * @header  { user-id: string }
 * @note    Must be before /:itemId route
 */
router.get('/count', cartController.getCartCount);

/**
 * @route   POST /api/cart/update
 * @desc    Update cart item quantity
 * @access  Public (requires user-id header)
 * @header  { user-id: string }
 * @body    { itemId: string, quantity: number }
 */
router.post('/update', cartController.updateCartItem);

/**
 * @route   POST /api/cart/add-items
 * @desc    Add multiple items to cart (replaces cart). Single request for fast add.
 * @access  Public (requires user-id header)
 * @header  { user-id: string }
 * @body    { items: [{ itemId: string, quantity: number }, ...] }
 */
router.post('/add-items', cartController.addItemsToCart);

/**
 * @route   POST /api/cart/clear
 * @desc    Clear all items from cart
 * @access  Public (requires user-id header)
 * @header  { user-id: string }
 */
router.post('/clear', cartController.clearCart);

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Public (requires user-id header)
 * @header  { user-id: string }
 * @note    Must be last to avoid catching /count or /getcart
 */
router.delete('/:itemId', cartController.removeCartItem);

module.exports = router;

