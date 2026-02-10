/**
 * Optional 1–4 show at top; then mandatory + rest optional.
 * Use getOptionalBundlesFirst / getOptionalBundlesRest for section order.
 */
const OPTIONAL_FIRST_TYPES = ['OPTIONAL_1', 'OPTIONAL_2', 'OPTIONAL_3', 'OPTIONAL_4'];
const OPTIONAL_REST_ORDER = ['NOTEBOOK', 'UNIFORM', 'STATIONARY', 'STATIONERY', 'OTHER'];

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
    OPTIONAL_1: 'Optional 1',
    OPTIONAL_2: 'Optional 2',
    OPTIONAL_3: 'Optional 3',
    OPTIONAL_4: 'Optional 4',
    OTHER: 'Other',
  };
  return map[u] || (u.charAt(0) + u.slice(1).toLowerCase().replace(/_/g, ' '));
};

export const getOptionalTypeTitle = (typeKey) => {
  if (typeKey === 'OPTIONAL_1') return 'Optional 1';
  if (typeKey === 'OPTIONAL_2') return 'Optional 2';
  if (typeKey === 'OPTIONAL_3') return 'Optional 3';
  if (typeKey === 'OPTIONAL_4') return 'Optional 4';
  return getCategoryDisplayName(typeKey);
};
