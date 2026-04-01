import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiService from '../services/apiService';

const AuthContext = createContext();

// Persists across remounts. When true, we never show full-screen loading again (login screen stays mounted).
let authReadyPersisted = false;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(() => authReadyPersisted);

  const checkAuthStatus = useCallback(async () => {
    try {
      const loggedIn = await ApiService.isLoggedIn();
      const userData = await ApiService.getUserData();
      if (loggedIn && userData) {
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      if (error?.message) {
        console.error('Error checking auth status:', error);
      }
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      authReadyPersisted = true;
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      const response = await ApiService.login(email, password);
      if (response?.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      }
      return { success: false, message: response?.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const loginMobile = async (mobileNumber, otp) => {
    try {
      const response = await ApiService.loginMobile(mobileNumber, otp);
      if (!response || typeof response !== 'object') {
        return { success: false, message: 'Login failed', userNotFound: false };
      }
      if (response.success === true && response.user) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      }
      const msg = (response.message != null) ? String(response.message) : '';
      const userNotFound = response.userNotFound === true || /not found|register first/i.test(msg);
      return {
        success: false,
        message: response.message || 'Login failed',
        userNotFound: !!userNotFound,
      };
    } catch (error) {
      const errMsg = error.response?.data?.message != null
        ? String(error.response.data.message)
        : String(error.message || '');
      const userNotFound = /not found|register first/i.test(errMsg) || error.response?.status === 404;
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        userNotFound: !!userNotFound,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await ApiService.register(userData);
      if (response?.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      }
      return { success: false, message: response?.message || 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const registerMobile = async (userData) => {
    try {
      const response = await ApiService.registerMobile(userData);
      if (response?.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      }
      return { success: false, message: response?.message || 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const sendOtp = async (mobileNumber) => {
    try {
      const response = await ApiService.sendOtp(mobileNumber);
      if (response && typeof response === 'object') return response;
      return { success: false, message: 'Unexpected response from server' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send OTP. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
      setUser(null);
      setIsLoggedIn(false);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      return { success: false, message: 'Logout failed' };
    }
  };

  const value = {
    user,
    isLoggedIn,
    authReady,
    login,
    loginMobile,
    register,
    registerMobile,
    sendOtp,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
