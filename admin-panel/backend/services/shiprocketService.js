const axios = require('axios');
const path = require('path');

// Load dotenv with explicit path to ensure .env file is found
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

class ShiprocketService {
  constructor() {
    this.baseURL = 'https://apiv2.shiprocket.in/v1/external';
    // Read environment variables each time they're accessed (lazy loading)
    this.token = null;
    this.tokenExpiry = null;
    
    // Log environment variable status on initialization
    this.logEnvStatus();
  }

  /**
   * Get API key from environment (lazy loading)
   */
  getApiKey() {
    const apiKey = (process.env.SHIPROCKET_API_KEY || process.env.SHIPROCKET_APIKEY || '').trim();
    return apiKey;
  }

  /**
   * Get API secret from environment (lazy loading)
   */
  getApiSecret() {
    const apiSecret = (process.env.SHIPROCKET_API_SECRET || process.env.SHIPROCKET_APISECRET || '').trim();
    return apiSecret;
  }

  /**
   * Get email from environment (lazy loading) - for email/password auth
   */
  getEmail() {
    const email = (process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_USERNAME || '').trim();
    return email;
  }

  /**
   * Get password from environment (lazy loading) - for email/password auth
   */
  getPassword() {
    const password = (process.env.SHIPROCKET_PASSWORD || '').trim();
    return password;
  }

  /**
   * Check if API key authentication is configured
   */
  hasApiKeyAuth() {
    return !!(this.getApiKey() && this.getApiSecret());
  }

  /**
   * Check if email/password authentication is configured
   */
  hasEmailPasswordAuth() {
    return !!(this.getEmail() && this.getPassword());
  }

  /**
   * Log environment variable status for debugging
   */
  logEnvStatus() {
    const apiKey = this.getApiKey();
    const apiSecret = this.getApiSecret();
    const email = this.getEmail();
    const password = this.getPassword();
    
    console.log('🔍 Shiprocket Environment Variables Status:');
    console.log(`   SHIPROCKET_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'} ${apiKey ? `(${apiKey.substring(0, 5)}...)` : ''}`);
    console.log(`   SHIPROCKET_API_SECRET: ${apiSecret ? '✅ Set' : '❌ Missing'} ${apiSecret ? '(***hidden***)' : ''}`);
    console.log(`   SHIPROCKET_EMAIL/USERNAME: ${email ? '✅ Set' : '❌ Missing'} ${email ? `(${email.substring(0, 5)}...)` : ''}`);
    console.log(`   SHIPROCKET_PASSWORD: ${password ? '✅ Set' : '❌ Missing'} ${password ? '(***hidden***)' : ''}`);
    console.log(`   SHIPROCKET_PICKUP_LOCATION: ${process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse (default)'}`);
    
    const authMethod = this.hasApiKeyAuth() ? 'API Key' : (this.hasEmailPasswordAuth() ? 'Email/Password' : 'None');
    console.log(`   Authentication Method: ${authMethod}`);
    
    if (!this.hasApiKeyAuth() && !this.hasEmailPasswordAuth()) {
      console.error('❌ Shiprocket credentials are missing! Please check your .env file.');
      console.error('   Option 1 (API Key): SHIPROCKET_API_KEY, SHIPROCKET_API_SECRET');
      console.error('   Option 2 (Email/Password): SHIPROCKET_EMAIL/USERNAME, SHIPROCKET_PASSWORD');
    }
  }

  /**
   * Get authentication token from Shiprocket using API Key authentication
   */
  async getAuthTokenWithApiKey() {
    const apiKey = this.getApiKey();
    const apiSecret = this.getApiSecret();

    // Check if token is still valid (with 5 minute buffer)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.token;
    }

    console.log('🔐 Authenticating with Shiprocket API using API Key...');
    console.log(`   API Key: ${apiKey.substring(0, 5)}...`);
    console.log(`   API URL: ${this.baseURL}/auth/login`);

    // Try API key authentication - Shiprocket may use Basic Auth or different endpoint
    // Method 1: Try Basic Auth with API key as username and secret as password
    const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/login`,
        {},
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.token) {
        this.token = response.data.token;
        this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
        console.log('✅ Shiprocket API Key authentication successful');
        return this.token;
      }
    } catch (error) {
      console.log('⚠️ Basic Auth with API Key failed, trying alternative method...');
      
      // Method 2: Try sending API key and secret in request body
      try {
        const response = await axios.post(
          `${this.baseURL}/auth/login`,
          {
            api_key: apiKey,
            api_secret: apiSecret,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.data && response.data.token) {
          this.token = response.data.token;
          this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
          console.log('✅ Shiprocket API Key authentication successful (method 2)');
          return this.token;
        }
      } catch (error2) {
        console.error('❌ API Key authentication failed with both methods');
        throw error2;
      }
    }

    throw new Error('Failed to get authentication token - no token in response');
  }

  /**
   * Get authentication token from Shiprocket using Email/Password authentication
   */
  async getAuthTokenWithEmailPassword() {
    const email = this.getEmail();
    const password = this.getPassword();

    // Check if token is still valid (with 5 minute buffer)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.token;
    }

    console.log('🔐 Authenticating with Shiprocket API using Email/Password...');
    console.log(`   Using email: ${email}`);
    console.log(`   Email length: ${email.length}`);
    console.log(`   Password length: ${password.length}`);
    console.log(`   API URL: ${this.baseURL}/auth/login`);

    const loginPayload = {
      email: email.trim(),
      password: password.trim(),
    };

    const response = await axios.post(`${this.baseURL}/auth/login`, loginPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.token) {
      this.token = response.data.token;
      this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
      console.log('✅ Shiprocket Email/Password authentication successful');
      return this.token;
    }

    throw new Error('Failed to get authentication token - no token in response');
  }

  /**
   * Get authentication token from Shiprocket
   * Supports both API Key and Email/Password authentication methods
   */
  async getAuthToken() {
    try {
      // Determine which authentication method to use
      if (this.hasApiKeyAuth()) {
        return await this.getAuthTokenWithApiKey();
      } else if (this.hasEmailPasswordAuth()) {
        return await this.getAuthTokenWithEmailPassword();
      } else {
        throw new Error(
          'Shiprocket credentials must be configured. ' +
          'Either set SHIPROCKET_API_KEY and SHIPROCKET_API_SECRET, ' +
          'or set SHIPROCKET_EMAIL/USERNAME and SHIPROCKET_PASSWORD in your .env file.'
        );
      }
    } catch (error) {
      console.error('Shiprocket auth error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Provide helpful error messages
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || 'Invalid credentials';
        console.error('❌ Shiprocket 401 Error Details:');
        console.error('   Response:', JSON.stringify(error.response?.data, null, 2));
        throw new Error(`Shiprocket authentication failed: ${errorMessage}. Please verify your credentials in Shiprocket dashboard.`);
      } else if (error.response?.status === 400) {
        console.error('❌ Shiprocket 400 Error Details:');
        console.error('   Response:', JSON.stringify(error.response?.data, null, 2));
        throw new Error(`Shiprocket authentication failed: ${error.response?.data?.message || 'Invalid request'}`);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Shiprocket API connection failed. Please check your internet connection.');
      }

      console.error('❌ Shiprocket Auth Error Details:');
      console.error('   Full error:', JSON.stringify(error.response?.data || error.message, null, 2));
      throw new Error(`Shiprocket authentication failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create order in Shiprocket
   */
  async createOrder(orderData) {
    try {
      const token = await this.getAuthToken();

      const response = await axios.post(
        `${this.baseURL}/orders/create/adhoc`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Shiprocket create order error:', error.response?.data || error.message);
      throw new Error(
        `Failed to create Shiprocket order: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get order status from Shiprocket by order ID
   */
  async getOrderStatus(orderId) {
    try {
      const token = await this.getAuthToken();

      const response = await axios.get(
        `${this.baseURL}/orders/show/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Shiprocket get order status error:', error.response?.data || error.message);
      throw new Error(
        `Failed to fetch Shiprocket order status: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Get shipment status from Shiprocket by shipment ID
   */
  async getShipmentStatus(shipmentId) {
    try {
      const token = await this.getAuthToken();

      const response = await axios.get(
        `${this.baseURL}/shipments/show/${shipmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Shiprocket get shipment status error:', error.response?.data || error.message);
      throw new Error(
        `Failed to fetch Shiprocket shipment status: ${error.response?.data?.message || error.message}`
      );
    }
  }
}

module.exports = new ShiprocketService();

