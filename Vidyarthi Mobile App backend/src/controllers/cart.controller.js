const cartService = require('../services/cartService');

/**
 * Get user's cart
 * @route GET /api/cart/getcart
 */
const getCart = async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const cart = await cartService.getOrCreateCart(userId);

        res.json({
            success: true,
            data: cart,
        });
    } catch (error) {
        console.error('Error in getCart controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart',
            error: error.message,
        });
    }
};

/**
 * Update cart item quantity
 * @route POST /api/cart/update
 */
const updateCartItem = async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.body.userId;
        const { itemId, quantity } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: 'Item ID is required',
            });
        }

        const quantityNum = parseInt(quantity) || 1;
        if (quantityNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be 0 or greater',
            });
        }

        const cart = await cartService.updateCartItem(userId, itemId, quantityNum);

        res.json({
            success: true,
            message: 'Cart updated successfully',
            data: cart,
        });
    } catch (error) {
        console.error('Error in updateCartItem controller:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update cart',
            error: error.message,
        });
    }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/:itemId
 */
const removeCartItem = async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;
        const { itemId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: 'Item ID is required',
            });
        }

        const cart = await cartService.removeCartItem(userId, itemId);

        res.json({
            success: true,
            message: 'Item removed from cart',
            data: cart,
        });
    } catch (error) {
        console.error('Error in removeCartItem controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error.message,
        });
    }
};

/**
 * Get cart count (total number of items)
 * @route GET /api/cart/count
 */
const getCartCount = async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.query.userId;

        // If no user ID, return 0 count (user not logged in)
        if (!userId) {
            return res.json({
                success: true,
                count: 0,
            });
        }

        const count = await cartService.getCartCount(userId);

        res.json({
            success: true,
            count: count,
        });
    } catch (error) {
        console.error('Error in getCartCount controller:', error);
        // Return 0 count on error instead of failing
        res.json({
            success: true,
            count: 0,
        });
    }
};

/**
 * Clear cart (remove all items)
 * @route POST /api/cart/clear
 */
const clearCart = async (req, res) => {
    try {
        const userId = req.headers['user-id'] || req.body.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const cart = await cartService.clearCart(userId);

        res.json({
            success: true,
            message: 'Cart cleared successfully',
            data: cart,
        });
    } catch (error) {
        console.error('Error in clearCart controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message,
        });
    }
};

module.exports = {
    getCart,
    updateCartItem,
    removeCartItem,
    getCartCount,
    clearCart,
};

