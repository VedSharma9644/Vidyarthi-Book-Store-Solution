import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import { useAuth } from '../contexts/AuthContext';

const OtpVerificationScreen = ({ 
  onBack, 
  onSuccess, 
  email, 
  firstName, 
  lastName, 
  password, 
  schoolName, 
  classStandard,
  phoneNumber 
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const { registerMobile, sendOtp } = useAuth();

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.trim().length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const result = await registerMobile({
        mobileNumber: phoneNumber.trim(),
        otp: otp.trim(),
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        schoolName: schoolName?.trim() || null,
        classStandard: null, // Can be added later if needed
        email: email?.trim() || null,
      });

      if (result.success) {
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => onSuccess && onSuccess() }
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      const result = await sendOtp(phoneNumber.trim());
      
      if (result.success) {
        setTimeLeft(300);
        setCanResend(false);
        Alert.alert('Success', 'OTP sent successfully!');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Phone</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.otpContainer}>
          <Text style={styles.otpTitle}>Verify Phone Number</Text>
          <Text style={styles.otpSubtitle}>
            We've sent a 6-digit verification code to:
          </Text>
          <Text style={styles.phoneNumberText}>+91 {phoneNumber}</Text>
          
          <Text style={styles.otpInstruction}>
            Please check your SMS and enter the code below to complete your registration.
          </Text>

          {/* OTP Input */}
          <View style={styles.otpInputContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor={`${colors.textLight}60`}
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.otpHint}>Enter 6-digit code from SMS</Text>
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              ⏰ Code expires in: {formatTime(timeLeft)}
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity 
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]} 
            onPress={handleVerifyOtp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.verifyButtonText}>✓ Verify & Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity 
              onPress={handleResendOtp}
              disabled={!canResend || isLoading}
            >
              <Text style={[
                styles.resendLink,
                (!canResend || isLoading) && styles.resendLinkDisabled
              ]}>
                📱 Resend SMS
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 Check your SMS inbox for the verification code. If you don't see it, check your spam folder or try resending.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OtpVerificationScreen;
