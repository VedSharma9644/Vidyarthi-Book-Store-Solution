/**
 * OPTIONAL_1–4 bundles show at top (labels: School suggested, Optional, Optional 3–4); then mandatory + rest optional.
 * Use getOptionalBundlesFirst / getOptionalBundlesRest for section order.
 */
const OPTIONAL_FIRST_TYPES = ['OPTIONAL_1', 'OPTIONAL_2', 'OPTIONAL_3', 'OPTIONAL_4'];
const OPTIONAL_REST_ORDER = ['NOTEBOOK', 'UNIFORM', 'STATIONARY', 'STATIONERY', 'OTHER'];

/** OPTIONAL_3/OPTIONAL_4 are hidden in customer UI; items are merged into OPTIONAL_2 for display/checkout. */
const OPTIONAL_TYPES_MERGED_INTO_OPTIONAL_2 = ['OPTIONAL_3', 'OPTIONAL_4'];

/**
 * Groups that go at the top: Optional 1–4 only (if available).
 * @param {Array<{ type: string, ... }>} groups
 * @returns Sorted array of Optional 1–4 groups
 */
export function getOptionalBundlesFirst(groups) {
  if (!Array.isArray(groups)) return [];
  return groups
    .filter((g) => OPTIONAL_FIRST_TYPES.includes(g.type))
    .sort((a, b) => OPTIONAL_FIRST_TYPES.indexOf(a.type) - OPTIONAL_FIRST_TYPES.indexOf(b.type));
}

/**
 * Groups that go after mandatory: rest of optional (Notebook, Uniform, etc.).
 * @param {Array<{ type: string, ... }>} groups
 * @returns Sorted array
 */
export function getOptionalBundlesRest(groups) {
  if (!Array.isArray(groups)) return [];
  const orderMap = {};
  OPTIONAL_REST_ORDER.forEach((type, index) => {
    orderMap[type] = index;
  });
  return groups
    .filter((g) => !OPTIONAL_FIRST_TYPES.includes(g.type))
    .sort((a, b) => (orderMap[a.type] ?? 999) - (orderMap[b.type] ?? 999));
}

/**
 * Sorts an array of bundle groups: Optional 1–4 first, then the rest.
 * Use when you render optional bundles in a single list (no mandatory in between).
 */
export function sortOptionalBundles(groups) {
  if (!Array.isArray(groups)) return groups;
  return [...getOptionalBundlesFirst(groups), ...getOptionalBundlesRest(groups)];
}

/**
 * Display names for book types (aligned with website and admin).
 * Single source of truth for category display names across the app.
 */
export const getCategoryDisplayName = (bookType) => {
  if (!bookType) return 'Other';
  const u = (String(bookType)).toUpperCase();
  const map = {
    TEXTBOOK: 'Mandatory Textbook',
    MANDATORY_NOTEBOOK: 'Mandatory Notebook',
    NOTEBOOK: 'Notebook',
    STATIONARY: 'Stationary',
    STATIONERY: 'Stationery',
    UNIFORM: 'Uniform',
    OPTIONAL_1: 'School suggested',
    OPTIONAL_2: 'Optional',
    OPTIONAL_3: 'Optional',
    OPTIONAL_4: 'Optional',
    OTHER: 'Other',
  };
  return map[u] || (u.charAt(0) + u.slice(1).toLowerCase().replace(/_/g, ' '));
};

export const getOptionalTypeTitle = (typeKey) => {
  if (typeKey === 'OPTIONAL_1') return 'School suggested';
  if (typeKey === 'OPTIONAL_2') return 'Optional';
  if (typeKey === 'OPTIONAL_3' || typeKey === 'OPTIONAL_4') return 'Optional';
  return getCategoryDisplayName(typeKey);
};

/**
 * Merge OPTIONAL_3 / OPTIONAL_4 bundle groups into OPTIONAL_2 (same title as Optional).
 * Keeps Firestore bookType on each item; only grouping for UI.
 */
export function mergeHiddenOptionalBundleGroups(optionalByType) {
  if (!optionalByType || typeof optionalByType !== 'object') return optionalByType || {};
  const out = { ...optionalByType };
  const target = 'OPTIONAL_2';
  for (const hid of OPTIONAL_TYPES_MERGED_INTO_OPTIONAL_2) {
    if (!out[hid]?.items?.length) {
      delete out[hid];
      continue;
    }
    if (!out[target]) {
      out[target] = {
        type: target,
        title: getOptionalTypeTitle(target),
        items: [],
      };
    }
    out[target].items = [...out[target].items, ...out[hid].items];
    delete out[hid];
  }
  return out;
}

/** Grade-books page: School suggested on, Optional off; other bundle keys false. */
export function buildDefaultSelectedBundles(mergedOptionalByType) {
  const next = {
    NOTEBOOK: false,
    UNIFORM: false,
    STATIONARY: false,
    OPTIONAL_1: true,
    OPTIONAL_2: false,
    OPTIONAL_3: false,
    OPTIONAL_4: false,
    OTHER: false,
  };
  if (mergedOptionalByType && typeof mergedOptionalByType === 'object') {
    Object.keys(mergedOptionalByType).forEach((k) => {
      if (next[k] === undefined) next[k] = false;
    });
  }
  return next;
}
