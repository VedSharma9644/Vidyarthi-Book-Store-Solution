const { db } = require('../config/firebase');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const cartService = require('./cartService');
const userService = require('./userService');
const { resolveProductSku } = require('../utils/productSku');

/** Book types that are mandatory: if out of stock, entire grade order is blocked */
const MANDATORY_BOOK_TYPES = ['TEXTBOOK', 'MANDATORY_NOTEBOOK'];

/** User-facing labels for stock messages (aligned with app/website categoryNames). */
const BOOK_TYPE_LABEL = {
    TEXTBOOK: 'Mandatory Textbook',
    MANDATORY_NOTEBOOK: 'Mandatory Notebook',
    NOTEBOOK: 'Notebook',
    STATIONARY: 'Stationary',
    STATIONERY: 'Stationery',
    UNIFORM: 'Uniform',
    OPTIONAL_1: 'School suggested',
    OPTIONAL_2: 'Optional',
    OPTIONAL_3: 'Optional',
    OPTIONAL_4: 'Optional',
    OTHER: 'Other',
};

function bookTypeLabelForMessage(code) {
    const u = String(code || 'OTHER').toUpperCase();
    return BOOK_TYPE_LABEL[u] || u.replace(/_/g, ' ');
}

/** True when a stored or incoming address has at least a street line or city. */
function hasMeaningfulShippingFields(addr) {
    if (!addr || typeof addr !== 'object') {
        return false;
    }
    return !!(
        String(addr.address || addr.line1 || addr.street || '').trim() ||
        String(addr.city || '').trim()
    );
}

/** Display name for parent / account holder (matches website profile priority). */
function buildCustomerDisplayName(user) {
    if (!user) {
        return 'Customer';
    }
    const parentFull = user.parentFullName != null ? String(user.parentFullName).trim() : '';
    if (parentFull) {
        return parentFull;
    }
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`.trim();
    }
    if (user.firstName) {
        return String(user.firstName).trim();
    }
    if (user.lastName) {
        return String(user.lastName).trim();
    }
    if (user.userName) {
        return String(user.userName).trim();
    }
    if (user.email) {
        return String(user.email).trim();
    }
    return 'Customer';
}

/**
 * Student this order is for — checkout orderingStudent or legacy shippingAddress.studentName.
 * @param {object|null} orderingStudent
 * @param {object|null} shippingAddress
 * @returns {object|null}
 */
function buildOrderingForStudent(orderingStudent, shippingAddress = null) {
    const fromCheckout =
        orderingStudent &&
        typeof orderingStudent.name === 'string' &&
        orderingStudent.name.trim();
    const nameSource = fromCheckout
        ? orderingStudent.name.trim()
        : shippingAddress?.studentName && String(shippingAddress.studentName).trim();
    if (!nameSource) {
        return null;
    }
    const source = fromCheckout ? orderingStudent : { id: '', name: nameSource };
    return {
        id: source.id != null && String(source.id).trim() ? String(source.id) : null,
        name: nameSource,
        age: source.age != null ? String(source.age) : null,
        gender: source.gender != null ? String(source.gender) : null,
        schoolLabel: source.schoolLabel != null ? String(source.schoolLabel) : null,
        gradeLabel: source.gradeLabel != null ? String(source.gradeLabel) : null,
    };
}

/** Persist student name on shipping snapshot when checkout supplies it separately. */
function attachStudentToShippingAddress(shippingAddress, orderingForStudent) {
    if (!shippingAddress || !orderingForStudent?.name) {
        return shippingAddress;
    }
    return {
        ...shippingAddress,
        studentName: orderingForStudent.name,
    };
}

/** Default saved address from profile (`addresses[]` or legacy `address`). */
function pickUserDefaultAddress(user) {
    if (!user) {
        return null;
    }
    const list = user.addresses;
    if (Array.isArray(list) && list.length > 0) {
        const chosen = list.find((a) => a && a.isDefault) || list[0];
        if (chosen && hasMeaningfulShippingFields(chosen)) {
            return chosen;
        }
    }
    if (user.address && hasMeaningfulShippingFields(user.address)) {
        return user.address;
    }
    return null;
}

/**
 * Build order shippingAddress from checkout payload and/or user profile.
 * @param {object|null} shippingAddress
 * @param {object|null} user
 * @returns {object|null}
 */
function buildFinalShippingAddress(shippingAddress, user) {
    const raw =
        shippingAddress && hasMeaningfulShippingFields(shippingAddress)
            ? shippingAddress
            : pickUserDefaultAddress(user);
    if (!raw) {
        return null;
    }

    const customerName = buildCustomerDisplayName(user);

    const built = {
        name: String(raw.name || '').trim() || customerName,
        phone: String(raw.phone || user?.phoneNumber || '').trim() || null,
        address: String(raw.address || raw.line1 || raw.street || '').trim() || null,
        city: String(raw.city || '').trim() || null,
        state: String(raw.state || '').trim() || null,
        postalCode: String(
            raw.postalCode || raw.pincode || raw.pinCode || raw.zip || ''
        ).trim() || null,
        country: String(raw.country || 'India').trim() || 'India',
    };
    const studentName = String(raw.studentName || '').trim();
    if (studentName) {
        built.studentName = studentName;
    }
    const studentRollNumber = String(raw.studentRollNumber || '').trim();
    if (studentRollNumber) {
        built.studentRollNumber = studentRollNumber;
    }
    return built;
}

/**
 * Remove paid line quantities from the user's cart (partial clear). Paid lines are source of truth.
 * @param {Array<object>} cartItems
 * @param {Array<{ itemId: string, quantity: number }>} paidLines
 * @returns {{ items: Array<object>, totalAmount: number }}
 */
function subtractPaidLinesFromCartItems(cartItems, paidLines) {
    const toSubtract = new Map();
    for (const line of paidLines) {
        if (!line || !line.itemId) {
            continue;
        }
        const id = String(line.itemId);
        const q = parseInt(line.quantity, 10) || 1;
        toSubtract.set(id, (toSubtract.get(id) || 0) + q);
    }
    const next = [];
    for (const item of cartItems || []) {
        const need = toSubtract.get(item.itemId);
        if (need == null) {
            next.push(item);
            continue;
        }
        const q = parseInt(item.quantity, 10) || 1;
        const price = parseFloat(item.price) || 0;
        const remaining = q - need;
        if (remaining > 0) {
            next.push({
                ...item,
                quantity: remaining,
                subtotal: price * remaining,
            });
        }
        toSubtract.delete(item.itemId);
    }
    const totalAmount = next.reduce((sum, i) => {
        const sub = i.subtotal != null ? i.subtotal : (parseFloat(i.price) || 0) * (parseInt(i.quantity, 10) || 1);
        return sum + sub;
    }, 0);
    return { items: next, totalAmount };
}

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
                ? `Insufficient stock. Please uncheck: ${optionalBundles.map(bookTypeLabelForMessage).join(', ')}.`
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
     * @param {object|null} orderingStudent - Student this order is for (optional): { id, name, age?, gender?, schoolLabel?, gradeLabel? }
     * @returns {Promise<object>} Created order
     */
    async createOrder(userId, paymentData, shippingAddress = null, orderingStudent = null) {
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
            const bookMetaByItemId = {};
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
                bookMetaByItemId[item.itemId] = {
                    sku: bookData.sku || '',
                    isbn: bookData.isbn || '',
                };
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

            const orderNumber = await this.generateOrderNumber();

            let finalShippingAddress = buildFinalShippingAddress(shippingAddress, user);
            const orderingForStudent = buildOrderingForStudent(orderingStudent, shippingAddress);
            if (orderingForStudent) {
                finalShippingAddress = attachStudentToShippingAddress(
                    finalShippingAddress,
                    orderingForStudent
                );
            }
            if (finalShippingAddress) {
                console.log(
                    `✅ Shipping address for order ${orderNumber}: ${finalShippingAddress.name}, ${finalShippingAddress.city || '(no city)'}`
                );
            } else {
                console.warn(`⚠️ No shipping address available for order ${orderNumber}`);
            }

            const customerDisplayName = buildCustomerDisplayName(user);
            const orderData = {
                orderNumber: orderNumber,
                userId: userId,
                customerInfo: {
                    name: customerDisplayName,
                    parentFullName:
                        user.parentFullName != null ? String(user.parentFullName).trim() : null,
                    email: user.email || null,
                    phoneNumber: user.phoneNumber || null,
                    schoolName: user.schoolName || null,
                    classStandard: user.classStandard || null,
                },
                orderingForStudent,
                items: cart.items.map((item, index) => {
                    const meta = bookMetaByItemId[item.itemId] || {};
                    const sku = resolveProductSku({
                        sku: meta.sku,
                        isbn: meta.isbn,
                        itemId: item.itemId,
                        index,
                    });
                    return {
                        itemId: item.itemId,
                        title: item.title,
                        author: item.author,
                        coverImageUrl: item.coverImageUrl || '',
                        price: item.price,
                        quantity: item.quantity,
                        subtotal: item.subtotal || item.price * item.quantity,
                        bookType: item.bookType || '',
                        isbn: meta.isbn || '',
                        sku,
                    };
                }),
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
                fulfillmentSource: paymentData.fulfillmentSource || 'client',
                ...(paymentData.orderChannel ? { orderChannel: paymentData.orderChannel } : {}),
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
     * Find an existing Firestore order by Razorpay order id (idempotency).
     * @param {string} razorpayOrderId
     * @returns {Promise<object|null>}
     */
    async findOrderByRazorpayOrderId(razorpayOrderId) {
        if (!razorpayOrderId) {
            return null;
        }
        const snapshot = await this.ordersRef
            .where('razorpayOrderId', '==', razorpayOrderId)
            .limit(1)
            .get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }

    /**
     * If the order has no usable shipping address, persist one from checkout or user profile.
     * Used when webhook/reconciliation created the order before the client sent the address.
     * @param {string} orderDocId
     * @param {object|null} shippingAddress
     * @param {string|null} userId
     * @returns {Promise<object|null>} Updated order document or null if unchanged
     */
    async patchShippingAddressIfMissing(orderDocId, shippingAddress, userId = null) {
        if (!orderDocId) {
            return null;
        }
        const orderRef = this.ordersRef.doc(orderDocId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            return null;
        }
        const data = orderSnap.data();
        if (hasMeaningfulShippingFields(data.shippingAddress)) {
            return { id: orderSnap.id, ...data };
        }

        const uid = userId || data.userId;
        let user = null;
        if (uid) {
            user = await userService.getUserById(uid);
        }
        const merged = buildFinalShippingAddress(shippingAddress, user);
        if (!merged) {
            return { id: orderSnap.id, ...data };
        }

        await orderRef.update({
            shippingAddress: merged,
            updatedAt: Timestamp.now(),
        });
        console.log(`📍 Patched shipping address on order ${orderSnap.id}`);
        const updated = await orderRef.get();
        return { id: updated.id, ...updated.data() };
    }

    /**
     * Backfill website/mobile checkout metadata when webhook created the order first.
     * @param {string} orderDocId
     * @param {{ orderingStudent?: object|null, orderChannel?: string|null, shippingAddress?: object|null }} meta
     * @param {string|null} [userId]
     * @returns {Promise<object|null>}
     */
    async patchOrderCheckoutMetadataIfMissing(orderDocId, meta = {}, userId = null) {
        if (!orderDocId) {
            return null;
        }
        const orderRef = this.ordersRef.doc(orderDocId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            return null;
        }
        const data = orderSnap.data();
        const updates = {};

        const channel = meta.orderChannel ? String(meta.orderChannel).trim() : '';
        if (!data.orderChannel && channel) {
            updates.orderChannel = channel;
        }

        const hasStudent =
            data.orderingForStudent?.name && String(data.orderingForStudent.name).trim();
        const orderingForStudent = buildOrderingForStudent(
            meta.orderingStudent || null,
            meta.shippingAddress || null
        );
        if (!hasStudent && orderingForStudent) {
            updates.orderingForStudent = orderingForStudent;
            const shipBase =
                data.shippingAddress && hasMeaningfulShippingFields(data.shippingAddress)
                    ? data.shippingAddress
                    : buildFinalShippingAddress(meta.shippingAddress, null);
            if (shipBase) {
                updates.shippingAddress = attachStudentToShippingAddress(
                    shipBase,
                    orderingForStudent
                );
            }
        }

        if (Object.keys(updates).length === 0) {
            return { id: orderSnap.id, ...data };
        }

        updates.updatedAt = Timestamp.now();
        await orderRef.update(updates);
        console.log(`📋 Patched checkout metadata on order ${orderSnap.id}`);
        const updated = await orderRef.get();
        return { id: updated.id, ...updated.data() };
    }

    /**
     * Normalize client snapshot lines to order line items (enrich from `books` when needed).
     * @param {Array<object>} rawLines
     * @returns {Promise<Array<object>>}
     */
    async normalizeLineItemsForOrderInput(rawLines) {
        if (!Array.isArray(rawLines) || rawLines.length === 0) {
            return [];
        }
        const capped = rawLines.slice(0, 80);
        const out = [];
        for (const raw of capped) {
            if (!raw || !raw.itemId) {
                continue;
            }
            const itemId = String(raw.itemId);
            const quantity = Math.max(1, parseInt(raw.quantity, 10) || 1);
            let title = raw.title != null ? String(raw.title) : '';
            let author = raw.author != null ? String(raw.author) : '';
            let coverImageUrl = raw.coverImageUrl != null ? String(raw.coverImageUrl) : '';
            let price = parseFloat(raw.price) || 0;
            let bookType = raw.bookType != null ? String(raw.bookType) : '';
            let productQuantity = raw.productQuantity != null ? parseInt(raw.productQuantity, 10) : null;
            let isbn = raw.isbn != null ? String(raw.isbn) : '';
            let skuRaw = raw.sku != null ? String(raw.sku) : '';

            const bookSnap = await this.booksRef.doc(itemId).get();
            if (bookSnap.exists) {
                const b = bookSnap.data();
                if (!title) {
                    title = b.title || '';
                }
                if (!author) {
                    author = b.author || '';
                }
                if (!coverImageUrl) {
                    coverImageUrl = b.coverImageUrl || '';
                }
                if (!price && b.price != null) {
                    price = parseFloat(b.price) || 0;
                }
                if (!bookType) {
                    bookType = b.bookType || '';
                }
                if (productQuantity == null || Number.isNaN(productQuantity)) {
                    productQuantity = parseInt(b.productQuantity, 10) || 1;
                }
                if (!isbn && b.isbn) {
                    isbn = String(b.isbn);
                }
                if (!skuRaw && b.sku) {
                    skuRaw = String(b.sku);
                }
            } else {
                if (productQuantity == null || Number.isNaN(productQuantity)) {
                    productQuantity = 1;
                }
            }

            const sku = resolveProductSku({
                sku: skuRaw,
                isbn,
                itemId,
                index: out.length,
            });

            out.push({
                itemId,
                title,
                author,
                coverImageUrl,
                price,
                quantity,
                productQuantity,
                subtotal: price * quantity,
                bookType,
                isbn: isbn || '',
                sku,
            });
        }
        return out;
    }

    /**
     * Create order from a cart snapshot (webhook / reconciliation). Decrements stock for paid lines
     * and subtracts those lines from the user's cart (partial clear).
     * @param {string} userId
     * @param {object} paymentData
     * @param {object|null} shippingAddress
     * @param {object|null} orderingStudent
     * @param {Array<object>} lineItemsInput — raw snapshot lines from checkout
     */
    async createOrderFromPaidLineItems(
        userId,
        paymentData,
        shippingAddress = null,
        orderingStudent = null,
        lineItemsInput = []
    ) {
        try {
            const user = await userService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const lineItems = await this.normalizeLineItemsForOrderInput(lineItemsInput);
            if (lineItems.length === 0) {
                throw new Error('Checkout snapshot has no valid line items');
            }

            const insufficientItems = [];
            for (const item of lineItems) {
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

            const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const deliveryCharge = 300;
            const tax = 0;
            const total = subtotal + deliveryCharge;
            const orderNumber = await this.generateOrderNumber();

            let finalShippingAddress = buildFinalShippingAddress(shippingAddress, user);
            const orderingForStudent = buildOrderingForStudent(orderingStudent, shippingAddress);
            if (orderingForStudent) {
                finalShippingAddress = attachStudentToShippingAddress(
                    finalShippingAddress,
                    orderingForStudent
                );
            }
            if (!finalShippingAddress) {
                console.warn(`⚠️ No shipping address available for snapshot order ${orderNumber}`);
            }

            const customerDisplayName = buildCustomerDisplayName(user);
            const orderData = {
                orderNumber,
                userId,
                customerInfo: {
                    name: customerDisplayName,
                    parentFullName:
                        user.parentFullName != null ? String(user.parentFullName).trim() : null,
                    email: user.email || null,
                    phoneNumber: user.phoneNumber || null,
                    schoolName: user.schoolName || null,
                    classStandard: user.classStandard || null,
                },
                orderingForStudent,
                items: lineItems.map((item, index) => ({
                    itemId: item.itemId,
                    title: item.title,
                    author: item.author,
                    coverImageUrl: item.coverImageUrl || '',
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal || item.price * item.quantity,
                    bookType: item.bookType || '',
                    isbn: item.isbn || '',
                    sku:
                        item.sku ||
                        resolveProductSku({
                            sku: item.sku,
                            isbn: item.isbn,
                            itemId: item.itemId,
                            index,
                        }),
                })),
                subtotal,
                deliveryCharge,
                tax,
                total,
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
                fulfillmentSource: paymentData.fulfillmentSource || 'server_snapshot',
                ...(paymentData.orderChannel ? { orderChannel: paymentData.orderChannel } : {}),
            };

            const cart = await cartService.getOrCreateCart(userId);

            const result = await db.runTransaction(async (transaction) => {
                const cartSnap = await transaction.get(this.cartsRef.doc(cart.id));
                if (!cartSnap.exists) {
                    throw new Error('Cart not found');
                }
                const cartItemsNow = cartSnap.data().items || [];

                const insufficientInTx = [];
                const decrements = [];
                for (const item of lineItems) {
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

                const orderRef = this.ordersRef.doc();
                transaction.set(orderRef, orderData);

                for (const { bookRef, unitsToDecrement } of decrements) {
                    transaction.update(bookRef, {
                        stockQuantity: FieldValue.increment(-unitsToDecrement),
                        updatedAt: new Date(),
                    });
                }

                const { items: newItems, totalAmount } = subtractPaidLinesFromCartItems(
                    cartItemsNow,
                    lineItems
                );
                transaction.update(this.cartsRef.doc(cart.id), {
                    items: newItems,
                    totalAmount,
                    updatedAt: new Date(),
                });

                return { orderId: orderRef.id, orderData };
            });

            const orderId = result.orderId;
            const orderDataResult = result.orderData;
            console.log(`✅ Snapshot order saved: ${orderId} (${orderNumber})`);
            return { id: orderId, ...orderDataResult };
        } catch (error) {
            if (error.code === 'INSUFFICIENT_STOCK') {
                throw error;
            }
            console.error('❌ Error creating order from snapshot:', error);
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
     * Generate unique order number: ORD-YYYYMMDD-00001 (IST date + daily sequence).
     * Existing orders keep their stored orderNumber; only new creates use this.
     * @returns {Promise<string>}
     */
    async generateOrderNumber() {
        const dateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
            .format(new Date())
            .replace(/-/g, '');

        const counterRef = db.collection('counters').doc(`orders_${dateStr}`);
        const seq = await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(counterRef);
            const next = (snap.exists ? Number(snap.data().seq) || 0 : 0) + 1;
            transaction.set(
                counterRef,
                {
                    seq: next,
                    dateKey: dateStr,
                    updatedAt: Timestamp.now(),
                },
                { merge: true }
            );
            return next;
        });

        return `ORD-${dateStr}-${String(seq).padStart(5, '0')}`;
    }
}

module.exports = new OrderService();

