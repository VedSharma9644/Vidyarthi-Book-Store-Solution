/**
 * Utility functions for grade sorting and ordering.
 * Ensures consistent grade display order across the app:
 * NURSERY → PP-1 → PP-2 → CLASS-1 → ... → CLASS-12
 */

/** Canonical grade display order */
export const GRADE_DISPLAY_ORDER = [
  'NURSERY',
  'PP-1',
  'PP-2',
  'CLASS-1',
  'CLASS-2',
  'CLASS-3',
  'CLASS-4',
  'CLASS-5',
  'CLASS-6',
  'CLASS-7',
  'CLASS-8',
  'CLASS-9',
  'CLASS-10',
  'CLASS-11',
  'CLASS-12',
];

/**
 * Normalize grade name for comparison.
 * Handles variations like "Class 1", "CLASS-1", "class-1", "Class - 1", etc.
 * @param {string} name - Grade name to normalize
 * @returns {string} - Normalized uppercase name with consistent formatting
 */
export const normalizeGradeName = (name) => {
  if (!name) return '';
  
  // Convert to uppercase and trim
  let normalized = name.trim().toUpperCase();
  
  // Handle common variations:
  // "CLASS 1" → "CLASS-1"
  // "CLASS - 1" → "CLASS-1"
  // "CLASS  1" → "CLASS-1"
  // "PP 1" → "PP-1"
  // "PP - 1" → "PP-1"
  
  // Replace "CLASS" followed by optional spaces/dashes and a number
  normalized = normalized.replace(/^CLASS\s*[-–—]?\s*(\d+)$/i, 'CLASS-$1');
  
  // Replace "PP" followed by optional spaces/dashes and a number
  normalized = normalized.replace(/^PP\s*[-–—]?\s*(\d+)$/i, 'PP-$1');
  
  // Replace any remaining multiple spaces/dashes with single dash
  normalized = normalized.replace(/[\s\-–—]+/g, '-');
  
  return normalized;
};

/** Friendly labels for default early-year grades (canonical name → UI only). */
const GRADE_DISPLAY_LABEL_BY_NORMALIZED = {
  NURSERY: 'NURSERY(EY-1)',
  'PP-1': 'Lower KG(EY-2)',
  'PP-2': 'Upper KG(EY-3)',
};

/**
 * Map backend/canonical grade name to shopper-facing label without changing sort keys.
 * Unknown or custom names are returned unchanged (trimmed).
 * @param {string|null|undefined} name
 * @returns {string}
 */
export const getGradeDisplayLabel = (name) => {
  if (name == null) return '';
  const raw = String(name).trim();
  if (!raw) return '';
  const normalized = normalizeGradeName(raw);
  if (GRADE_DISPLAY_LABEL_BY_NORMALIZED[normalized]) {
    return GRADE_DISPLAY_LABEL_BY_NORMALIZED[normalized];
  }
  return raw;
};

/**
 * Format a grade header that may include " - section" after the grade name.
 * @param {string|null|undefined} name
 * @returns {string}
 */
export const getGradeScreenTitle = (name) => {
  if (name == null) return '';
  const s = String(name).trim();
  if (!s) return '';
  const idx = s.indexOf(' - ');
  if (idx === -1) return getGradeDisplayLabel(s);
  const left = s.slice(0, idx).trim();
  const right = s.slice(idx + 3).trim();
  return [getGradeDisplayLabel(left), right].filter(Boolean).join(' - ');
};

/**
 * Get the sort index for a grade name based on canonical order.
 * Uses displayOrder if available, otherwise falls back to name matching.
 * @param {Object} grade - Grade object with name and optional displayOrder
 * @returns {number} - Sort index (lower = earlier in sequence)
 */
export const getGradeSortIndex = (grade) => {
  // If grade has a valid displayOrder from the backend, use it
  if (grade && typeof grade.displayOrder === 'number' && grade.displayOrder >= 0) {
    return grade.displayOrder;
  }
  
  // Fallback: determine order from grade name
  const name = grade?.name || '';
  const normalized = normalizeGradeName(name);
  
  // Try exact match first
  const exactIndex = GRADE_DISPLAY_ORDER.findIndex(
    (orderName) => normalizeGradeName(orderName) === normalized
  );
  if (exactIndex >= 0) return exactIndex;
  
  // Try prefix match for any custom suffixes (e.g., "CLASS-1A" should sort after CLASS-1)
  // Iterate from longest to shortest to match CLASS-10 before CLASS-1
  for (let i = GRADE_DISPLAY_ORDER.length - 1; i >= 0; i--) {
    const orderName = normalizeGradeName(GRADE_DISPLAY_ORDER[i]);
    if (normalized.startsWith(orderName)) {
      // Add a small offset for variations so "CLASS-1A" comes after "CLASS-1"
      return i + 0.5;
    }
  }
  
  // Try extracting class number for any "CLASS-X" format not in our list
  const classMatch = normalized.match(/^CLASS-(\d+)/);
  if (classMatch) {
    const classNum = parseInt(classMatch[1], 10);
    // Position after the last known class (CLASS-12 is at index 14)
    // This handles CLASS-13, CLASS-14, etc.
    if (classNum > 12) {
      return 14 + (classNum - 12);
    }
  }
  
  // Unknown grades go to the end
  return 999;
};

/**
 * Sort an array of grades in the correct display order.
 * Primary sort: displayOrder (if available) or name-based index
 * Secondary sort: alphabetical by name
 * @param {Array} grades - Array of grade objects with name and optional displayOrder
 * @returns {Array} - Sorted array (new array, original unchanged)
 */
export const sortGrades = (grades) => {
  if (!Array.isArray(grades)) return [];
  
  return [...grades].sort((a, b) => {
    const indexA = getGradeSortIndex(a);
    const indexB = getGradeSortIndex(b);
    
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    
    // Secondary sort: alphabetical
    const nameA = (a?.name || '').toUpperCase();
    const nameB = (b?.name || '').toUpperCase();
    return nameA.localeCompare(nameB);
  });
};

/**
 * Validate if a grade name matches expected patterns.
 * Useful for admin interfaces to warn about non-standard names.
 * @param {string} name - Grade name to validate
 * @returns {Object} - { isValid: boolean, suggestion: string|null }
 */
export const validateGradeName = (name) => {
  const normalized = normalizeGradeName(name);
  const isExact = GRADE_DISPLAY_ORDER.some(
    (orderName) => normalizeGradeName(orderName) === normalized
  );
  
  if (isExact) {
    return { isValid: true, suggestion: null };
  }
  
  // Try to suggest a correction
  if (normalized.match(/^CLASS-?\s*\d+$/i)) {
    const num = normalized.replace(/\D/g, '');
    return {
      isValid: false,
      suggestion: `CLASS-${num}`,
    };
  }
  
  if (normalized.match(/^PP-?\s*\d+$/i)) {
    const num = normalized.replace(/\D/g, '');
    return {
      isValid: false,
      suggestion: `PP-${num}`,
    };
  }
  
  return { isValid: false, suggestion: null };
};

export default {
  GRADE_DISPLAY_ORDER,
  normalizeGradeName,
  getGradeDisplayLabel,
  getGradeScreenTitle,
  getGradeSortIndex,
  sortGrades,
  validateGradeName,
};
