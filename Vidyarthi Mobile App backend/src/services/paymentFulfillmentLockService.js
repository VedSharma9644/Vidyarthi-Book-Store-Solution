const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');
const orderService = require('./orderService');

const COLLECTION = 'payment_fulfillment_locks';
/** If a lock stays in_progress this long, another worker may take over (crashed mid-create). */
const IN_PROGRESS_STALE_MS = 2 * 60 * 1000;
const WAIT_POLL_MS = 350;
const WAIT_MAX_MS = 28000;
const MAX_ACQUIRE_ROUNDS = 40;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Atomic gate: at most one Firestore order per Razorpay order id, even under concurrent
 * client retries, webhooks, and reconciliation.
 */
class PaymentFulfillmentLockService {
    lockRef(razorpayOrderId) {
        return db.collection(COLLECTION).doc(razorpayOrderId);
    }

    /**
     * @param {string} razorpayOrderId
     * @param {string} source
     * @returns {Promise<{ type: 'acquired' } | { type: 'done', orderDocId: string } | { type: 'wait' }>}
     */
    async tryAcquire(razorpayOrderId, source) {
        return db.runTransaction(async (tx) => {
            const ref = this.lockRef(razorpayOrderId);
            const snap = await tx.get(ref);
            const now = Date.now();

            if (snap.exists) {
                const data = snap.data();
                if (data.orderDocId) {
                    return { type: 'done', orderDocId: String(data.orderDocId) };
                }
                if (data.status === 'in_progress') {
                    const startedMs =
                        typeof data.startedAtMs === 'number'
                            ? data.startedAtMs
                            : data.startedAt?.toMillis?.() || 0;
                    if (now - startedMs < IN_PROGRESS_STALE_MS) {
                        return { type: 'wait' };
                    }
                }
            }

            tx.set(
                ref,
                {
                    razorpayOrderId,
                    status: 'in_progress',
                    startedAtMs: now,
                    source: source || 'unknown',
                    updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
            );
            return { type: 'acquired' };
        });
    }

    /**
     * @param {string} razorpayOrderId
     * @param {string} orderDocId
     * @param {string} source
     */
    async complete(razorpayOrderId, orderDocId, source) {
        await this.lockRef(razorpayOrderId).set(
            {
                status: 'completed',
                orderDocId,
                source: source || 'unknown',
                completedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
    }

    /**
     * Release lock after a failed create so webhook/reconcile can retry.
     * @param {string} razorpayOrderId
     */
    async release(razorpayOrderId) {
        try {
            await db.runTransaction(async (tx) => {
                const ref = this.lockRef(razorpayOrderId);
                const snap = await tx.get(ref);
                if (!snap.exists) {
                    return;
                }
                const data = snap.data();
                if (data.orderDocId) {
                    return;
                }
                if (data.status === 'in_progress') {
                    tx.delete(ref);
                }
            });
        } catch (e) {
            console.error(`[fulfillment-lock] release failed ${razorpayOrderId}:`, e.message);
        }
    }

    /**
     * @param {string} orderDocId
     * @returns {Promise<object|null>}
     */
    async loadOrder(orderDocId) {
        if (!orderDocId) {
            return null;
        }
        return orderService.getOrderById(orderDocId);
    }

    /**
     * Poll until another worker completes the order or an existing order appears.
     * @param {string} razorpayOrderId
     * @returns {Promise<object|null>}
     */
    async waitForCompletedOrder(razorpayOrderId) {
        const deadline = Date.now() + WAIT_MAX_MS;
        while (Date.now() < deadline) {
            const lockSnap = await this.lockRef(razorpayOrderId).get();
            if (lockSnap.exists) {
                const orderDocId = lockSnap.data()?.orderDocId;
                if (orderDocId) {
                    const order = await this.loadOrder(String(orderDocId));
                    if (order) {
                        return order;
                    }
                }
            }

            const existing = await orderService.findOrderByRazorpayOrderId(razorpayOrderId);
            if (existing) {
                try {
                    await this.complete(razorpayOrderId, existing.id, 'recovered_existing');
                } catch (_) {
                    /* non-fatal */
                }
                return existing;
            }

            await sleep(WAIT_POLL_MS);
        }
        return null;
    }

    /**
     * Run order creation at most once per Razorpay order id.
     * @param {string} razorpayOrderId
     * @param {string} source
     * @param {() => Promise<object>} createFn — must return order with `id`
     * @returns {Promise<{ order: object, created: boolean }>}
     */
    async runExclusiveFulfillment(razorpayOrderId, source, createFn) {
        if (!razorpayOrderId) {
            throw new Error('razorpayOrderId is required for fulfillment lock');
        }

        const existing = await orderService.findOrderByRazorpayOrderId(razorpayOrderId);
        if (existing) {
            return { order: existing, created: false };
        }

        for (let round = 0; round < MAX_ACQUIRE_ROUNDS; round += 1) {
            const acquire = await this.tryAcquire(razorpayOrderId, source);

            if (acquire.type === 'done') {
                const order = await this.loadOrder(acquire.orderDocId);
                if (order) {
                    return { order, created: false };
                }
            }

            if (acquire.type === 'wait') {
                const waited = await this.waitForCompletedOrder(razorpayOrderId);
                if (waited) {
                    return { order: waited, created: false };
                }
                continue;
            }

            try {
                const again = await orderService.findOrderByRazorpayOrderId(razorpayOrderId);
                if (again) {
                    await this.complete(razorpayOrderId, again.id, `${source}_race`);
                    return { order: again, created: false };
                }

                const order = await createFn();
                if (!order?.id) {
                    throw new Error('createFn did not return an order with id');
                }

                await this.complete(razorpayOrderId, order.id, source);
                return { order, created: true };
            } catch (error) {
                await this.release(razorpayOrderId);
                throw error;
            }
        }

        const err = new Error('Order fulfillment is in progress; please retry shortly');
        err.code = 'FULFILLMENT_LOCK_TIMEOUT';
        throw err;
    }
}

module.exports = new PaymentFulfillmentLockService();
