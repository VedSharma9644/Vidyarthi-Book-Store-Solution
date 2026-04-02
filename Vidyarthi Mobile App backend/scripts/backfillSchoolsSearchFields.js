require('dotenv').config();
const { db } = require('../src/config/firebase');

function normalizeUpper(value) {
  if (value == null) return '';
  return String(value).trim().toUpperCase();
}

function normalizeLower(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase();
}

async function backfill() {
  const dryRun = process.argv.includes('--dry-run');
  const limitArgIndex = process.argv.findIndex((x) => x === '--limit');
  const limit = limitArgIndex >= 0 ? Number(process.argv[limitArgIndex + 1]) : null;

  if (Number.isNaN(limit)) {
    throw new Error('Invalid --limit value');
  }

  console.log(`Starting schools backfill${dryRun ? ' (dry-run)' : ''}${limit ? ` (limit=${limit})` : ''}...`);

  const schoolsRef = db.collection('schools');
  let query = schoolsRef;
  if (limit) query = query.limit(limit);

  const snapshot = await query.get();
  console.log(`Fetched ${snapshot.size} school documents.`);

  let toUpdate = 0;
  let updated = 0;

  let batch = db.batch();
  let batchOps = 0;
  const commitBatch = async () => {
    if (batchOps === 0) return;
    if (!dryRun) {
      await batch.commit();
    }
    updated += batchOps;
    batch = db.batch();
    batchOps = 0;
  };

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const codeUpper = normalizeUpper(data.code);
    const nameLower = normalizeLower(data.name);

    const patch = {};
    if (data.codeUpper !== codeUpper) patch.codeUpper = codeUpper;
    if (data.nameLower !== nameLower) patch.nameLower = nameLower;

    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) continue;

    toUpdate += 1;
    if (dryRun) continue;

    batch.set(doc.ref, patch, { merge: true });
    batchOps += 1;

    // Firestore batch limit is 500 writes
    if (batchOps >= 450) {
      await commitBatch();
    }
  }

  await commitBatch();

  console.log(`Documents needing update: ${toUpdate}`);
  console.log(`Documents updated: ${dryRun ? 0 : updated}`);
  console.log('Done.');
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exitCode = 1;
});

