import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = ({ onSwitchToRegister, onGoToSearch, onGoToApiTest }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { loginMobile, sendOtp } = useAuth();

  const handleSendOtp = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    // Validate mobile number format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobileNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setIsLoading(true);
      const result = await sendOtp(mobileNumber.trim());
      
      if (result.success) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent to your mobile number');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!mobileNumber.trim() || !otp.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate mobile number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobileNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    // Validate OTP format (6 digits)
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp.trim())) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await loginMobile(mobileNumber.trim(), otp.trim());
      
      if (result.success) {
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => onGoToSearch && onGoToSearch() }
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSignUp = () => {
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      console.error('onSwitchToRegister prop not received!');
      Alert.alert('Sign Up', 'Sign up functionality will be implemented');
    }
  };

  const handleGoToSearch = () => {
    if (onGoToSearch) {
      onGoToSearch();
    } else {
      Alert.alert('Search', 'Search functionality will be implemented');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BookSwap</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Login</Text>
          
          <View style={styles.formContainer}>
            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  isMobileFocused && styles.inputFocused,
                ]}
                placeholder="Mobile Number (10 digits)"
                placeholderTextColor={`${colors.textLight}80`}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                onFocus={() => setIsMobileFocused(true)}
                onBlur={() => setIsMobileFocused(false)}
                keyboardType="numeric"
                maxLength={10}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Send OTP Button */}
            {!otpSent && (
              <TouchableOpacity 
                style={[styles.sendOtpButton, isLoading && styles.sendOtpButtonDisabled]} 
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.sendOtpButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            )}

            {/* OTP Input - Only show after OTP is sent */}
            {otpSent && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    isOtpFocused && styles.inputFocused,
                  ]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={`${colors.textLight}80`}
                  value={otp}
                  onChangeText={setOtp}
                  onFocus={() => setIsOtpFocused(true)}
                  onBlur={() => setIsOtpFocused(false)}
                  keyboardType="numeric"
                  maxLength={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Login Button - Only show after OTP is sent */}
            {otpSent && (
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Login with OTP</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Resend OTP Button */}
            {otpSent && (
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text style={styles.resendButtonText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Button */}
          <TouchableOpacity style={styles.searchButton} onPress={handleGoToSearch}>
            <Text style={styles.searchButtonText}>Search Schools</Text>
          </TouchableOpacity>

          {/* API Test Button */}
          <TouchableOpacity style={styles.apiTestButton} onPress={onGoToApiTest}>
            <Text style={styles.apiTestButtonText}>Test API Connection</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>
              Don't have an account?{' '}
              <Text style={styles.signUpLink} onPress={handleSignUp}>
                Sign Up
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
