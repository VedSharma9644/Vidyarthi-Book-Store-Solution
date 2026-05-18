const paymentService = require('../services/paymentService');
const paymentCheckoutAttemptService = require('../services/paymentCheckoutAttemptService');
const { fulfillCapturedPaymentIfNeeded } = require('../services/capturedPaymentFulfillmentService');

/**
 * Razorpay webhooks — body must be raw JSON (see server.js: express.raw).
 * Configure in Razorpay Dashboard: payment.captured → this URL.
 * Set RAZORPAY_WEBHOOK_SECRET to the secret from the webhook setup.
 */
async function handleWebhook(req, res) {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
        return res.status(400).json({ success: false, message: 'Empty body' });
    }

    if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
        console.warn('[webhook] invalid signature');
        return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    let payload;
    try {
        payload = JSON.parse(rawBody.toString('utf8'));
    } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid JSON' });
    }

    const event = payload.event;
    if (event === 'payment.captured') {
        const entity = payload.payload?.payment?.entity;
        const paymentId = entity?.id;
        const orderId = entity?.order_id;
        if (paymentId && orderId) {
            try {
                const result = await fulfillCapturedPaymentIfNeeded({
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                    source: 'webhook',
                    dryRun: false,
                });
                if (!result.ok) {
                    console.error(`[webhook] fulfill failed order=${orderId} payment=${paymentId}`, result.reason);
                } else if (result.created) {
                    console.log(
                        `[webhook] created order ${result.order?.orderNumber} (${result.order?.id}) for ${orderId}`
                    );
                }
            } catch (e) {
                const code = e.code || '';
                const msg = e.message || String(e);
                console.error(`[webhook] fulfill error order=${orderId}:`, msg);
                if (code === 'INSUFFICIENT_STOCK') {
                    try {
                        await paymentCheckoutAttemptService.markReconcileFailed(orderId, msg, code);
                    } catch (_) {
                        /* non-fatal */
                    }
                }
            }
        }
    }

    return res.status(200).json({ success: true, received: true });
}

module.exports = {
    handleWebhook,
};
