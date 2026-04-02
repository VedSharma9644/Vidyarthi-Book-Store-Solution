const { db } = require('../config/database');
const { FieldValue } = require('firebase-admin/firestore');

const TS = () => FieldValue.serverTimestamp();

/**
 * Maintain hasActiveBooks on grades/subgrades from active books (limit-1 queries only).
 * Call after book create / update / delete from admin panel.
 */

async function refreshSubgradeHasActiveBooks(subgradeId) {
  const sid = subgradeId != null ? String(subgradeId).trim() : '';
  if (!sid) return;

  const snap = await db
    .collection('books')
    .where('subgradeId', '==', sid)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  const has = !snap.empty;
  await db.collection('subgrades').doc(sid).set(
    { hasActiveBooks: has, bookFlagsUpdatedAt: TS() },
    { merge: true }
  );
}

async function refreshGradeHasActiveBooks(gradeId) {
  const gid = gradeId != null ? String(gradeId).trim() : '';
  if (!gid) return;

  const direct = await db
    .collection('books')
    .where('gradeId', '==', gid)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (!direct.empty) {
    await db.collection('grades').doc(gid).set(
      { hasActiveBooks: true, bookFlagsUpdatedAt: TS() },
      { merge: true }
    );
    return;
  }

  const subsSnap = await db
    .collection('subgrades')
    .where('gradeId', '==', gid)
    .where('isActive', '==', true)
    .get();

  for (const doc of subsSnap.docs) {
    const flag = doc.data().hasActiveBooks;
    if (flag === true) {
      await db.collection('grades').doc(gid).set(
        { hasActiveBooks: true, bookFlagsUpdatedAt: TS() },
        { merge: true }
      );
      return;
    }
  }

  for (const doc of subsSnap.docs) {
    const subId = doc.id;
    const b = await db
      .collection('books')
      .where('subgradeId', '==', subId)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    if (!b.empty) {
      await db.collection('grades').doc(gid).set(
        { hasActiveBooks: true, bookFlagsUpdatedAt: TS() },
        { merge: true }
      );
      return;
    }
  }

  await db.collection('grades').doc(gid).set(
    { hasActiveBooks: false, bookFlagsUpdatedAt: TS() },
    { merge: true }
  );
}

function snapshotToRefBook(doc) {
  if (!doc || !doc.exists) return null;
  const d = doc.data() || {};
  return {
    gradeId: d.gradeId || '',
    subgradeId: d.subgradeId || '',
    isActive: d.isActive !== false,
  };
}

function modelToRefBook(book) {
  if (!book) return null;
  return {
    gradeId: book.gradeId || '',
    subgradeId: book.subgradeId || '',
    isActive: book.isActive !== false,
  };
}

/**
 * @param {object|null} oldBook - from Firestore or Book model
 * @param {object|null} newBook - from Firestore or Book model
 */
async function refreshAfterBookChange(oldBook, newBook) {
  const gradeIds = new Set();
  const subgradeIds = new Set();

  for (const b of [oldBook, newBook]) {
    if (!b) continue;
    if (b.gradeId) gradeIds.add(String(b.gradeId));
    if (b.subgradeId) subgradeIds.add(String(b.subgradeId));
  }

  for (const sg of subgradeIds) {
    await refreshSubgradeHasActiveBooks(sg);
  }
  for (const g of gradeIds) {
    await refreshGradeHasActiveBooks(g);
  }
}

module.exports = {
  refreshSubgradeHasActiveBooks,
  refreshGradeHasActiveBooks,
  refreshAfterBookChange,
  snapshotToRefBook,
  modelToRefBook,
};
