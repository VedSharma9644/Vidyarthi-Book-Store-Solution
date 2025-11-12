const { db } = require('../config/firebase');

class CartService {
    constructor() {
        this.cartsRef = db.collection('carts');
    }

    /**
     * Get or create cart for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Cart object
     */
    async getOrCreateCart(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Try to get existing cart
            const cartQuery = await this.cartsRef
                .where('userId', '==', userId)
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (!cartQuery.empty) {
                const cartDoc = cartQuery.docs[0];
                const cartData = cartDoc.data();
                const cartId = cartDoc.id;

                // Enrich cart items with bookType if missing
                const items = cartData.items || [];
                let needsUpdate = false;
                const enrichedItems = await Promise.all(
                    items.map(async (item) => {
                        // If bookType is missing, fetch it from the book document
                        if (!item.bookType && item.itemId) {
                            try {
                                const bookDoc = await db.collection('books').doc(item.itemId).get();
                                if (bookDoc.exists) {
                                    const bookData = bookDoc.data();
                                    needsUpdate = true;
                                    return {
                                        ...item,
                                        bookType: bookData.bookType || '',
                                    };
                                }
                            } catch (error) {
                                console.warn(`Error fetching bookType for item ${item.itemId}:`, error.message);
                            }
                        }
                        return item;
                    })
                );

                // Update cart if any items were enriched
                if (needsUpdate) {
                    await this.cartsRef.doc(cartId).update({
                        items: enrichedItems,
                        updatedAt: new Date(),
                    });
                }

                return {
                    id: cartId,
                    ...cartData,
                    items: enrichedItems,
                };
            }

            // Create new cart if doesn't exist
            const newCart = {
                userId: userId,
                items: [],
                totalAmount: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const docRef = await this.cartsRef.add(newCart);
            const newCartDoc = await docRef.get();

            return {
                id: newCartDoc.id,
                ...newCartDoc.data(),
            };
        } catch (error) {
            console.error('Error getting or creating cart:', error);
            throw error;
        }
    }

    /**
     * Update cart item quantity
     * @param {string} userId - User ID
     * @param {string} itemId - Book/item ID
     * @param {number} quantity - Quantity to set
     * @returns {Promise<Object>} Updated cart
     */
    async updateCartItem(userId, itemId, quantity) {
        try {
            const cart = await this.getOrCreateCart(userId);

            // Fetch book details to get price
            const bookDoc = await db.collection('books').doc(itemId).get();
            if (!bookDoc.exists) {
                throw new Error('Book not found');
            }

            const bookData = bookDoc.data();
            const price = bookData.discountPrice || bookData.price || 0;

            // Find existing item in cart
            const items = cart.items || [];
            const itemIndex = items.findIndex(item => item.itemId === itemId);

            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                if (itemIndex !== -1) {
                    items.splice(itemIndex, 1);
                }
            } else {
                // Update or add item
                const cartItem = {
                    itemId: itemId,
                    title: bookData.title || '',
                    author: bookData.author || '',
                    coverImageUrl: bookData.coverImageUrl || '',
                    price: price,
                    quantity: quantity,
                    subtotal: price * quantity,
                    bookType: bookData.bookType || '', // Include bookType to identify textbooks
                };

                if (itemIndex !== -1) {
                    items[itemIndex] = cartItem;
                } else {
                    items.push(cartItem);
                }
            }

            // Calculate total
            const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

            // Update cart
            await this.cartsRef.doc(cart.id).update({
                items: items,
                totalAmount: totalAmount,
                updatedAt: new Date(),
            });

            // Return updated cart
            const updatedCartDoc = await this.cartsRef.doc(cart.id).get();
            return {
                id: updatedCartDoc.id,
                ...updatedCartDoc.data(),
            };
        } catch (error) {
            console.error('Error updating cart item:', error);
            throw error;
        }
    }

    /**
     * Remove item from cart
     * @param {string} userId - User ID
     * @param {string} itemId - Book/item ID to remove
     * @returns {Promise<Object>} Updated cart
     */
    async removeCartItem(userId, itemId) {
        try {
            return await this.updateCartItem(userId, itemId, 0);
        } catch (error) {
            console.error('Error removing cart item:', error);
            throw error;
        }
    }

    /**
     * Get cart count (number of items)
     * @param {string} userId - User ID
     * @returns {Promise<number>} Total quantity of items in cart
     */
    async getCartCount(userId) {
        try {
            const cart = await this.getOrCreateCart(userId);
            const items = cart.items || [];
            
            // Sum up all quantities
            const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            return count;
        } catch (error) {
            console.error('Error getting cart count:', error);
            throw error;
        }
    }

    /**
     * Clear cart (remove all items)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Cleared cart
     */
    async clearCart(userId) {
        try {
            const cart = await this.getOrCreateCart(userId);

            await this.cartsRef.doc(cart.id).update({
                items: [],
                totalAmount: 0,
                updatedAt: new Date(),
            });

            const clearedCartDoc = await this.cartsRef.doc(cart.id).get();
            return {
                id: clearedCartDoc.id,
                ...clearedCartDoc.data(),
            };
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    }
}

module.exports = new CartService();

