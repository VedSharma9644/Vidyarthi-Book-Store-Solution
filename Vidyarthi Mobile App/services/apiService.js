import axios from 'axios';
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
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, {
        mobileNumber,
      });
      return response.data;
    } catch (error) {
      console.error('Send OTP API Error:', error.message);
      console.error('Response:', error.response?.data);
      // Return a user-friendly error
      if (error.response) {
        // Server responded with error
        return {
          success: false,
          message: error.response.data?.message || 'Failed to send OTP. Please try again.',
        };
      } else if (error.request) {
        // Request made but no response (network error)
        return {
          success: false,
          message: 'Cannot connect to server. Make sure backend is running at ' + API_CONFIG.BASE_URL,
        };
      } else {
        // Something else happened
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.',
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
  async sendOtp(mobileNumber) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, {
        mobileNumber,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

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
      throw error;
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
