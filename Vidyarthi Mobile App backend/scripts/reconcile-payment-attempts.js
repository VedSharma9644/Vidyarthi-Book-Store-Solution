/**
 * Reconcile Razorpay checkouts: create Firestore orders when payment was captured
 * but the client never completed POST /api/orders/create.
 *
 * Usage (from "Vidyarthi Mobile App backend" directory):
 *   npm run reconcile-payments
 *   npm run reconcile-payments -- --dry-run
 *   npm run reconcile-payments -- --min-age-ms=300000
 *
 * Requires same env as the API (Firebase, Razorpay). Schedule every 5–10 minutes via cron or Cloud Scheduler.
 */

'use strict';

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

require('../src/config/firebase');

const {
    runPaymentReconciliationPass,
    DEFAULT_MIN_AGE_MS,
} = require('../src/jobs/paymentReconciliationJob');

function parseArgs(argv) {
    const dryRun = argv.includes('--dry-run');
    let minAgeMs = DEFAULT_MIN_AGE_MS;
    const minAgeArg = argv.find((a) => a.startsWith('--min-age-ms='));
    if (minAgeArg) {
        const n = parseInt(minAgeArg.split('=')[1], 10);
        if (!Number.isNaN(n) && n >= 0) {
            minAgeMs = n;
        }
    }
    let maxAttempts = 80;
    const maxArg = argv.find((a) => a.startsWith('--max-attempts='));
    if (maxArg) {
        const n = parseInt(maxArg.split('=')[1], 10);
        if (!Number.isNaN(n) && n > 0) {
            maxAttempts = n;
        }
    }
    return { dryRun, minAgeMs, maxAttempts };
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    console.log('[reconcile] starting', opts);
    const stats = await runPaymentReconciliationPass(opts);
    console.log('[reconcile] done', stats);
}

main().catch((err) => {
    console.error('[reconcile] fatal', err);
    process.exit(1);
});
