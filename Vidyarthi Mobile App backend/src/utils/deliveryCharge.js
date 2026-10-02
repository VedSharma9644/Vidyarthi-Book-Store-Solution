const { db } = require('../config/firebase');

/** Default delivery charge (₹) when school has no value set. */
const DEFAULT_DELIVERY_CHARGE = 300;

/**
 * Parse school delivery charge. Missing/invalid → default 300. Explicit 0 allowed.
 * @param {*} value
 * @returns {number}
 */
function parseSchoolDeliveryCharge(value) {
    if (value === undefined || value === null || value === '') {
        return DEFAULT_DELIVERY_CHARGE;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        return DEFAULT_DELIVERY_CHARGE;
    }
    return n;
}

/**
 * Resolve delivery charge for cart/order line items via books → schools.
 * Multi-school carts: use the highest school charge (do not undercharge).
 * Empty cart: 0.
 *
 * @param {Array<{ itemId?: string }|string>} itemsOrIds - cart/order lines or raw item IDs
 * @returns {Promise<{
 *   deliveryCharge: number,
 *   schoolIds: string[],
 *   chargesBySchoolId: Record<string, number>,
 * }>}
 */
async function resolveDeliveryChargeForCartItems(itemsOrIds = []) {
    const itemIds = [
        ...new Set(
            (itemsOrIds || [])
                .map((entry) => {
                    if (entry == null) return '';
                    if (typeof entry === 'string' || typeof entry === 'number') {
                        return String(entry).trim();
                    }
                    return entry.itemId != null ? String(entry.itemId).trim() : '';
                })
                .filter(Boolean)
        ),
    ];

    if (itemIds.length === 0) {
        return {
            deliveryCharge: 0,
            schoolIds: [],
            chargesBySchoolId: {},
        };
    }

    const schoolIdSet = new Set();
    await Promise.all(
        itemIds.map(async (itemId) => {
            try {
                const bookSnap = await db.collection('books').doc(itemId).get();
                if (!bookSnap.exists) return;
                const schoolId = bookSnap.data()?.schoolId;
                if (schoolId != null && String(schoolId).trim()) {
                    schoolIdSet.add(String(schoolId).trim());
                }
            } catch (e) {
                console.warn(`[deliveryCharge] book lookup failed ${itemId}:`, e.message);
            }
        })
    );

    const schoolIds = [...schoolIdSet];
    const chargesBySchoolId = {};

    if (schoolIds.length === 0) {
        return {
            deliveryCharge: DEFAULT_DELIVERY_CHARGE,
            schoolIds: [],
            chargesBySchoolId: {},
        };
    }

    await Promise.all(
        schoolIds.map(async (schoolId) => {
            try {
                const schoolSnap = await db.collection('schools').doc(schoolId).get();
                if (!schoolSnap.exists) {
                    chargesBySchoolId[schoolId] = DEFAULT_DELIVERY_CHARGE;
                    return;
                }
                chargesBySchoolId[schoolId] = parseSchoolDeliveryCharge(
                    schoolSnap.data()?.deliveryCharge
                );
            } catch (e) {
                console.warn(`[deliveryCharge] school lookup failed ${schoolId}:`, e.message);
                chargesBySchoolId[schoolId] = DEFAULT_DELIVERY_CHARGE;
            }
        })
    );

    const charges = Object.values(chargesBySchoolId);
    const deliveryCharge =
        charges.length > 0 ? Math.max(...charges) : DEFAULT_DELIVERY_CHARGE;

    return {
        deliveryCharge,
        schoolIds,
        chargesBySchoolId,
    };
}

/**
 * Subtotal from cart/snapshot lines (₹).
 * @param {Array<object>} items
 * @returns {number}
 */
function computeItemsSubtotal(items = []) {
    return (items || []).reduce((sum, item) => {
        if (!item || typeof item !== 'object') return sum;
        const qty = parseInt(item.quantity, 10) || 1;
        const price = Number(item.price) || 0;
        if (item.subtotal != null && Number.isFinite(Number(item.subtotal))) {
            return sum + Number(item.subtotal);
        }
        return sum + price * qty;
    }, 0);
}

/**
 * Round money to 2 decimal places (₹).
 * @param {number} n
 * @returns {number}
 */
function roundInr(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
}

module.exports = {
    DEFAULT_DELIVERY_CHARGE,
    parseSchoolDeliveryCharge,
    resolveDeliveryChargeForCartItems,
    computeItemsSubtotal,
    roundInr,
};
