import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if localStorage is available (handles SSR or restricted environments)
      if (typeof window === 'undefined' || !window.localStorage) {
        setUser(null);
        setIsLoggedIn(false);
        return;
      }
      
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
      // Only log actual errors, not expected failures
      if (error && error.message && !error.message.includes('localStorage')) {
        console.error('Error checking auth status:', error);
      }
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await ApiService.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginMobile = async (mobileNumber, otp) => {
    try {
      setIsLoading(true);
      const response = await ApiService.loginMobile(mobileNumber, otp);
      
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await ApiService.register(userData);
      
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const registerMobile = async (userData) => {
    try {
      setIsLoading(true);
      const response = await ApiService.registerMobile(userData);
      
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (mobileNumber) => {
    try {
      console.log('AuthContext: Sending OTP to', mobileNumber);
      const response = await ApiService.sendOtp(mobileNumber);
      console.log('AuthContext: OTP Response', response);
      
      // Ensure we always return an object with success property
      if (response && typeof response === 'object') {
        return response;
      }
      
      // If response is not in expected format, wrap it
      return {
        success: false,
        message: 'Unexpected response from server',
      };
    } catch (error) {
      console.error('AuthContext: Send OTP Error', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to send OTP. Please check your connection.' 
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
    isLoading,
    isLoggedIn,
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

