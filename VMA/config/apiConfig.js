// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://vidyarthi-backend-594708558503.us-central1.run.app', // Production backend on Google Cloud Run
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
      ADD_ITEMS: '/api/cart/add-items',
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
    // Subgrades (sections under a grade)
    SUBGRADES: {
      GET_ALL: '/api/subgrades',
      GET_BY_ID: '/api/subgrades',
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
            VALIDATE_CART: '/api/orders/validate-cart',
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
            UPLOAD_PROFILE_IMAGE: '/api/users',
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
