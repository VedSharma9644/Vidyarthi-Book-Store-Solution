/** Fallback when cart API has no deliveryCharge (older backend). */
export const DEFAULT_DELIVERY_CHARGE = 300;

/**
 * Resolve delivery charge for UI from cart API value.
 * Empty cart → 0. Missing/invalid API value → default 300.
 * @param {*} apiValue
 * @param {number} itemCount
 * @returns {number}
 */
export function resolveClientDeliveryCharge(apiValue, itemCount = 0) {
  if (!itemCount) {
    return 0;
  }
  if (apiValue !== undefined && apiValue !== null && apiValue !== '') {
    const n = Number(apiValue);
    if (Number.isFinite(n) && n >= 0) {
      return n;
    }
  }
  return DEFAULT_DELIVERY_CHARGE;
}
