const orderService = require('./orderService');
const paymentCheckoutAttemptService = require('./paymentCheckoutAttemptService');
const paymentService = require('./paymentService');

/**
 * Create a Firestore order when Razorpay shows a captured payment, if one does not already exist.
 * Uses checkout attempt (cart snapshot, userId, shipping) when present; falls back to Razorpay order `notes.userId`
 * and live cart when snapshot is missing.
 *
 * @param {object} opts
 * @param {string} opts.razorpayOrderId
 * @param {string} opts.razorpayPaymentId
 * @param {string} opts.source - e.g. webhook | reconciliation_job
 * @param {boolean} [opts.dryRun]
 * @returns {Promise<{ ok: boolean, created: boolean, order?: object, reason?: string, dryRunWouldCreate?: boolean }>}
 */
async function fulfillCapturedPaymentIfNeeded({
    razorpayOrderId,
    razorpayPaymentId,
    source,
    dryRun = false,
}) {
    if (!razorpayOrderId || !razorpayPaymentId) {
        return { ok: false, created: false, reason: 'missing_ids' };
    }

    const existing = await orderService.findOrderByRazorpayOrderId(razorpayOrderId);
    if (existing) {
        try {
            await paymentCheckoutAttemptService.markFulfilled(razorpayOrderId, {
                source: `${source}_existing_order`,
                orderDocId: existing.id,
            });
        } catch (_) {
            /* non-fatal */
        }
        return { ok: true, created: false, order: existing };
    }

    let payment;
    try {
        payment = await paymentService.fetchPayment(razorpayPaymentId);
    } catch (e) {
        return { ok: false, created: false, reason: `fetch_payment:${e.message}` };
    }

    if (payment.status !== 'captured') {
        return { ok: true, created: false, reason: `payment_not_captured:${payment.status}` };
    }

    if (payment.order_id && payment.order_id !== razorpayOrderId) {
        return { ok: false, created: false, reason: 'payment_order_mismatch' };
    }

    const attempt = await paymentCheckoutAttemptService.getAttempt(razorpayOrderId);
    let userId = attempt?.userId ? String(attempt.userId) : null;

    if (!userId) {
        try {
            const rzOrder = await paymentService.fetchRazorpayOrder(razorpayOrderId);
            const n = rzOrder?.notes;
            if (n && n.userId) {
                userId = String(n.userId);
            }
        } catch (e) {
            return { ok: false, created: false, reason: `fetch_rz_order:${e.message}` };
        }
    }

    if (!userId) {
        return { ok: false, created: false, reason: 'missing_user_id' };
    }

    if (dryRun) {
        return { ok: true, created: false, dryRunWouldCreate: true };
    }

    const paymentData = {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: source === 'webhook' ? 'razorpay_webhook' : `server_${source}`,
        fulfillmentSource: source,
    };

    const orderingStudent = attempt?.orderingForStudent || null;
    const ship =
        attempt?.shippingAddress && typeof attempt.shippingAddress === 'object'
            ? attempt.shippingAddress
            : null;

    const snapshot = Array.isArray(attempt?.cartSnapshot) ? attempt.cartSnapshot : [];

    let order;
    if (snapshot.length > 0) {
        order = await orderService.createOrderFromPaidLineItems(
            userId,
            paymentData,
            ship,
            orderingStudent,
            snapshot
        );
    } else {
        order = await orderService.createOrder(userId, paymentData, ship, orderingStudent);
    }

    try {
        await paymentCheckoutAttemptService.markFulfilled(razorpayOrderId, {
            source,
            orderDocId: order.id,
        });
    } catch (_) {
        /* non-fatal */
    }

    return { ok: true, created: true, order };
}

module.exports = {
    fulfillCapturedPaymentIfNeeded,
};
