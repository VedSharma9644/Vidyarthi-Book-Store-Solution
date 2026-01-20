/**
 * Authentication Service
 * Handles admin panel authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://admin-panel-backend-594708558503.us-central1.run.app';

class AuthService {
  constructor() {
    this.tokenKey = 'admin_token';
  }

  /**
   * Login with username and password
   */
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem(this.tokenKey, data.token);
        return {
          success: true,
          token: data.token,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Failed to connect to server. Please try again.',
      };
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem(this.tokenKey);
    }
  }

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Verify token with server
   */
  async verifyToken() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if response is ok (status 200-299)
      if (!response.ok) {
        // If 401 (Unauthorized), clear the invalid token
        if (response.status === 401) {
          localStorage.removeItem(this.tokenKey);
        }
        
        // Try to parse error response
        try {
          const data = await response.json();
          return { success: false, message: data.message || 'Token verification failed' };
        } catch {
          return { success: false, message: 'Token verification failed' };
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token verification error:', error);
      // On network errors, don't clear token (might be temporary network issue)
      return { success: false, message: 'Network error during token verification' };
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export default new AuthService();

