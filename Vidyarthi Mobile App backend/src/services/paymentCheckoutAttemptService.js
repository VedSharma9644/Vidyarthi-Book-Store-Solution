const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

const COLLECTION = 'payment_checkout_attempts';

/**
 * @param {import('firebase-admin/firestore').Timestamp | Date | object} createdAt
 * @returns {number|null} epoch ms
 */
function createdAtToMillis(createdAt) {
    if (!createdAt) {
        return null;
    }
    if (typeof createdAt.toMillis === 'function') {
        return createdAt.toMillis();
    }
    if (createdAt instanceof Date) {
        return createdAt.getTime();
    }
    if (createdAt._seconds != null) {
        return createdAt._seconds * 1000 + Math.floor((createdAt._nanoseconds || 0) / 1e6);
    }
    return null;
}

/**
 * Tracks Razorpay checkout sessions so a later reconciliation job can
 * create Firestore orders if the client flow dropped after payment.
 * Writes are best-effort and must not break payment order creation.
 */
class PaymentCheckoutAttemptService {
    /**
     * @param {object} params
     * @param {string} params.razorpayOrderId
     * @param {string} params.userId
     * @param {number} params.amountInr
     * @param {string} [params.receipt]
     * @param {object|null} [params.orderingStudent] - Same shape as order.orderingForStudent (optional)
     * @param {Array<object>|null} [params.cartSnapshot] - Line items at checkout (for webhook/reconcile)
     * @param {object|null} [params.shippingAddress] - Shipping address at checkout (optional)
     */
    async recordAttempt({
        razorpayOrderId,
        userId,
        amountInr,
        receipt = '',
        orderingStudent = null,
        cartSnapshot = null,
        shippingAddress = null,
    }) {
        if (!razorpayOrderId || !userId) {
            return;
        }
        const ref = db.collection(COLLECTION).doc(razorpayOrderId);
        const existing = await ref.get();
        if (existing.exists) {
            if (shippingAddress && typeof shippingAddress === 'object') {
                const prev = existing.data()?.shippingAddress;
                const prevHas =
                    prev &&
                    (String(prev.address || '').trim() || String(prev.city || '').trim());
                if (!prevHas) {
                    const shipSnap = {
                        name:
                            shippingAddress.name != null
                                ? String(shippingAddress.name).slice(0, 200)
                                : '',
                        phone:
                            shippingAddress.phone != null
                                ? String(shippingAddress.phone).slice(0, 40)
                                : '',
                        address:
                            shippingAddress.address != null
                                ? String(shippingAddress.address).slice(0, 500)
                                : '',
                        city:
                            shippingAddress.city != null
                                ? String(shippingAddress.city).slice(0, 120)
                                : '',
                        state:
                            shippingAddress.state != null
                                ? String(shippingAddress.state).slice(0, 120)
                                : '',
                        postalCode:
                            shippingAddress.postalCode != null
                                ? String(shippingAddress.postalCode).slice(0, 20)
                                : shippingAddress.pincode != null
                                  ? String(shippingAddress.pincode).slice(0, 20)
                                  : '',
                        country:
                            shippingAddress.country != null
                                ? String(shippingAddress.country).slice(0, 80)
                                : 'India',
                    };
                    if (
                        String(shipSnap.address || '').trim() ||
                        String(shipSnap.city || '').trim()
                    ) {
                        await ref.update({
                            shippingAddress: shipSnap,
                            updatedAt: FieldValue.serverTimestamp(),
                        });
                    }
                }
            }
            return;
        }

        let snapshotLines = null;
        if (Array.isArray(cartSnapshot) && cartSnapshot.length > 0) {
            snapshotLines = cartSnapshot
                .slice(0, 80)
                .map((row) => ({
                    itemId: row.itemId != null ? String(row.itemId) : '',
                    title: row.title != null ? String(row.title).slice(0, 500) : '',
                    author: row.author != null ? String(row.author).slice(0, 300) : '',
                    coverImageUrl: row.coverImageUrl != null ? String(row.coverImageUrl).slice(0, 2000) : '',
                    price: row.price != null ? Number(row.price) : 0,
                    quantity: Math.max(1, parseInt(row.quantity, 10) || 1),
                    bookType: row.bookType != null ? String(row.bookType).slice(0, 80) : '',
                    productQuantity:
                        row.productQuantity != null ? parseInt(row.productQuantity, 10) || 1 : undefined,
                    subtotal:
                        row.subtotal != null
                            ? Number(row.subtotal)
                            : undefined,
                }))
                .filter((r) => r.itemId);
            if (snapshotLines.length === 0) {
                snapshotLines = null;
            }
        }

        let shipSnap = null;
        if (shippingAddress && typeof shippingAddress === 'object') {
            shipSnap = {
                name: shippingAddress.name != null ? String(shippingAddress.name).slice(0, 200) : '',
                phone: shippingAddress.phone != null ? String(shippingAddress.phone).slice(0, 40) : '',
                address: shippingAddress.address != null ? String(shippingAddress.address).slice(0, 500) : '',
                city: shippingAddress.city != null ? String(shippingAddress.city).slice(0, 120) : '',
                state: shippingAddress.state != null ? String(shippingAddress.state).slice(0, 120) : '',
                postalCode:
                    shippingAddress.postalCode != null
                        ? String(shippingAddress.postalCode).slice(0, 20)
                        : shippingAddress.pincode != null
                          ? String(shippingAddress.pincode).slice(0, 20)
                          : '',
                country: shippingAddress.country != null ? String(shippingAddress.country).slice(0, 80) : 'India',
            };
        }

        const payload = {
            razorpayOrderId,
            userId: String(userId),
            amountInr: Number(amountInr) || 0,
            receipt: String(receipt || ''),
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        if (snapshotLines) {
            payload.cartSnapshot = snapshotLines;
        }
        if (shipSnap) {
            payload.shippingAddress = shipSnap;
        }
        if (orderingStudent && typeof orderingStudent.name === 'string' && orderingStudent.name.trim()) {
            payload.orderingForStudent = {
                id: orderingStudent.id != null ? String(orderingStudent.id) : null,
                name: orderingStudent.name.trim(),
                age: orderingStudent.age != null ? String(orderingStudent.age) : null,
                gender: orderingStudent.gender != null ? String(orderingStudent.gender) : null,
                schoolLabel:
                    orderingStudent.schoolLabel != null ? String(orderingStudent.schoolLabel) : null,
                gradeLabel:
                    orderingStudent.gradeLabel != null ? String(orderingStudent.gradeLabel) : null,
            };
        }
        await ref.set(payload);
    }

    /**
     * @param {string} razorpayOrderId
     * @returns {Promise<object|null>}
     */
    async getAttempt(razorpayOrderId) {
        if (!razorpayOrderId) {
            return null;
        }
        const snap = await db.collection(COLLECTION).doc(razorpayOrderId).get();
        if (!snap.exists) {
            return null;
        }
        return { id: snap.id, ...snap.data() };
    }

    /**
     * Mark attempt fulfilled after a successful order (client or reconciliation).
     * @param {string} razorpayOrderId
     * @param {{ orderDocId?: string, source?: string }} [meta]
     */
    async markFulfilled(razorpayOrderId, meta = {}) {
        if (!razorpayOrderId) {
            return;
        }
        const ref = db.collection(COLLECTION).doc(razorpayOrderId);
        const snap = await ref.get();
        if (!snap.exists) {
            return;
        }
        const data = snap.data();
        if (data.status === 'fulfilled') {
            return;
        }
        const update = {
            status: 'fulfilled',
            fulfilledAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            fulfillmentSource: meta.source || 'client',
        };
        if (meta.orderDocId) {
            update.orderDocId = meta.orderDocId;
        }
        await ref.update(update);
    }

    /**
     * @param {string} razorpayOrderId
     * @param {string} message
     * @param {string} [code]
     */
    async markReconcileFailed(razorpayOrderId, message, code = '') {
        if (!razorpayOrderId) {
            return;
        }
        const ref = db.collection(COLLECTION).doc(razorpayOrderId);
        const snap = await ref.get();
        if (!snap.exists) {
            return;
        }
        await ref.update({
            status: 'reconcile_failed',
            lastReconcileError: String(message || '').slice(0, 2000),
            lastReconcileCode: code || null,
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    /**
     * Pending attempts (filter by age in caller to avoid extra Firestore indexes).
     * @param {number} limit
     * @returns {Promise<Array<{ id: string } & object>>}
     */
    async listPendingAttempts(limit = 80) {
        const snap = await db
            .collection(COLLECTION)
            .where('status', '==', 'pending')
            .limit(limit)
            .get();

        return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
}

const service = new PaymentCheckoutAttemptService();
module.exports = service;
module.exports.createdAtToMillis = createdAtToMillis;
