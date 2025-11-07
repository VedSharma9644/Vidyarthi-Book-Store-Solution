// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.37:5000', // Updated for physical Android device - use your laptop's IP address
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
  // Use laptop's IP address for physical device testing
  const DEVICE_BASE_URL = 'http://192.168.1.37:5000'; // Your laptop's IP
  return `${DEVICE_BASE_URL}${endpoint}`;
};
