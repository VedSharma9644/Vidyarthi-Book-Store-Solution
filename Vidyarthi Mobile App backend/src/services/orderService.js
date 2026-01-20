const { db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');
const cartService = require('./cartService');
const userService = require('./userService');

class OrderService {
    constructor() {
        this.ordersRef = db.collection('orders');
    }

    /**
     * Create a new order from cart
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

            // Calculate totals
            const subtotal = cart.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);

            const deliveryCharge = 300; // Fixed delivery charge
            const tax = Math.round(subtotal * 0.10); // 10% tax
            const total = subtotal + deliveryCharge + tax;

            // Generate order number
            const orderNumber = this.generateOrderNumber();

            // Prepare shipping address - use provided address or fallback to user's default address
            let finalShippingAddress = null;
            if (shippingAddress) {
                // Use the provided shipping address
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
                // Fallback to user's default address
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

            // Create order document
            const orderData = {
                orderNumber: orderNumber,
                userId: userId,
                // Customer information
                customerInfo: {
                    name: user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`.trim()
                        : user.firstName || user.userName || 'Customer',
                    email: user.email || null,
                    phoneNumber: user.phoneNumber || null,
                    schoolName: user.schoolName || null,
                    classStandard: user.classStandard || null,
                },
                // Order items
                items: cart.items.map(item => ({
                    itemId: item.itemId,
                    title: item.title,
                    author: item.author,
                    coverImageUrl: item.coverImageUrl || '',
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal || (item.price * item.quantity),
                    bookType: item.bookType || '',
                })),
                // Pricing breakdown
                subtotal: subtotal,
                deliveryCharge: deliveryCharge,
                tax: tax,
                total: total,
                // Order status
                paymentStatus: 'paid',
                orderStatus: 'confirmed',
                deliveryStatus: 'pending', // pending, processing, shipped, delivered, cancelled
                // Payment information
                razorpayOrderId: paymentData.razorpayOrderId,
                razorpayPaymentId: paymentData.razorpayPaymentId,
                razorpaySignature: paymentData.razorpaySignature,
                // Shipping information - now includes complete address with name and phone
                shippingAddress: finalShippingAddress,
                // Tracking (can be added later when shipped)
                trackingNumber: null,
                // Timestamps
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Save order to Firestore
            console.log(`💾 Saving order to Firestore: ${orderNumber}`);
            console.log(`📊 Order data:`, {
                userId,
                itemCount: orderData.items.length,
                total: orderData.total,
                orderNumber,
                hasShippingAddress: !!orderData.shippingAddress,
                shippingAddressName: orderData.shippingAddress?.name || 'N/A',
                shippingAddressCity: orderData.shippingAddress?.city || 'N/A',
            });
            
            const orderRef = await this.ordersRef.add(orderData);
            const orderDoc = await orderRef.get();
            
            if (!orderDoc.exists) {
                throw new Error('Failed to save order to Firestore');
            }

            console.log(`✅ Order saved to Firestore with ID: ${orderRef.id}`);

            // Clear cart after order is created
            console.log(`🛒 Clearing cart for user: ${userId}`);
            await cartService.clearCart(userId);
            console.log(`✅ Cart cleared`);

            console.log(`✅ Order created successfully: ${orderNumber} (${orderRef.id})`);

            return {
                id: orderRef.id,
                ...orderDoc.data(),
            };
        } catch (error) {
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

