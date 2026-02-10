const { db } = require('../config/firebase');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const cartService = require('./cartService');
const userService = require('./userService');

/** Book types that are mandatory: if out of stock, entire grade order is blocked */
const MANDATORY_BOOK_TYPES = ['TEXTBOOK', 'MANDATORY_NOTEBOOK'];

/**
 * Throws an inventory error for order creation (mandatory vs optional bundles).
 * @param {Array<{ itemId: string, bookType: string }>} insufficientItems - Items with insufficient stock
 */
function throwInventoryError(insufficientItems) {
    const hasMandatory = insufficientItems.some(
        (item) => MANDATORY_BOOK_TYPES.includes((item.bookType || '').toUpperCase())
    );
    const optionalBundles = [
        ...new Set(
            insufficientItems
                .filter((item) => !MANDATORY_BOOK_TYPES.includes((item.bookType || '').toUpperCase()))
                .map((item) => item.bookType || 'OTHER')
        ),
    ];

    const err = new Error();
    err.code = 'INSUFFICIENT_STOCK';
    if (hasMandatory) {
        err.message =
            'This grade cannot be ordered at the moment due to insufficient stock for required items.';
        err.insufficientBundles = null; // whole grade blocked
    } else {
        err.message =
            optionalBundles.length > 0
                ? `Insufficient stock. Please uncheck: ${optionalBundles.join(', ')}.`
                : 'Insufficient stock for some items.';
        err.insufficientBundles = optionalBundles;
    }
    throw err;
}

class OrderService {
    constructor() {
        this.ordersRef = db.collection('orders');
        this.booksRef = db.collection('books');
        this.cartsRef = db.collection('carts');
    }

    /**
     * Validate cart for checkout (inventory check only; does not create order or modify data).
     * @param {string} userId - User ID
     * @returns {Promise<{ valid: boolean }>} { valid: true } or throws INSUFFICIENT_STOCK
     */
    async validateCartForCheckout(userId) {
        const cart = await cartService.getOrCreateCart(userId);
        if (!cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }
        const insufficientItems = [];
        for (const item of cart.items) {
            const bookDoc = await this.booksRef.doc(item.itemId).get();
            if (!bookDoc.exists) {
                insufficientItems.push({ itemId: item.itemId, bookType: 'OTHER' });
                continue;
            }
            const bookData = bookDoc.data();
            const stockQuantity = parseInt(bookData.stockQuantity, 10) || 0;
            const cartQty = parseInt(item.quantity, 10) || 1;
            const unitsPerOrder = parseInt(bookData.productQuantity, 10) || 1;
            const requiredUnits = cartQty * unitsPerOrder;
            if (stockQuantity < requiredUnits) {
                insufficientItems.push({
                    itemId: item.itemId,
                    bookType: bookData.bookType || 'OTHER',
                });
            }
        }
        if (insufficientItems.length > 0) {
            throwInventoryError(insufficientItems);
        }
        return { valid: true };
    }

    /**
     * Create a new order from cart (validates inventory, then runs transaction: create order, decrement stock, clear cart).
     * @param {string} userId - User ID
     * @param {object} paymentData - Payment information
     * @param {object} shippingAddress - Shipping address (optional)
     * @returns {Promise<object>} Created order
     */
    async createOrder(userId, paymentData, shippingAddress = null) {
        try {
            // Get user information for order
            const user = await userService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get cart items
            const cart = await cartService.getOrCreateCart(userId);

            if (!cart.items || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Pre-validate inventory (before transaction). Each cart item consumes (quantity * productQuantity) units.
            const insufficientItems = [];
            for (const item of cart.items) {
                const bookDoc = await this.booksRef.doc(item.itemId).get();
                if (!bookDoc.exists) {
                    insufficientItems.push({
                        itemId: item.itemId,
                        bookType: 'OTHER',
                    });
                    continue;
                }
                const bookData = bookDoc.data();
                const stockQuantity = parseInt(bookData.stockQuantity, 10) || 0;
                const cartQty = parseInt(item.quantity, 10) || 1;
                const unitsPerOrder = parseInt(bookData.productQuantity, 10) || 1;
                const requiredUnits = cartQty * unitsPerOrder;
                if (stockQuantity < requiredUnits) {
                    insufficientItems.push({
                        itemId: item.itemId,
                        bookType: bookData.bookType || 'OTHER',
                    });
                }
            }
            if (insufficientItems.length > 0) {
                throwInventoryError(insufficientItems);
            }

            // Calculate totals (subtotal + delivery only; no tax — matches amount customer pays via Razorpay)
            const subtotal = cart.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);

            const deliveryCharge = 300; // Fixed delivery charge
            const tax = 0; // No tax applied; order total = amount paid
            const total = subtotal + deliveryCharge;

            const orderNumber = this.generateOrderNumber();

            // Prepare shipping address
            let finalShippingAddress = null;
            if (shippingAddress) {
                finalShippingAddress = {
                    name: shippingAddress.name || (user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`.trim()
                        : user.firstName || user.userName || 'Customer'),
                    phone: shippingAddress.phone || user.phoneNumber || null,
                    address: shippingAddress.address || null,
                    city: shippingAddress.city || null,
                    state: shippingAddress.state || null,
                    postalCode: shippingAddress.postalCode || null,
                    country: shippingAddress.country || 'India',
                };
                console.log(`✅ Using provided shipping address: ${finalShippingAddress.name}, ${finalShippingAddress.city}`);
            } else if (user.address && (user.address.address || user.address.city)) {
                finalShippingAddress = {
                    name: user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`.trim()
                        : user.firstName || user.userName || 'Customer',
                    phone: user.phoneNumber || null,
                    address: user.address.address || null,
                    city: user.address.city || null,
                    state: user.address.state || null,
                    postalCode: user.address.postalCode || null,
                    country: user.address.country || 'India',
                };
                console.log(`⚠️ Using user's default address: ${finalShippingAddress.city}`);
            } else {
                console.warn(`⚠️ No shipping address available for order ${orderNumber}`);
            }

            const orderData = {
                orderNumber: orderNumber,
                userId: userId,
                customerInfo: {
                    name: user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`.trim()
                        : user.firstName || user.userName || 'Customer',
                    email: user.email || null,
                    phoneNumber: user.phoneNumber || null,
                    schoolName: user.schoolName || null,
                    classStandard: user.classStandard || null,
                },
                items: cart.items.map((item) => ({
                    itemId: item.itemId,
                    title: item.title,
                    author: item.author,
                    coverImageUrl: item.coverImageUrl || '',
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal || (item.price * item.quantity),
                    bookType: item.bookType || '',
                })),
                subtotal: subtotal,
                deliveryCharge: deliveryCharge,
                tax: tax,
                total: total,
                paymentStatus: 'paid',
                orderStatus: 'confirmed',
                deliveryStatus: 'pending',
                razorpayOrderId: paymentData.razorpayOrderId,
                razorpayPaymentId: paymentData.razorpayPaymentId,
                razorpaySignature: paymentData.razorpaySignature,
                shippingAddress: finalShippingAddress,
                trackingNumber: null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Run transaction: re-validate stock, create order, decrement stock, clear cart
            const result = await db.runTransaction(async (transaction) => {
                // Re-read cart inside transaction
                const cartSnap = await transaction.get(this.cartsRef.doc(cart.id));
                if (!cartSnap.exists) {
                    throw new Error('Cart not found');
                }
                const cartItems = cartSnap.data().items || [];
                if (cartItems.length === 0) {
                    throw new Error('Cart is empty');
                }

                // Re-validate stock inside transaction; compute units to decrement per item (quantity * productQuantity)
                const insufficientInTx = [];
                const decrements = []; // { bookRef, unitsToDecrement }
                for (const item of cartItems) {
                    const bookSnap = await transaction.get(this.booksRef.doc(item.itemId));
                    if (!bookSnap.exists) {
                        insufficientInTx.push({ itemId: item.itemId, bookType: 'OTHER' });
                        continue;
                    }
                    const bookData = bookSnap.data();
                    const stockQty = parseInt(bookData.stockQuantity, 10) || 0;
                    const cartQty = parseInt(item.quantity, 10) || 1;
                    const unitsPerOrder = parseInt(bookData.productQuantity, 10) || 1;
                    const requiredUnits = cartQty * unitsPerOrder;
                    if (stockQty < requiredUnits) {
                        insufficientInTx.push({
                            itemId: item.itemId,
                            bookType: bookData.bookType || 'OTHER',
                        });
                    } else {
                        decrements.push({
                            bookRef: this.booksRef.doc(item.itemId),
                            unitsToDecrement: requiredUnits,
                        });
                    }
                }
                if (insufficientInTx.length > 0) {
                    throwInventoryError(insufficientInTx);
                }

                // Create order
                const orderRef = this.ordersRef.doc();
                transaction.set(orderRef, orderData);

                // Decrement stock by (quantity * productQuantity) for each item
                for (const { bookRef, unitsToDecrement } of decrements) {
                    transaction.update(bookRef, {
                        stockQuantity: FieldValue.increment(-unitsToDecrement),
                        updatedAt: new Date(),
                    });
                }

                // Clear cart
                transaction.update(this.cartsRef.doc(cart.id), {
                    items: [],
                    totalAmount: 0,
                    updatedAt: new Date(),
                });

                return { orderId: orderRef.id, orderData };
            });

            const orderId = result.orderId;
            const orderDataResult = result.orderData;

            console.log(`✅ Order saved to Firestore with ID: ${orderId}`);
            console.log(`✅ Stock decremented for ${orderDataResult.items.length} item(s)`);
            console.log(`🛒 Cart cleared for user: ${userId}`);
            console.log(`✅ Order created successfully: ${orderNumber} (${orderId})`);

            return {
                id: orderId,
                ...orderDataResult,
            };
        } catch (error) {
            if (error.code === 'INSUFFICIENT_STOCK') {
                throw error;
            }
            console.error('❌ Error creating order:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                userId: userId,
            });
            throw error;
        }
    }

    /**
     * Get orders for a user
     * @param {string} userId - User ID
     * @param {number} limit - Limit number of results
     * @returns {Promise<Array>} Array of orders
     */
    async getOrdersByUserId(userId, limit = 50) {
        try {
            const snapshot = await this.ordersRef
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });

            return orders;
        } catch (error) {
            console.error('Error getting orders by user ID:', error);
            throw error;
        }
    }

    /**
     * Get order by ID
     * @param {string} orderId - Order ID
     * @returns {Promise<object|null>} Order or null
     */
    async getOrderById(orderId) {
        try {
            const doc = await this.ordersRef.doc(orderId).get();
            
            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data(),
            };
        } catch (error) {
            console.error('Error getting order by ID:', error);
            throw error;
        }
    }

    /**
     * Generate unique order number
     * @returns {string} Order number
     */
    generateOrderNumber() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ORD-${dateStr}-${randomStr}`;
    }
}

module.exports = new OrderService();

