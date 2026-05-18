const paymentCheckoutAttemptService = require('../services/paymentCheckoutAttemptService');
const paymentService = require('../services/paymentService');
const { fulfillCapturedPaymentIfNeeded } = require('../services/capturedPaymentFulfillmentService');

const DEFAULT_MIN_AGE_MS = 5 * 60 * 1000;

/**
 * One reconciliation pass: pending checkout attempts older than minAgeMs may get
 * a Firestore order created if Razorpay shows a captured payment and no order exists yet.
 *
 * @param {{ minAgeMs?: number, maxAttempts?: number, dryRun?: boolean }} [opts]
 * @returns {Promise<{ examined: number, skippedYoung: number, alreadyOrdered: number, created: number, awaitingCapture: number, failed: number }>}
 */
async function runPaymentReconciliationPass(opts = {}) {
    const minAgeMs = opts.minAgeMs ?? DEFAULT_MIN_AGE_MS;
    const maxAttempts = opts.maxAttempts ?? 80;
    const dryRun = opts.dryRun === true;

    const stats = {
        examined: 0,
        skippedYoung: 0,
        alreadyOrdered: 0,
        created: 0,
        awaitingCapture: 0,
        failed: 0,
    };

    const pending = await paymentCheckoutAttemptService.listPendingAttempts(maxAttempts);
    const now = Date.now();

    for (const attempt of pending) {
        stats.examined += 1;
        const razorpayOrderId = attempt.razorpayOrderId || attempt.id;
        const createdMs = paymentCheckoutAttemptService.createdAtToMillis(attempt.createdAt);
        if (createdMs == null) {
            stats.skippedYoung += 1;
            continue;
        }
        if (now - createdMs < minAgeMs) {
            stats.skippedYoung += 1;
            continue;
        }

        if (!razorpayOrderId) {
            stats.failed += 1;
            console.warn(`[reconcile] skip attempt missing razorpayOrderId`);
            continue;
        }

        let paymentsPayload;
        try {
            paymentsPayload = await paymentService.fetchPaymentsForOrder(razorpayOrderId);
        } catch (e) {
            stats.failed += 1;
            console.error(`[reconcile] fetchPayments failed ${razorpayOrderId}:`, e.message);
            continue;
        }

        const items = paymentsPayload?.items || [];
        const captured = items.find((p) => p && p.status === 'captured');
        if (!captured) {
            stats.awaitingCapture += 1;
            continue;
        }

        try {
            const result = await fulfillCapturedPaymentIfNeeded({
                razorpayOrderId,
                razorpayPaymentId: captured.id,
                source: 'reconciliation_job',
                dryRun,
            });

            if (result.dryRunWouldCreate) {
                stats.created += 1;
                console.log(`[reconcile] dry-run would create order for ${razorpayOrderId} payment ${captured.id}`);
                continue;
            }
            if (result.created && result.order) {
                stats.created += 1;
                console.log(`[reconcile] created order ${result.order.orderNumber} (${result.order.id}) for ${razorpayOrderId}`);
                continue;
            }
            if (result.order && !result.created) {
                stats.alreadyOrdered += 1;
                continue;
            }
            if (!result.ok) {
                stats.failed += 1;
                console.error(`[reconcile] fulfill failed ${razorpayOrderId}:`, result.reason);
                continue;
            }
            stats.failed += 1;
            console.warn(`[reconcile] unexpected outcome ${razorpayOrderId}`, result);
        } catch (e) {
            stats.failed += 1;
            const code = e.code || '';
            const msg = e.message || String(e);
            console.error(`[reconcile] fulfill threw ${razorpayOrderId}:`, msg);
            if (code === 'INSUFFICIENT_STOCK') {
                await paymentCheckoutAttemptService.markReconcileFailed(razorpayOrderId, msg, code);
            }
        }
    }

    return stats;
}

module.exports = {
    runPaymentReconciliationPass,
    DEFAULT_MIN_AGE_MS,
};
