const XLSX = require('xlsx');
const { Timestamp } = require('firebase-admin/firestore');
const { db } = require('../config/database');

const MAX_RANGE_DAYS = 366;
const MAX_ORDERS = 10000;

function parseYmd(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const trimmed = ymd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [y, m, d] = trimmed.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** @param {string} hm - HH:mm or HH:mm:ss */
function parseHm(hm) {
  if (!hm || typeof hm !== 'string') return null;
  const trimmed = hm.trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] != null ? parseInt(match[3], 10) : null;
  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    (seconds != null && (seconds < 0 || seconds > 59))
  ) {
    return null;
  }
  return { hours, minutes, seconds };
}

function applyTime(d, hm, boundary) {
  const parsed = parseHm(hm);
  if (!parsed) return d;
  const x = new Date(d);
  if (boundary === 'end') {
    x.setHours(
      parsed.hours,
      parsed.minutes,
      parsed.seconds != null ? parsed.seconds : 59,
      parsed.seconds != null ? 0 : 999
    );
  } else {
    x.setHours(
      parsed.hours,
      parsed.minutes,
      parsed.seconds != null ? parsed.seconds : 0,
      0
    );
  }
  return x;
}

function daysBetweenInclusive(from, to) {
  const ms = endOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

function validateOptionalTime(query, field) {
  const raw = query[field];
  if (raw == null || String(raw).trim() === '') return;
  if (!parseHm(String(raw).trim())) {
    const err = new Error(`Invalid ${field}. Use HH:mm (24-hour)`);
    err.code = 'INVALID_DATE';
    throw err;
  }
}

/**
 * @param {{ date?: string, from?: string, to?: string, fromTime?: string, toTime?: string }} query
 * @returns {{ from: Date, to: Date, fromLabel: string, toLabel: string }}
 */
function resolveExportDateRange(query) {
  validateOptionalTime(query, 'fromTime');
  validateOptionalTime(query, 'toTime');

  const fromTime = query.fromTime ? String(query.fromTime).trim() : '';
  const toTime = query.toTime ? String(query.toTime).trim() : '';

  const single = parseYmd(query.date);
  if (single) {
    const label = query.date.trim();
    let from = startOfDay(single);
    let to = endOfDay(single);
    if (fromTime) from = applyTime(from, fromTime, 'start');
    if (toTime) to = applyTime(to, toTime, 'end');
    if (from.getTime() > to.getTime()) {
      const err = new Error('Start time must be before end time on the selected date');
      err.code = 'INVALID_DATE';
      throw err;
    }
    const timeSuffix =
      fromTime || toTime
        ? `_${fromTime || '00:00'}_${toTime || '23:59'}`.replace(/:/g, '-')
        : '';
    return {
      from,
      to,
      fromLabel: `${label}${timeSuffix}`,
      toLabel: `${label}${timeSuffix}`,
    };
  }

  const fromParsed = parseYmd(query.from);
  if (!fromParsed) {
    const err = new Error('Provide date (YYYY-MM-DD) or from (and optional to) in YYYY-MM-DD format');
    err.code = 'INVALID_DATE';
    throw err;
  }

  const toParsed = query.to ? parseYmd(query.to) : fromParsed;
  if (!toParsed) {
    const err = new Error('Invalid to date. Use YYYY-MM-DD');
    err.code = 'INVALID_DATE';
    throw err;
  }

  let from = startOfDay(fromParsed);
  let to = endOfDay(toParsed);
  if (fromTime) from = applyTime(from, fromTime, 'start');
  if (toTime) to = applyTime(to, toTime, 'end');

  if (from.getTime() > to.getTime()) {
    const err = new Error('Start date/time must be before end date/time');
    err.code = 'INVALID_DATE';
    throw err;
  }

  const span = daysBetweenInclusive(fromParsed, toParsed);
  if (span > MAX_RANGE_DAYS) {
    const err = new Error(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
    err.code = 'RANGE_TOO_LARGE';
    throw err;
  }

  const fromLabel = query.from.trim();
  const toLabel = (query.to || query.from).trim();
  return { from, to, fromLabel, toLabel };
}

function formatOrderDate(data) {
  const createdAtDate = data.createdAt?.toDate
    ? data.createdAt.toDate()
    : data.createdAt
      ? new Date(data.createdAt)
      : null;
  if (!createdAtDate || Number.isNaN(createdAtDate.getTime())) {
    return '';
  }
  return createdAtDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatIsoDate(data) {
  const createdAtDate = data.createdAt?.toDate
    ? data.createdAt.toDate()
    : data.createdAt
      ? new Date(data.createdAt)
      : null;
  if (!createdAtDate || Number.isNaN(createdAtDate.getTime())) {
    return '';
  }
  return createdAtDate.toISOString().slice(0, 10);
}

const { resolveParentNameFromOrder, resolveStudentName } = require('./orderPartyResolver');

function customerNameFromOrder(data) {
  return resolveParentNameFromOrder(data) || '';
}

function formatShippingLine(addr) {
  if (!addr || typeof addr !== 'object') return '';
  const parts = [];
  const line = addr.address || addr.line1 || addr.street || '';
  if (line) parts.push(String(line).trim());
  if (addr.city) parts.push(String(addr.city).trim());
  if (addr.state) parts.push(String(addr.state).trim());
  const pin = addr.postalCode || addr.pincode || addr.pinCode || '';
  if (pin) parts.push(String(pin).trim());
  if (addr.country && addr.country !== 'India') parts.push(String(addr.country).trim());
  return parts.filter(Boolean).join(', ');
}

function num(n) {
  const v = parseFloat(n);
  return Number.isFinite(v) ? v : 0;
}

async function fetchOrdersInRange(from, to) {
  const snap = await db
    .collection('orders')
    .where('createdAt', '>=', Timestamp.fromDate(from))
    .where('createdAt', '<=', Timestamp.fromDate(to))
    .orderBy('createdAt', 'desc')
    .limit(MAX_ORDERS + 1)
    .get();

  if (snap.size > MAX_ORDERS) {
    const err = new Error(`Too many orders (>${MAX_ORDERS}). Narrow the date range.`);
    err.code = 'TOO_MANY_ORDERS';
    throw err;
  }

  return snap.docs;
}

/** Resolve class/section from student profile or first line item's book. */
async function buildListMetaByOrderId(docs) {
  const metaByItemId = {};
  const subgradeCache = {};
  const gradeCache = {};

  const itemIds = [
    ...new Set(
      docs
        .map((doc) => doc.data().items?.[0]?.itemId)
        .filter(Boolean)
    ),
  ];

  const BATCH = 30;
  for (let i = 0; i < itemIds.length; i += BATCH) {
    const chunk = itemIds.slice(i, i + BATCH);
    const refs = chunk.map((id) => db.collection('books').doc(id));
    const bookSnaps = await db.getAll(...refs);
    const subgradeIds = new Set();
    const gradeIds = new Set();
    for (const snap of bookSnaps) {
      if (!snap.exists) continue;
      const book = snap.data();
      if (book.subgradeId) subgradeIds.add(book.subgradeId);
      if (book.gradeId) gradeIds.add(book.gradeId);
      metaByItemId[snap.id] = { gradeId: book.gradeId, subgradeId: book.subgradeId };
    }
    await Promise.all(
      [...subgradeIds].map(async (id) => {
        if (subgradeCache[id] !== undefined) return;
        try {
          const doc = await db.collection('subgrades').doc(id).get();
          subgradeCache[id] = doc.exists ? doc.data().name || '' : '';
        } catch {
          subgradeCache[id] = '';
        }
      })
    );
    await Promise.all(
      [...gradeIds].map(async (id) => {
        if (gradeCache[id] !== undefined) return;
        try {
          const doc = await db.collection('grades').doc(id).get();
          gradeCache[id] = doc.exists ? doc.data().name || '' : '';
        } catch {
          gradeCache[id] = '';
        }
      })
    );
    for (const snap of bookSnaps) {
      if (!snap.exists) continue;
      const book = snap.data();
      metaByItemId[snap.id] = {
        gradeName: book.gradeId ? gradeCache[book.gradeId] || '' : '',
        sectionName: book.subgradeId ? subgradeCache[book.subgradeId] || '' : '',
      };
    }
  }

  const byOrderId = {};
  for (const doc of docs) {
    const data = doc.data();
    const student = data.orderingForStudent || {};
    let className =
      (student.gradeLabel && String(student.gradeLabel).trim()) ||
      (data.customerInfo?.classStandard && String(data.customerInfo.classStandard).trim()) ||
      '';
    let sectionName = '';
    const firstItemId = data.items?.[0]?.itemId;
    if (firstItemId && metaByItemId[firstItemId]) {
      const meta = metaByItemId[firstItemId];
      if (!className && meta.gradeName) className = meta.gradeName;
      if (meta.sectionName) sectionName = meta.sectionName;
    }
    byOrderId[doc.id] = { className, sectionName };
  }
  return byOrderId;
}

function buildOrderSummaryRow(doc, listMeta = {}) {
  const data = doc.data();
  const student = data.orderingForStudent || {};
  const ship = data.shippingAddress || {};
  const info = data.customerInfo || {};

  const className =
    (student.gradeLabel && String(student.gradeLabel).trim()) ||
    listMeta.className ||
    info.classStandard ||
    '';
  const sectionName = listMeta.sectionName || '';

  return {
    'Order Number': data.orderNumber || '',
    'Order ID': doc.id,
    'Order Date': formatOrderDate(data),
    'Date (ISO)': formatIsoDate(data),
    'Order Status': data.orderStatus || '',
    'Payment Status': data.paymentStatus || '',
    'Delivery Status': data.deliveryStatus || '',
    'Customer Name': customerNameFromOrder(data) || info.name || '',
    'Customer Phone': ship.phone || info.phoneNumber || '',
    'Customer Email': info.email || '',
    'Student Name':
      (student.name && String(student.name).trim()) ||
      (ship.studentName && String(ship.studentName).trim()) ||
      '',
    'Class': className,
    'Section': sectionName,
    'School': student.schoolLabel || info.schoolName || '',
    'Shipping Name': ship.name || '',
    'Shipping Phone': ship.phone || '',
    'Shipping Address': ship.address || ship.line1 || '',
    'Shipping City': ship.city || '',
    'Shipping State': ship.state || '',
    'Shipping Pincode': ship.postalCode || ship.pincode || '',
    'Shipping (Full)': formatShippingLine(ship),
    'Subtotal (₹)': num(data.subtotal),
    'Delivery Charge (₹)': num(data.deliveryCharge),
    'Tax (₹)': num(data.tax),
    'Total (₹)': num(data.total),
    'Razorpay Order ID': data.razorpayOrderId || '',
    'Razorpay Payment ID': data.razorpayPaymentId || '',
    'Tracking Number': data.trackingNumber || '',
    'Shiprocket Order ID': data.shiprocketOrderId || '',
    'Shiprocket AWB': data.shiprocketAWB || '',
    'Fulfillment Source': data.fulfillmentSource || '',
    'Line Items Count': Array.isArray(data.items) ? data.items.length : 0,
  };
}

function buildLineItemRows(doc, listMeta = {}) {
  const data = doc.data();
  const orderNumber = data.orderNumber || doc.id;
  const orderDate = formatOrderDate(data);
  const student = data.orderingForStudent || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const className =
    (student.gradeLabel && String(student.gradeLabel).trim()) ||
    listMeta.className ||
    data.customerInfo?.classStandard ||
    '';

  return items.map((item, index) => ({
    'Order Number': orderNumber,
    'Order ID': doc.id,
    'Order Date': orderDate,
    'Student Name':
      (student.name && String(student.name).trim()) ||
      (data.shippingAddress?.studentName && String(data.shippingAddress.studentName).trim()) ||
      '',
    'Class': className,
    'Section': listMeta.sectionName || '',
    'Line #': index + 1,
    'Product ID': item.itemId || '',
    'Product Title': item.title || '',
    'Author': item.author || '',
    'Book Type': item.bookType || '',
    'Quantity': parseInt(item.quantity, 10) || 1,
    'Unit Price (₹)': num(item.price),
    'Line Subtotal (₹)': num(item.subtotal) || num(item.price) * (parseInt(item.quantity, 10) || 1),
  }));
}

/**
 * @param {{ date?: string, from?: string, to?: string }} query
 * @returns {Promise<{ buffer: Buffer, filename: string, orderCount: number, lineCount: number }>}
 */
async function buildOrdersExcel(query) {
  const { from, to, fromLabel, toLabel } = resolveExportDateRange(query);
  const docs = await fetchOrdersInRange(from, to);
  const listMetaByOrderId = await buildListMetaByOrderId(docs);

  const summaryRows = docs.map((doc) =>
    buildOrderSummaryRow(doc, listMetaByOrderId[doc.id] || {})
  );
  const lineRows = docs.flatMap((doc) =>
    buildLineItemRows(doc, listMetaByOrderId[doc.id] || {})
  );

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(
    summaryRows.length > 0
      ? summaryRows
      : [{ Message: 'No orders found for the selected date range' }]
  );
  const linesSheet = XLSX.utils.json_to_sheet(
    lineRows.length > 0
      ? lineRows
      : [{ Message: 'No line items for the selected date range' }]
  );

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Orders');
  XLSX.utils.book_append_sheet(workbook, linesSheet, 'Line Items');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const filename =
    fromLabel === toLabel
      ? `orders_${fromLabel}.xlsx`
      : `orders_${fromLabel}_to_${toLabel}.xlsx`;

  return {
    buffer,
    filename,
    orderCount: docs.length,
    lineCount: lineRows.length,
  };
}

module.exports = {
  buildOrdersExcel,
  resolveExportDateRange,
  MAX_RANGE_DAYS,
};
