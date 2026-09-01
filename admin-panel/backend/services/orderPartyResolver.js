/**
 * Resolve parent and student names on orders (website checkout + legacy mobile shapes).
 */

function trimOrEmpty(value) {
  return value != null && String(value).trim() ? String(value).trim() : '';
}

/** Student name from orderingForStudent, shipping address, or legacy top-level field. */
function resolveStudentName(data) {
  if (!data || typeof data !== 'object') {
    return '';
  }
  return (
    trimOrEmpty(data.orderingForStudent?.name) ||
    trimOrEmpty(data.shippingAddress?.studentName) ||
    trimOrEmpty(data.studentName) ||
    ''
  );
}

/** orderingForStudent object with a resolved name (for invoice / display). */
function resolveOrderingForStudent(data) {
  const name = resolveStudentName(data);
  if (!name) {
    return data?.orderingForStudent || null;
  }
  const base =
    data.orderingForStudent && typeof data.orderingForStudent === 'object'
      ? { ...data.orderingForStudent }
      : {};
  return { ...base, name };
}

/** Parent / account holder name stored on the order (before async user lookup). */
function resolveParentNameFromOrder(data) {
  if (!data || typeof data !== 'object') {
    return '';
  }
  const info = data.customerInfo || {};
  const infoName = trimOrEmpty(info.name);
  if (infoName && infoName.toLowerCase() !== 'customer') {
    return infoName;
  }
  const parentFull = trimOrEmpty(info.parentFullName);
  if (parentFull) {
    return parentFull;
  }
  const shipName = trimOrEmpty(data.shippingAddress?.name);
  if (shipName) {
    return shipName;
  }
  return infoName;
}

module.exports = {
  resolveStudentName,
  resolveOrderingForStudent,
  resolveParentNameFromOrder,
};
