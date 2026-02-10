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
                        if ((!item.bookType || item.productQuantity == null) && item.itemId) {
                            try {
                                const bookDoc = await db.collection('books').doc(item.itemId).get();
                                if (bookDoc.exists) {
                                    const bookData = bookDoc.data();
                                    needsUpdate = true;
                                    const productQuantity = parseInt(bookData.productQuantity, 10) || 1;
                                    return {
                                        ...item,
                                        bookType: item.bookType || bookData.bookType || '',
                                        productQuantity: item.productQuantity != null ? item.productQuantity : productQuantity,
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
            const price = bookData.price || 0;

            // Inventory check: when adding/updating quantity, ensure sufficient stock.
            // If product has productQuantity (e.g. 4 pens per bundle), ordering 1 bundle consumes 4 units.
            if (quantity > 0) {
                const stockQuantity = parseInt(bookData.stockQuantity, 10) || 0;
                const unitsPerOrder = parseInt(bookData.productQuantity, 10) || 1;
                const requiredUnits = quantity * unitsPerOrder;
                if (stockQuantity < requiredUnits) {
                    const availableBundles = Math.floor(stockQuantity / unitsPerOrder);
                    const err = new Error(
                        availableBundles === 0
                            ? 'This item is out of stock.'
                            : `Only ${availableBundles} bundle(s) available (need ${unitsPerOrder} unit(s) per bundle).`
                    );
                    err.code = 'INSUFFICIENT_STOCK';
                    err.bookType = bookData.bookType || 'OTHER';
                    throw err;
                }
            }

            // Find existing item in cart
            const items = cart.items || [];
            const itemIndex = items.findIndex(item => item.itemId === itemId);

            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                if (itemIndex !== -1) {
                    items.splice(itemIndex, 1);
                }
            } else {
                // Update or add item (productQuantity = units per bundle, e.g. 3 pens per bundle)
                const productQuantity = parseInt(bookData.productQuantity, 10) || 1;
                const cartItem = {
                    itemId: itemId,
                    title: bookData.title || '',
                    author: bookData.author || '',
                    coverImageUrl: bookData.coverImageUrl || '',
                    price: price,
                    quantity: quantity,
                    productQuantity: productQuantity,
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
     * Add multiple items to cart in one go (replaces existing cart items).
     * Validates stock for all items before writing; on first stock failure returns INSUFFICIENT_STOCK.
     * @param {string} userId - User ID
     * @param {Array<{ itemId: string, quantity: number }>} items - Items to add
     * @returns {Promise<Object>} { cart, addedCount } or throws with code INSUFFICIENT_STOCK
     */
    async addItemsToCart(userId, items) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Items array is required and must not be empty');
        }

        const cart = await this.getOrCreateCart(userId);
        const booksRef = db.collection('books');

        // Fetch all books in parallel and validate stock
        const itemSpecs = await Promise.all(
            items.map(async ({ itemId, quantity }) => {
                const qty = parseInt(quantity, 10) || 1;
                const bookDoc = await booksRef.doc(itemId).get();
                if (!bookDoc.exists) {
                    const err = new Error('Book not found');
                    err.itemId = itemId;
                    throw err;
                }
                const bookData = bookDoc.data();
                const stockQuantity = parseInt(bookData.stockQuantity, 10) || 0;
                const unitsPerOrder = parseInt(bookData.productQuantity, 10) || 1;
                const requiredUnits = qty * unitsPerOrder;
                if (stockQuantity < requiredUnits) {
                    const availableBundles = Math.floor(stockQuantity / unitsPerOrder);
                    const err = new Error(
                        availableBundles === 0
                            ? 'This item is out of stock.'
                            : `Only ${availableBundles} bundle(s) available (need ${unitsPerOrder} unit(s) per bundle).`
                    );
                    err.code = 'INSUFFICIENT_STOCK';
                    err.bookType = bookData.bookType || 'OTHER';
                    throw err;
                }
                return {
                    itemId,
                    quantity: qty,
                    bookData,
                    productQuantity: unitsPerOrder,
                };
            })
        );

        const cartItems = itemSpecs.map(({ itemId, quantity, bookData, productQuantity }) => {
            const price = bookData.price || 0;
            return {
                itemId,
                title: bookData.title || '',
                author: bookData.author || '',
                coverImageUrl: bookData.coverImageUrl || '',
                price,
                quantity,
                productQuantity,
                subtotal: price * quantity,
                bookType: bookData.bookType || '',
            };
        });

        const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

        await this.cartsRef.doc(cart.id).update({
            items: cartItems,
            totalAmount,
            updatedAt: new Date(),
        });

        const updatedCartDoc = await this.cartsRef.doc(cart.id).get();
        return {
            cart: {
                id: updatedCartDoc.id,
                ...updatedCartDoc.data(),
            },
            addedCount: cartItems.length,
        };
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

