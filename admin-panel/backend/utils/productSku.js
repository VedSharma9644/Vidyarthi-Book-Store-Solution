/**
 * Human-readable product SKU for Shiprocket / order line items.
 * Preference: explicit sku → ISBN → Firestore itemId → fallback.
 */
function resolveProductSku(parts = {}) {
  const clean = (value) =>
    String(value)
      .trim()
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);

  if (parts.sku != null && String(parts.sku).trim()) {
    const s = clean(parts.sku);
    if (s) return s;
  }
  if (parts.isbn != null && String(parts.isbn).trim()) {
    const s = clean(parts.isbn);
    if (s) return s;
  }
  if (parts.itemId != null && String(parts.itemId).trim()) {
    const s = clean(parts.itemId);
    if (s) return s;
  }
  const idx = Number.isFinite(parts.index) ? parts.index : 0;
  return `SKU-${idx + 1}`;
}

module.exports = {
  resolveProductSku,
};
