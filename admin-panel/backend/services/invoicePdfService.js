/**
 * Builds a printable order invoice (PDF) for admin download.
 * Includes bill-to, shipping, payment summary, student, product lines (unit × qty = total), totals.
 */
const PDFDocument = require('pdfkit');
const https = require('https');

const LOGO_URL = 'https://vidyarthibooksonline.com/images/logo.png';
const MARGIN = 48;
const PAGE_BOTTOM_PAD = 56;

function formatInr(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

/** Plain amount for invoice table columns (e.g. 62, 124). */
function formatAmountPlain(amount) {
  const n = Number(amount) || 0;
  if (Math.abs(n - Math.round(n)) < 0.005) {
    return String(Math.round(n));
  }
  return n.toFixed(2);
}

/**
 * Invoice line: PR UNIT × QTY = TOTAL (matches order subtotal).
 * - Single-unit items (textbooks): price & quantity from order (e.g. 62 × 2 = 124).
 * - Bundles (productQuantity > 1): per-piece unit price × total pieces to deliver.
 */
function resolveLineItemPricing(item) {
  const cartQty = Math.max(1, parseInt(item.quantity, 10) || 1);
  const bundlePrice = Number(item.price) || 0;
  let lineTotal = Number(item.subtotal);
  if (!Number.isFinite(lineTotal) || lineTotal <= 0) {
    lineTotal = bundlePrice * cartQty;
  }

  const unitsPerBundle = Math.max(1, parseInt(item.productQuantity, 10) || 1);
  if (unitsPerBundle > 1) {
    const perUnitFromBook = Number(item.perProductPrice);
    const unitPrice =
      Number.isFinite(perUnitFromBook) && perUnitFromBook > 0
        ? perUnitFromBook
        : bundlePrice > 0
          ? bundlePrice / unitsPerBundle
          : lineTotal / (cartQty * unitsPerBundle);
    const qty = cartQty * unitsPerBundle;
    return { qty, unitPrice, lineTotal };
  }

  return { qty: cartQty, unitPrice: bundlePrice, lineTotal };
}

function safeFilePart(s) {
  return String(s || 'order')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 80);
}

async function fetchLogoBuffer(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/** Bottom Y limit for content on the current page. */
function pageBottom(doc) {
  return doc.page.height - PAGE_BOTTOM_PAD;
}

/**
 * Advance to a new page when needed. Uses explicit cursor Y — not doc.y — so
 * absolute-positioned text does not trigger a page break per row.
 * @returns {number} Y position to continue drawing at
 */
function ensureY(doc, y, needed = 80) {
  if (y + needed > pageBottom(doc)) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

/** Keep PDFKit's internal cursor aligned with our layout cursor. */
function syncDocY(doc, y) {
  doc.x = MARGIN;
  doc.y = y;
}

/**
 * Draw text at (x, y) and return the Y position after the block.
 */
function drawAt(doc, text, x, y, options = {}) {
  doc.text(text, x, y, options);
  return y + doc.heightOfString(text, options);
}

/**
 * @param {object} order - Normalized order view from orderController
 * @param {import('express').Response} res
 */
async function renderOrderInvoicePdf(order, res) {
  const doc = new PDFDocument({
    margin: MARGIN,
    size: 'A4',
    info: { Title: `Invoice ${order.orderNumber}` },
  });

  const filename = `Invoice_Order_${safeFilePart(order.orderNumber)}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  const left = MARGIN;
  const contentWidth = doc.page.width - MARGIN * 2;
  let y = MARGIN;

  const logoBuf = await fetchLogoBuffer(LOGO_URL);
  let headerTextX = left;
  if (logoBuf) {
    try {
      doc.image(logoBuf, left, y, { height: 42 });
      headerTextX = left + 115;
    } catch (_) {
      /* ignore bad image */
    }
  }

  doc
    .fontSize(17)
    .fillColor('#0d47a1')
    .text(`Invoice — Order #${order.orderNumber}`, headerTextX, y + 6, {
      width: contentWidth - (headerTextX - left) - 100,
    });
  doc
    .fontSize(10)
    .fillColor('#424242')
    .text(`Date: ${order.dateLabel}`, left + contentWidth - 100, y + 10, {
      width: 100,
      align: 'right',
    });

  y += 52;
  doc.moveTo(left, y).lineTo(left + contentWidth, y).stroke('#bdbdbd');
  y += 14;

  doc.fillColor('#000000').font('Helvetica');

  // Two columns: Bill to + Payment | Shipping address
  const colGap = 20;
  const colW = (contentWidth - colGap) / 2;
  const xLeft = left;
  const xRight = left + colW + colGap;

  const billPhone = order.shippingAddress?.phone || order.customerInfo?.phoneNumber;
  const parentName =
    order.parentName || order.customerName || order.customerInfo?.name || 'Customer';
  const billBody = [
    `Parent / guardian: ${parentName}`,
    ...(order.customerInfo?.email ? [`Email: ${order.customerInfo.email}`] : []),
    ...(billPhone ? [`Phone: ${billPhone}`] : []),
  ].join('\n');

  let shipBody = '';
  if (order.shippingAddress && (order.shippingAddress.address || order.shippingAddress.city)) {
    const sa = order.shippingAddress;
    shipBody = [
      sa.name,
      sa.address,
      [sa.city, sa.state, sa.postalCode].filter(Boolean).join(', '),
      sa.country,
    ]
      .filter(Boolean)
      .join('\n');
  } else {
    shipBody = 'Not provided';
  }

  let yL = y;
  let yR = y;

  doc.font('Helvetica-Bold').fontSize(11);
  yL = drawAt(doc, 'Bill to', xLeft, yL, { width: colW, underline: true }) + 4;

  doc.font('Helvetica').fontSize(10);
  yL = drawAt(doc, billBody, xLeft, yL, { width: colW }) + 12;

  doc.font('Helvetica-Bold').fontSize(11);
  yR = drawAt(doc, 'Shipping address', xRight, yR, { width: colW, underline: true }) + 4;

  doc.font('Helvetica').fontSize(10);
  yR = drawAt(doc, shipBody, xRight, yR, { width: colW });

  doc.font('Helvetica-Bold').fontSize(11);
  yL = drawAt(doc, 'Payment details', xLeft, yL, { width: colW, underline: true }) + 4;

  doc.font('Helvetica').fontSize(10);
  yL = drawAt(doc, `Payment status: ${order.paymentStatus || '—'}`, xLeft, yL, { width: colW }) + 2;

  doc.font('Helvetica-Bold').fontSize(10);
  yL = drawAt(doc, `Amount (order total): ${formatInr(order.total)}`, xLeft, yL, { width: colW });

  y = Math.max(yL, yR) + 12;
  syncDocY(doc, y);

  // Student block
  y = ensureY(doc, y, 90);
  syncDocY(doc, y);
  doc.fontSize(11).font('Helvetica-Bold');
  y = drawAt(doc, 'Order placed for (student)', left, y, { width: contentWidth, underline: true }) + 4;

  doc.fontSize(10).font('Helvetica');
  const st = order.orderingForStudent;
  const studentDisplayName =
    (st && st.name && String(st.name).trim()) ||
    (order.studentName && String(order.studentName).trim()) ||
    '';
  if (studentDisplayName) {
    const studentLines = [
      `Student name: ${studentDisplayName}`,
      st?.age ? `Age: ${st.age}` : null,
      st?.gender ? `Gender: ${st.gender}` : null,
      st?.schoolLabel ? `School: ${st.schoolLabel}` : null,
      st?.gradeLabel ? `Class / grade: ${st.gradeLabel}` : null,
      st?.id ? `Student record ID: ${st.id}` : null,
    ].filter(Boolean);
    for (const line of studentLines) {
      y = drawAt(doc, line, left, y, { width: contentWidth });
    }
  } else {
    y = drawAt(
      doc,
      'No student linked — order placed under the parent / account holder (general purchase).',
      left,
      y,
      { width: contentWidth }
    );
  }
  y += 10;

  if (order.trackingNumber || order.shiprocketAWB) {
    y = ensureY(doc, y, 50);
    syncDocY(doc, y);
    doc.fontSize(11).font('Helvetica-Bold');
    y = drawAt(doc, 'Delivery / tracking', left, y, { width: contentWidth, underline: true }) + 4;
    doc.fontSize(10).font('Helvetica');
    if (order.trackingNumber) {
      y = drawAt(doc, `Tracking (AWB): ${order.trackingNumber}`, left, y, { width: contentWidth });
    }
    if (order.shiprocketAWB && String(order.shiprocketAWB) !== String(order.trackingNumber)) {
      y = drawAt(doc, `Shiprocket AWB: ${order.shiprocketAWB}`, left, y, { width: contentWidth });
    }
    y += 8;
  }

  // Line items — product, unit price, qty, line total
  y = ensureY(doc, y, 120);
  syncDocY(doc, y);
  doc.fontSize(11).font('Helvetica-Bold');
  y = drawAt(doc, 'Items to deliver', left, y, { width: contentWidth, underline: true }) + 8;

  const items = order.items || [];
  const colTotalW = 58;
  const colQtyW = 36;
  const colUnitW = 58;
  const colProdW = contentWidth - colUnitW - colQtyW - colTotalW - 12;
  const colUnitX = left + colProdW + 8;
  const colQtyX = colUnitX + colUnitW;
  const colTotalX = colQtyX + colQtyW;
  const rowOpts = { lineGap: 2 };

  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('PRODUCT', left, y, { width: colProdW });
  doc.text('PR UNIT', colUnitX, y, { width: colUnitW, align: 'right' });
  doc.text('QTY', colQtyX, y, { width: colQtyW, align: 'right' });
  doc.text('TOTAL', colTotalX, y, { width: colTotalW, align: 'right' });
  y += 16;

  doc.moveTo(left, y).lineTo(left + contentWidth, y).stroke('#e0e0e0');
  y += 6;

  doc.font('Helvetica').fontSize(10);

  items.forEach((item) => {
    const title = (item.title || 'Item').toString().trim();
    const { qty, unitPrice, lineTotal } = resolveLineItemPricing(item);

    const rowH = Math.max(
      doc.heightOfString(title, { width: colProdW, ...rowOpts }),
      14
    );

    y = ensureY(doc, y, rowH + 12);

    doc.text(title, left, y, { width: colProdW, ...rowOpts });
    doc.text(formatAmountPlain(unitPrice), colUnitX, y, { width: colUnitW, align: 'right' });
    doc.text(String(qty), colQtyX, y, { width: colQtyW, align: 'right' });
    doc.text(formatAmountPlain(lineTotal), colTotalX, y, { width: colTotalW, align: 'right' });

    y += rowH + 8;
  });

  y += 8;
  y = ensureY(doc, y, 100);
  syncDocY(doc, y);

  doc.font('Helvetica').fontSize(10);
  const totalLines = [
    `Subtotal: ${formatInr(order.subtotal)}`,
    `Delivery charge: ${formatInr(order.deliveryCharge)}`,
    `Tax: ${formatInr(order.tax)}`,
  ];
  for (const line of totalLines) {
    y = drawAt(doc, line, left, y, { width: contentWidth, align: 'right' });
  }
  y += 4;
  doc.font('Helvetica-Bold').fontSize(11);
  y = drawAt(doc, `Order total: ${formatInr(order.total)}`, left, y, {
    width: contentWidth,
    align: 'right',
  });
  y += 16;

  doc.moveTo(left + contentWidth - 160, y).lineTo(left + contentWidth, y).stroke('#616161');
  y += 10;
  doc.font('Helvetica-Oblique').fontSize(9);
  y = drawAt(doc, 'Authorized signatory', left, y, { width: contentWidth, align: 'right' });
  y += 20;

  doc.font('Helvetica').fontSize(9).fillColor('#616161');
  y = drawAt(doc, 'Thank you for your purchase!', left, y, { width: contentWidth, align: 'center' });
  drawAt(doc, 'https://vidyarthibooksonline.com/', left, y, { width: contentWidth, align: 'center' });

  doc.end();
}

module.exports = {
  renderOrderInvoicePdf,
  safeFilePart,
  formatInr,
};
