const orderService = require('./orderService');
const paymentCheckoutAttemptService = require('./paymentCheckoutAttemptService');
const paymentService = require('./paymentService');
const paymentFulfillmentLockService = require('./paymentFulfillmentLockService');
const { mergeCheckoutMetadata } = require('../utils/checkoutMetadata');

/**
 * @param {string} razorpayOrderId
 * @param {object|null} attempt
 * @returns {Promise<object|null>}
 */
async function fetchRazorpayOrderNotes(razorpayOrderId, attempt) {
    const needsNotes =
        !attempt?.userId ||
        !attempt?.orderChannel ||
        !(attempt?.orderingForStudent?.name && String(attempt.orderingForStudent.name).trim());
    if (!needsNotes) {
        return null;
    }
    try {
        const rzOrder = await paymentService.fetchRazorpayOrder(razorpayOrderId);
        return rzOrder?.notes || null;
    } catch (e) {
        console.warn(`[fulfillment] fetch Razorpay notes ${razorpayOrderId}:`, e.message);
        return null;
    }
}

/**
 * Create a Firestore order when Razorpay shows a captured payment, if one does not already exist.
 * Uses checkout attempt (cart snapshot, userId, shipping) when present; falls back to Razorpay order `notes.userId`
 * and live cart when snapshot is missing.
 *
 * All paths (client, webhook, reconciliation) share an atomic lock per razorpayOrderId.
 *
 * @param {object} opts
 * @param {string} opts.razorpayOrderId
 * @param {string} opts.razorpayPaymentId
 * @param {string} opts.source - e.g. client | webhook | reconciliation_job
 * @param {string} [opts.razorpaySignature] - Client HMAC signature (webhook uses placeholder)
 * @param {string} [opts.clientUserId] - Logged-in user from client (must match checkout attempt when present)
 * @param {object|null} [opts.shippingAddress] - Client checkout address (preferred over attempt when provided)
 * @param {object|null} [opts.orderingStudent] - Client student selection
 * @param {'website'|'android'|'ios'|null} [opts.orderChannel] - Client platform
 * @param {boolean} [opts.dryRun]
 * @returns {Promise<{ ok: boolean, created: boolean, order?: object, reason?: string, dryRunWouldCreate?: boolean }>}
 */
async function fulfillCapturedPaymentIfNeeded({
    razorpayOrderId,
    razorpayPaymentId,
    source,
    razorpaySignature = null,
    clientUserId = null,
    shippingAddress = null,
    orderingStudent = null,
    orderChannel = null,
    dryRun = false,
}) {
    if (!razorpayOrderId || !razorpayPaymentId) {
        return { ok: false, created: false, reason: 'missing_ids' };
    }

    const attemptEarly = await paymentCheckoutAttemptService.getAttempt(razorpayOrderId);
    const razorpayNotesEarly = await fetchRazorpayOrderNotes(razorpayOrderId, attemptEarly);
    const metaEarly = mergeCheckoutMetadata({
        attempt: attemptEarly,
        orderChannel,
        orderingStudent,
        razorpayNotes: razorpayNotesEarly,
    });

    let existing = await orderService.findOrderByRazorpayOrderId(razorpayOrderId);
    if (existing) {
        try {
            const patched = await orderService.patchOrderCheckoutMetadataIfMissing(
                existing.id,
                {
                    orderingStudent: metaEarly.orderingStudent,
                    orderChannel: metaEarly.orderChannel,
                    shippingAddress: shippingAddress || attemptEarly?.shippingAddress || null,
                },
                clientUserId || existing.userId || metaEarly.userId || null
            );
            if (patched) {
                existing = patched;
            }
        } catch (patchErr) {
            console.error('patchOrderCheckoutMetadataIfMissing (non-fatal):', patchErr.message);
        }
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

    const attempt = attemptEarly || (await paymentCheckoutAttemptService.getAttempt(razorpayOrderId));
    const razorpayNotes =
        razorpayNotesEarly || (await fetchRazorpayOrderNotes(razorpayOrderId, attempt));
    const mergedMeta = mergeCheckoutMetadata({
        attempt,
        orderChannel,
        orderingStudent,
        razorpayNotes,
    });
    let userId = mergedMeta.userId ? String(mergedMeta.userId) : null;

    if (clientUserId) {
        const clientId = String(clientUserId);
        if (userId && userId !== clientId) {
            return { ok: false, created: false, reason: 'user_mismatch' };
        }
        userId = clientId;
    }

    if (!userId) {
        return { ok: false, created: false, reason: 'missing_user_id' };
    }

    if (dryRun) {
        return { ok: true, created: false, dryRunWouldCreate: true };
    }

    const signature =
        razorpaySignature && String(razorpaySignature).trim()
            ? String(razorpaySignature).trim()
            : source === 'webhook'
              ? 'razorpay_webhook'
              : `server_${source}`;

    const paymentData = {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signature,
        fulfillmentSource: source,
        orderChannel: mergedMeta.orderChannel,
    };

    const resolvedOrderingStudent = mergedMeta.orderingStudent;
    const ship =
        shippingAddress && typeof shippingAddress === 'object'
            ? shippingAddress
            : attempt?.shippingAddress && typeof attempt.shippingAddress === 'object'
              ? attempt.shippingAddress
              : null;

    const snapshot = Array.isArray(attempt?.cartSnapshot) ? attempt.cartSnapshot : [];

    let created = false;
    let order;

    try {
        const locked = await paymentFulfillmentLockService.runExclusiveFulfillment(
            razorpayOrderId,
            source,
            async () => {
                if (snapshot.length > 0) {
                    return orderService.createOrderFromPaidLineItems(
                        userId,
                        paymentData,
                        ship,
                        resolvedOrderingStudent,
                        snapshot
                    );
                }
                return orderService.createOrder(userId, paymentData, ship, resolvedOrderingStudent);
            }
        );
        order = locked.order;
        created = locked.created;
    } catch (e) {
        if (e.code === 'FULFILLMENT_LOCK_TIMEOUT') {
            const waited = await orderService.findOrderByRazorpayOrderId(razorpayOrderId);
            if (waited) {
                order = waited;
                created = false;
            } else {
                return { ok: false, created: false, reason: 'fulfillment_in_progress' };
            }
        } else {
            throw e;
        }
    }

    try {
        await paymentCheckoutAttemptService.markFulfilled(razorpayOrderId, {
            source,
            orderDocId: order.id,
        });
    } catch (_) {
        /* non-fatal */
    }

    return { ok: true, created, order };
}

module.exports = {
    fulfillCapturedPaymentIfNeeded,
};
