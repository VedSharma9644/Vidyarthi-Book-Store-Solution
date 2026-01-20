// Image Paths Configuration
// Use this file to manage all image paths in one place

// Base path for public images
const PUBLIC_IMAGES = '/images';

// Helper to encode image paths (handles spaces in filenames)
// Only encodes the filename, not the path separators
const encodeImagePath = (path) => {
  const parts = path.split('/');
  const filename = parts.pop();
  const encodedFilename = encodeURIComponent(filename);
  return [...parts, encodedFilename].join('/');
};

// Logo images
export const LOGO_IMAGES = {
  MAIN: encodeImagePath(`${PUBLIC_IMAGES}/logo/VidyarthiKart Logo.jpg`),
  FAVICON: `${PUBLIC_IMAGES}/logo/favicon.png`,
  SMALL: encodeImagePath(`${PUBLIC_IMAGES}/logo/VidyarthiKart Logo.jpg`),
};

// Product category placeholders
export const PRODUCT_IMAGES = {
  TEXTBOOK: encodeImagePath(`${PUBLIC_IMAGES}/products/Textbook Image.jpeg`),
  NOTEBOOK: encodeImagePath(`${PUBLIC_IMAGES}/products/Notebook Image.jpeg`),
  STATIONARY: encodeImagePath(`${PUBLIC_IMAGES}/products/Stationary Image.jpeg`),
  UNIFORM: encodeImagePath(`${PUBLIC_IMAGES}/products/Uniform Image.jpeg`),
  OTHER: encodeImagePath(`${PUBLIC_IMAGES}/products/Textbook Image.jpeg`), // Fallback to textbook image
};

// Category icons
export const CATEGORY_IMAGES = {
  MANDATORY: `${PUBLIC_IMAGES}/categories/mandatory-icon.png`,
  OPTIONAL: `${PUBLIC_IMAGES}/categories/optional-icon.png`,
  STATIONARY: `${PUBLIC_IMAGES}/categories/stationary-icon.png`,
};

// Grade images
export const GRADE_IMAGES = {
  DEFAULT: encodeImagePath(`${PUBLIC_IMAGES}/grade/Select Class Image.jpeg`),
};

// Banner images
export const BANNER_IMAGES = {
  HOMEPAGE: encodeImagePath(`${PUBLIC_IMAGES}/banner/DELIVERY IMG.png`), // Main homepage banner
};

// Default/fallback images
export const DEFAULT_IMAGES = {
  PROFILE: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpjxEfE7ea34iS2cRGSWsmeaKsAFJRhbMGl69cHfVqKLFhPihowan-DypyvXbvvn0088j2FSLVvnYQccFUXJ73y1eNXuGDz7KAWV5_t5tguQ_78LpNELkmN9zjgxGwv15mYEGnQ2BLbuOaM5v3bB4ZqMjmnvbwFuvNwUatcbej9LbHH92_fwVOMKk2vqSYRmMUXx-d7urQeB4sjVbew1-CARvegFPvB4-ifYUqGvVa0YgVIlUqEF2rkCV3WZX3WmnVstFVlPqbGTI',
  BOOK_PLACEHOLDER: encodeImagePath(`${PUBLIC_IMAGES}/products/Textbook Image.jpeg`), // Fallback to textbook image
  CART_EMPTY: `${PUBLIC_IMAGES}/categories/cart-empty.png`,
};

// Helper function to get product image by category
export const getProductImageByCategory = (category) => {
  if (!category) return PRODUCT_IMAGES.OTHER;
  
  const categoryUpper = (category || '').toUpperCase().trim();
  
  switch (categoryUpper) {
    case 'TEXTBOOK':
    case 'MANDATORY':
      return PRODUCT_IMAGES.TEXTBOOK;
    case 'NOTEBOOK':
      return PRODUCT_IMAGES.NOTEBOOK;
    case 'STATIONARY':
    case 'STATIONERY':
      return PRODUCT_IMAGES.STATIONARY;
    case 'UNIFORM':
      return PRODUCT_IMAGES.UNIFORM;
    default:
      return PRODUCT_IMAGES.OTHER;
  }
};

// Helper function to get category icon
export const getCategoryIcon = (category) => {
  const categoryUpper = (category || '').toUpperCase();
  
  switch (categoryUpper) {
    case 'TEXTBOOK':
    case 'MANDATORY':
      return CATEGORY_IMAGES.MANDATORY;
    case 'STATIONARY':
    case 'STATIONERY':
      return CATEGORY_IMAGES.STATIONARY;
    default:
      return CATEGORY_IMAGES.OPTIONAL;
  }
};

