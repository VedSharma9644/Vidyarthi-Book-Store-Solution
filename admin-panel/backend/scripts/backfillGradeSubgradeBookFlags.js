/**
 * One-time backfill: set hasActiveBooks on every active grade and subgrade.
 * Run: node scripts/backfillGradeSubgradeBookFlags.js
 * From: admin-panel/backend (with .env / service account)
 */
require('dotenv').config();
const { db } = require('../config/database');
const {
  refreshSubgradeHasActiveBooks,
  refreshGradeHasActiveBooks,
} = require('../services/bookInventoryFlagsService');

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const subSnap = await db.collection('subgrades').where('isActive', '==', true).get();
  console.log(`Subgrades to refresh: ${subSnap.size}`);
  if (!dryRun) {
    for (const doc of subSnap.docs) {
      await refreshSubgradeHasActiveBooks(doc.id);
    }
  }

  const gradeSnap = await db.collection('grades').where('isActive', '==', true).get();
  console.log(`Grades to refresh: ${gradeSnap.size}`);
  if (!dryRun) {
    for (const doc of gradeSnap.docs) {
      await refreshGradeHasActiveBooks(doc.id);
    }
  }

  console.log(dryRun ? 'Dry run complete (no writes).' : 'Backfill complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
