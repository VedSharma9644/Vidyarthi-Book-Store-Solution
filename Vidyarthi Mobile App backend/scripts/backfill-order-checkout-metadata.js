/**
 * Backfill missing STUDENT NAME on existing orders from payment_checkout_attempts.
 *
 * SAFE: This script does NOT create orders. It only updates fields on orders that
 * already exist in Firestore (same document id / order number). No duplicates.
 *
 * Usage (from "Vidyarthi Mobile App backend" directory):
 *   node scripts/backfill-order-checkout-metadata.js --dry-run
 *   node scripts/backfill-order-checkout-metadata.js
 *   node scripts/backfill-order-checkout-metadata.js --days=60 --limit=300
 *   node scripts/backfill-order-checkout-metadata.js --order-id=FIRESTORE_ORDER_DOC_ID
 *
 * Requires Firebase credentials (.env / serviceAccountKey.json).
 */

'use strict';

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('../src/config/firebase');

const { db } = require('../src/config/firebase');
const orderService = require('../src/services/orderService');

const ATTEMPTS_COLLECTION = 'payment_checkout_attempts';

function parseArgs(argv) {
    const dryRun = argv.includes('--dry-run');
    let days = 90;
    const daysArg = argv.find((a) => a.startsWith('--days='));
    if (daysArg) {
        const n = parseInt(daysArg.split('=')[1], 10);
        if (!Number.isNaN(n) && n > 0) {
            days = n;
        }
    }
    let limit = 500;
    const limitArg = argv.find((a) => a.startsWith('--limit='));
    if (limitArg) {
        const n = parseInt(limitArg.split('=')[1], 10);
        if (!Number.isNaN(n) && n > 0) {
            limit = n;
        }
    }
    const orderIdArg = argv.find((a) => a.startsWith('--order-id='));
    const orderId = orderIdArg ? String(orderIdArg.split('=')[1] || '').trim() : null;
    return { dryRun, days, limit, orderId };
}

function hasStudentName(data) {
    return Boolean(
        (data?.orderingForStudent?.name && String(data.orderingForStudent.name).trim()) ||
            (data?.shippingAddress?.studentName && String(data.shippingAddress.studentName).trim())
    );
}

function needsStudentBackfill(data) {
    return Boolean(data && typeof data === 'object' && !hasStudentName(data));
}

function createdAtMs(data) {
    const c = data?.createdAt;
    if (!c) {
        return 0;
    }
    if (typeof c.toMillis === 'function') {
        return c.toMillis();
    }
    if (c._seconds != null) {
        return c._seconds * 1000;
    }
    return 0;
}

async function fetchAttempt(razorpayOrderId) {
    if (!razorpayOrderId) {
        return null;
    }
    const snap = await db.collection(ATTEMPTS_COLLECTION).doc(String(razorpayOrderId)).get();
    if (!snap.exists) {
        return null;
    }
    return { id: snap.id, ...snap.data() };
}

async function loadOrders({ orderId, days, limit }) {
    if (orderId) {
        const snap = await db.collection('orders').doc(orderId).get();
        if (!snap.exists) {
            throw new Error(`Order not found: ${orderId}`);
        }
        return [{ id: snap.id, ...snap.data() }];
    }

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const snapshot = await db
        .collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((order) => createdAtMs(order) >= cutoff);
}

async function backfillStudentName(order, attempt, dryRun) {
    const orderingStudent = attempt.orderingForStudent || null;
    const studentName =
        orderingStudent?.name && String(orderingStudent.name).trim()
            ? String(orderingStudent.name).trim()
            : null;

    if (!studentName) {
        return { status: 'skip_no_student_on_attempt' };
    }

    if (!needsStudentBackfill(order)) {
        return { status: 'skip_already_has_student' };
    }

    if (dryRun) {
        return { status: 'dry_run_would_patch', studentName };
    }

    // Student name only — orderChannel is intentionally omitted (no channel changes).
    const patched = await orderService.patchOrderCheckoutMetadataIfMissing(
        order.id,
        {
            orderingStudent,
            shippingAddress: attempt.shippingAddress || null,
        },
        order.userId || null
    );
    if (!patched) {
        return { status: 'error_patch_returned_null' };
    }

    return {
        status: 'patched',
        studentName:
            patched.orderingForStudent?.name ||
            patched.shippingAddress?.studentName ||
            studentName,
    };
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    console.log('[backfill-student-names] starting (updates existing orders only — no new orders)', opts);

    const orders = await loadOrders(opts);
    console.log(`[backfill-student-names] loaded ${orders.length} order(s) to scan`);

    const stats = {
        scanned: 0,
        candidates: 0,
        patched: 0,
        dryRunWouldPatch: 0,
        skipAlreadyHasStudent: 0,
        skipNoAttempt: 0,
        skipNoStudentOnAttempt: 0,
        errors: 0,
    };

    for (const order of orders) {
        stats.scanned += 1;

        if (!needsStudentBackfill(order)) {
            stats.skipAlreadyHasStudent += 1;
            continue;
        }

        stats.candidates += 1;
        const razorpayOrderId = order.razorpayOrderId;
        if (!razorpayOrderId) {
            stats.skipNoAttempt += 1;
            console.log(
                `[skip] ${order.orderNumber || order.id} — no razorpayOrderId, cannot lookup attempt`
            );
            continue;
        }

        let attempt;
        try {
            attempt = await fetchAttempt(razorpayOrderId);
        } catch (e) {
            stats.errors += 1;
            console.error(`[error] attempt lookup ${order.id}:`, e.message);
            continue;
        }

        if (!attempt) {
            stats.skipNoAttempt += 1;
            console.log(
                `[skip] ${order.orderNumber || order.id} — no checkout attempt for ${razorpayOrderId}`
            );
            continue;
        }

        try {
            const result = await backfillStudentName(order, attempt, opts.dryRun);
            switch (result.status) {
                case 'patched':
                    stats.patched += 1;
                    console.log(
                        `[patched] ${order.orderNumber || order.id} student="${result.studentName}"`
                    );
                    break;
                case 'dry_run_would_patch':
                    stats.dryRunWouldPatch += 1;
                    console.log(
                        `[dry-run] would patch ${order.orderNumber || order.id} student="${result.studentName}"`
                    );
                    break;
                case 'skip_no_student_on_attempt':
                    stats.skipNoStudentOnAttempt += 1;
                    console.log(
                        `[skip] ${order.orderNumber || order.id} — checkout attempt has no student name`
                    );
                    break;
                case 'skip_already_has_student':
                    stats.skipAlreadyHasStudent += 1;
                    break;
                default:
                    stats.errors += 1;
                    console.error(`[error] ${order.orderNumber || order.id} — ${result.status}`);
            }
        } catch (e) {
            stats.errors += 1;
            console.error(`[error] patch ${order.orderNumber || order.id}:`, e.message);
        }
    }

    console.log('[backfill-student-names] done', stats);
    process.exit(stats.errors > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error('[backfill-student-names] fatal', err);
    process.exit(1);
});
