import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add user ID to headers for cart operations
      const userId = await AsyncStorage.getItem('userId');
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
      console.error('Error code:', error.code);
      console.error('Error response:', error.response?.data);
      console.error('Error request:', error.request ? 'Request made but no response' : 'No request made');
      
      // Return a user-friendly error
      if (error.response) {
        // Server responded with error
        return {
          success: false,
          message: error.response.data?.message || 'Failed to send OTP. Please try again.',
        };
      } else if (error.request) {
        // Request made but no response (network error)
        const errorMessage = error.code === 'ECONNREFUSED' 
          ? `Cannot connect to server at ${API_CONFIG.BASE_URL}. Make sure:\n1. Backend server is running\n2. Device and server are on the same network\n3. IP address is correct`
          : error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN'
          ? `Cannot resolve server address ${API_CONFIG.BASE_URL}. Check your network connection.`
          : error.code === 'ETIMEDOUT'
          ? `Connection timeout. Server at ${API_CONFIG.BASE_URL} is not responding.`
          : `Cannot connect to server at ${API_CONFIG.BASE_URL}. Make sure backend is running and device is on the same network.`;
        
        return {
          success: false,
          message: errorMessage,
        };
      } else {
        // Something else happened
        return {
          success: false,
          message: `Failed to send OTP: ${error.message || 'Unknown error'}`,
        };
      }
    }
  }

  async registerMobile(userData) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER_MOBILE, userData);
      
      // Store user data and token if registration successful
      if (response.data.success) {
        await this.storeUserData(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw error;
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
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Mobile OTP APIs
  // Note: sendOtp is defined earlier with better error handling

  async registerMobile(userData) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER_MOBILE, userData);
      
      // Store user data if registration successful
      if (response.data.success) {
        await this.storeUserData(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw error;
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

  // Books APIs
  async getAllBooks(params = {}) {
    try {
      const { offset = 0, limit = 8, category, price, sort } = params;
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKS.GET_ALL, {
        params: { offset, limit, category, price, sort },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getGeneralBooks() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.BOOKS.GET_GENERAL);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getBookById(bookId) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.BOOKS.GET_BY_ID}/${bookId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Cart APIs
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

  async updateCartItem(itemId, quantity) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CART.UPDATE, {
        itemId,
        quantity,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async removeCartItem(itemId) {
    try {
      const response = await apiClient.delete(`${API_CONFIG.ENDPOINTS.CART.REMOVE}/${itemId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCartCount() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CART.COUNT);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async clearCart() {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CART.CLEAR);
      return response.data;
    } catch (error) {
      throw error;
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

  async getCategoryById(id) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.CATEGORIES.GET_BY_ID}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Order APIs
  async getOrders() {
    try {
      console.log('Calling orders API:', API_CONFIG.ENDPOINTS.ORDERS.GET_ALL);
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ORDERS.GET_ALL);
      console.log('Orders API Response Status:', response.status);
      console.log('Orders API Response Data:', JSON.stringify(response.data, null, 2));
      
      // Handle Firebase order response structure
      if (response.data) {
        // If response.data already has success and data properties
        if (response.data.success !== undefined && response.data.data) {
          return {
            success: response.data.success,
            data: response.data.data || [],
          };
        }
        // If response.data is directly the array (shouldn't happen but handle it)
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
      console.error('Error response:', error.response?.data);
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

  // Image APIs
  async getBannerImage() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.IMAGES.GET_BANNER);
      if (response.data && response.data.success !== undefined) {
        return response.data;
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

  async getImages(category, limit) {
    try {
      const params = {};
      if (category) params.category = category;
      if (limit) params.limit = limit;
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.IMAGES.GET_ALL, { params });
      if (response.data && response.data.success !== undefined) {
        return response.data;
      }
      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      console.error('Get images API Error:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch images',
        data: [],
      };
    }
  }

  // Upload image (using admin panel backend)
  async uploadImage(fileUri, metadata = {}) {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = fileUri.split('/').pop() || 'profile-image.jpg';
      // Determine file type from URI or default to jpeg
      let fileType = 'jpeg';
      if (filename.includes('.')) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          fileType = ext === 'jpg' ? 'jpeg' : ext;
        }
      }
      
      // For React Native, FormData needs the file object with uri, type, and name
      formData.append('file', {
        uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
        type: `image/${fileType}`,
        name: filename,
      });
      
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.folderPath) formData.append('folderPath', metadata.folderPath);
      if (metadata.uploadedBy) formData.append('uploadedBy', metadata.uploadedBy);

      const response = await axios.post(API_CONFIG.ENDPOINTS.UPLOAD.IMAGE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => {
          return data; // Let axios handle FormData
        },
      });

      return response.data;
    } catch (error) {
      console.error('Upload image API Error:', error.message);
      console.error('Upload error details:', error.response?.data);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const response = await apiClient.put(`${API_CONFIG.ENDPOINTS.USERS.UPDATE}/${userId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Update user profile API Error:', error.message);
      throw error;
    }
  }

  // Storage helpers
  async storeUserData(user) {
    try {
      await AsyncStorage.setItem('userId', user.id.toString());
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      await AsyncStorage.setItem('isLoggedIn', 'true');
    } catch (error) {
      console.log('Error storing user data:', error);
    }
  }

  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.log('Error getting user data:', error);
      return null;
    }
  }

  async isLoggedIn() {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      return isLoggedIn === 'true';
    } catch (error) {
      console.log('Error checking login status:', error);
      return false;
    }
  }

  async logout() {
    try {
      await AsyncStorage.multiRemove(['userId', 'userData', 'isLoggedIn', 'authToken']);
    } catch (error) {
      console.log('Error during logout:', error);
    }
  }
}

// Export singleton instance
export default new ApiService();
