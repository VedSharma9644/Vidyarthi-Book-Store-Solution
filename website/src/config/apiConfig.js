// API Configuration - Same as mobile app
// For local development, set REACT_APP_API_BASE_URL in .env file
// Example: REACT_APP_API_BASE_URL=http://localhost:5000
const getBaseUrl = () => {
  // Check for local development environment variable
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  // Default to production
  return 'https://vidyarthi-backend-594708558503.us-central1.run.app';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(), // Production backend on Google Cloud Run (or local if REACT_APP_API_BASE_URL is set)
  ENDPOINTS: {
    // Authentication
    AUTH: {
      TEST: '/api/auth/test',
      SEND_OTP: '/api/auth/send-otp',
      REGISTER_MOBILE: '/api/auth/register-mobile',
      LOGIN_MOBILE: '/api/auth/login-mobile',
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
    },
    // Books
    BOOKS: {
      GET_ALL: '/api/books/get-all-books',
      GET_GENERAL: '/api/books/get-all-generalbooks',
      GET_BY_ID: '/api/books',
    },
    // Cart
    CART: {
      GET: '/api/cart/getcart',
      UPDATE: '/api/cart/update',
      REMOVE: '/api/cart',
      COUNT: '/api/cart/count',
      CLEAR: '/api/cart/clear',
    },
    // Schools
    SCHOOLS: {
      SEARCH: '/api/schools/search',
      VALIDATE_CODE: '/api/schools/validate-code',
      GET_BY_CODE: '/api/schools/code',
      GET_BY_ID: '/api/schools',
    },
    // Grades
    GRADES: {
      GET_ALL: '/api/grades',
      GET_BY_ID: '/api/grades',
    },
    // Categories
    CATEGORIES: {
      GET_ALL: '/api/categories',
      GET_BY_ID: '/api/categories',
    },
    // Payment
    PAYMENT: {
      CREATE_ORDER: '/api/payment/create-order',
      VERIFY_PAYMENT: '/api/payment/verify-payment',
    },
    // Orders
    ORDERS: {
      CREATE: '/api/orders/create',
      GET_ALL: '/api/orders',
      GET_BY_ID: '/api/orders',
    },
    // Images
    IMAGES: {
      GET_BANNER: '/api/images/banner',
      GET_ALL: '/api/images',
    },
    // Users
    USERS: {
      UPDATE: '/api/users',
      GET_BY_ID: '/api/users',
    },
    // Upload (using admin panel backend)
    UPLOAD: {
      IMAGE: 'https://admin-panel-backend-594708558503.us-central1.run.app/api/upload/image',
    },
    // Health
    HEALTH: '/health',
  },
  TIMEOUT: 10000, // 10 seconds
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// For device testing, you might need to use your computer's IP address
// Example: 'http://192.168.1.100:5000'
export const getDeviceApiUrl = (endpoint) => {
  // Use production backend URL (same as BASE_URL)
  const DEVICE_BASE_URL = 'https://vidyarthi-backend-594708558503.us-central1.run.app';
  return `${DEVICE_BASE_URL}${endpoint}`;
};

