import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/apiConfig';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add user ID to headers for cart operations
      const userId = localStorage.getItem('userId');
      if (userId) {
        config.headers['user-id'] = userId;
      }
    } catch (error) {
      console.log('Error getting stored data:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Service Class
class ApiService {
  // Health Check
  async healthCheck() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Authentication APIs
  async testAuth() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.TEST);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async sendOtp(mobileNumber) {
    try {
      console.log('Sending OTP request to:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.SEND_OTP);
      console.log('Mobile number:', mobileNumber);
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, {
        mobileNumber,
      });
      
      console.log('OTP Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Send OTP API Error:', error.message);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to send OTP. Please try again.',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: `Failed to send OTP: ${error.message || 'Unknown error'}`,
        };
      }
    }
  }

  async loginMobile(mobileNumber, otp) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN_MOBILE, {
        mobileNumber,
        otp,
      });
      
      // Store user data if login successful
      if (response.data.success) {
        await this.storeUserData(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      
      // Store user data if login successful
      if (response.data.success) {
        await this.storeUserData(response.data.user);
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
      
      // Store user data if registration successful
      if (response.data.success) {
        await this.storeUserData(response.data.user);
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        // Store user ID
        if (response.data.user?.id) {
          localStorage.setItem('userId', response.data.user.id);
        }
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Registration failed. Please try again.',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: error.message || 'Registration failed. Please try again.',
        };
      }
    }
  }

  async registerMobile(userData) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER_MOBILE, userData);
      
      // Store user data if registration successful
      if (response.data.success) {
        await this.storeUserData(response.data.user);
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        // Store user ID
        if (response.data.user?.id) {
          localStorage.setItem('userId', response.data.user.id);
        }
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Registration failed. Please try again.',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: error.message || 'Registration failed. Please try again.',
        };
      }
    }
  }

  // Storage helpers
  async storeUserData(user) {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('localStorage is not available');
        return;
      }
      
      if (!user || !user.id) {
        console.warn('Invalid user data provided');
        return;
      }
      
      localStorage.setItem('userId', user.id.toString());
      localStorage.setItem('userData', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
    } catch (error) {
      // Handle quota exceeded or other storage errors
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Please clear some data.');
      } else {
        console.error('Error storing user data:', error);
      }
    }
  }

  async getUserData() {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      
      const userData = localStorage.getItem('userData');
      if (!userData) {
        return null;
      }
      
      return JSON.parse(userData);
    } catch (error) {
      // Only log parsing errors, not missing data
      if (error.name === 'SyntaxError') {
        console.error('Error parsing user data:', error);
        // Clear corrupted data
        localStorage.removeItem('userData');
      }
      return null;
    }
  }

  async isLoggedIn() {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      return isLoggedIn === 'true';
    } catch (error) {
      // Only log actual errors, not expected failures
      if (error && error.message) {
        console.error('Error checking login status:', error);
      }
      return false;
    }
  }

  async logout() {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      localStorage.removeItem('userId');
      localStorage.removeItem('userData');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('authToken');
    } catch (error) {
      // Log only actual errors
      if (error && error.message) {
        console.error('Error during logout:', error);
      }
    }
  }

  // Image APIs
  async getBannerImage() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.IMAGES.GET_BANNER);
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      // Handle case where response.data is the banner object directly
      if (response.data && response.data.imageUrl) {
        return {
          success: true,
          data: response.data,
        };
      }
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Get banner image API Error:', error.message);
      // Return null on error so app can use fallback
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch banner image',
        data: null,
      };
    }
  }

  // Schools APIs
  async searchSchools(searchTerm = '', limit = 20) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.SCHOOLS.SEARCH, {
        params: { q: searchTerm, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Search schools API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to search schools',
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: [],
        };
      } else {
        return {
          success: false,
          message: 'Failed to search schools. Please try again.',
          data: [],
        };
      }
    }
  }

  async validateSchoolCode(code) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.SCHOOLS.VALIDATE_CODE, {
        params: { code },
      });
      return response.data;
    } catch (error) {
      console.error('Validate school code API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          isValid: false,
          message: error.response.data?.message || 'Failed to validate school code',
        };
      } else if (error.request) {
        return {
          success: false,
          isValid: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          isValid: false,
          message: 'Failed to validate school code. Please try again.',
        };
      }
    }
  }

  async getSchoolByCode(code) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.SCHOOLS.GET_BY_CODE}/${code}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSchoolById(id) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.SCHOOLS.GET_BY_ID}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Grades APIs
  async getGradesBySchoolId(schoolId) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.GRADES.GET_ALL, {
        params: { schoolId },
      });
      return response.data;
    } catch (error) {
      console.error('Get grades API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to fetch grades',
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: [],
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch grades. Please try again.',
          data: [],
        };
      }
    }
  }

  async getGradeById(id) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.GRADES.GET_BY_ID}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Categories APIs
  async getCategoriesByGradeId(gradeId) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CATEGORIES.GET_ALL, {
        params: { gradeId },
      });
      return response.data;
    } catch (error) {
      console.error('Get categories API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to fetch categories',
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: [],
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch categories. Please try again.',
          data: [],
        };
      }
    }
  }

  // Books APIs
  async getAllBooks({ offset = 0, limit = 100 } = {}) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKS.GET_ALL, {
        params: { offset, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get all books API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to fetch books',
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: [],
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch books. Please try again.',
          data: [],
        };
      }
    }
  }

  // Cart APIs
  async getCartCount() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CART.COUNT);
      return response.data;
    } catch (error) {
      console.error('Get cart count API Error:', error.message);
      return {
        success: false,
        count: 0,
        message: error.response?.data?.message || 'Failed to fetch cart count',
      };
    }
  }

  async updateCartItem(bookId, quantity) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CART.UPDATE, {
        bookId: bookId,
        itemId: bookId, // Support both parameter names
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error('Update cart item API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to update cart',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to update cart. Please try again.',
        };
      }
    }
  }

  async getCart() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CART.GET);
      return response.data;
    } catch (error) {
      console.error('Get cart API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to fetch cart',
          data: { items: [] },
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: { items: [] },
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch cart. Please try again.',
          data: { items: [] },
        };
      }
    }
  }

  async removeCartItem(itemId) {
    try {
      const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.CART.REMOVE}/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Remove cart item API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to remove item from cart',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to remove item. Please try again.',
        };
      }
    }
  }

  async clearCart() {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CART.CLEAR);
      return response.data;
    } catch (error) {
      console.error('Clear cart API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to clear cart',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to clear cart. Please try again.',
        };
      }
    }
  }

  // Payment APIs
  async createPaymentOrder(amount, receipt) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PAYMENT.CREATE_ORDER, {
        amount,
        receipt,
      });
      return response.data;
    } catch (error) {
      console.error('Create payment order API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to create payment order',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to create payment order. Please try again.',
        };
      }
    }
  }

  async verifyPayment(orderId, paymentId, signature) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.PAYMENT.VERIFY_PAYMENT, {
        orderId,
        paymentId,
        signature,
      });
      return response.data;
    } catch (error) {
      console.error('Verify payment API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to verify payment',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to verify payment. Please try again.',
        };
      }
    }
  }

  // Orders APIs
  async getOrders() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ORDERS.GET_ALL);
      
      // Handle Firebase order response structure
      if (response.data) {
        // If response.data already has success and data properties
        if (response.data.success !== undefined && response.data.data) {
          return {
            success: response.data.success,
            data: response.data.data || [],
          };
        }
        // If response.data is directly the array
        if (Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data,
          };
        }
      }
      
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error('Get orders API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to fetch orders',
          data: [],
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: [],
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch orders. Please try again.',
          data: [],
        };
      }
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.ORDERS.GET_BY_ID}/${orderId}`);
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Get order API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to fetch order',
          data: null,
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: null,
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch order. Please try again.',
          data: null,
        };
      }
    }
  }

  async createOrder(paymentData, shippingAddress = null) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.ORDERS.CREATE, {
        paymentData,
        shippingAddress,
      });
      return response.data;
    } catch (error) {
      console.error('Create order API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to create order',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to create order. Please try again.',
        };
      }
    }
  }

  // User APIs
  async getUserById(userId) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.USERS.GET_BY_ID}/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user by ID API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to fetch user',
          data: null,
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          data: null,
        };
      } else {
        return {
          success: false,
          message: 'Failed to fetch user. Please try again.',
          data: null,
        };
      }
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const response = await apiClient.put(`${API_CONFIG.ENDPOINTS.USERS.UPDATE}/${userId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Update user profile API Error:', error.message);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to update profile',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
        };
      } else {
        return {
          success: false,
          message: 'Failed to update profile. Please try again.',
        };
      }
    }
  }

  // Upload image (using admin panel backend - different base URL)
  async uploadImage(file, metadata = {}) {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append the file
      formData.append('file', file);
      
      // Append metadata
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.folderPath) formData.append('folderPath', metadata.folderPath);
      if (metadata.uploadedBy) formData.append('uploadedBy', metadata.uploadedBy);

      // Use axios directly (not apiClient) since this endpoint is on a different base URL
      const response = await axios.post(API_CONFIG.ENDPOINTS.UPLOAD.IMAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Upload image API Error:', error.message);
      console.error('Upload error details:', error.response?.data);
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to upload image',
          url: null,
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running.',
          url: null,
        };
      } else {
        return {
          success: false,
          message: 'Failed to upload image. Please try again.',
          url: null,
        };
      }
    }
  }

  // Storage helpers
  storeUserData(user) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (user.id) {
          localStorage.setItem('userId', user.id.toString());
        }
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
      }
    } catch (error) {
      console.log('Error storing user data:', error);
    }
  }

  getUserData() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const userData = localStorage.getItem('userData');
        if (userData) {
          return JSON.parse(userData);
        }
      }
      return null;
    } catch (error) {
      console.log('Error getting user data:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new ApiService();

