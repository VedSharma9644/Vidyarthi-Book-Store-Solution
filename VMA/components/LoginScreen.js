import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import { useAuth } from '../contexts/AuthContext';

const STEP = { MOBILE: 'mobile', OTP: 'otp', NEW_USER: 'new_user' };

const LoginScreen = ({ onGoToSearch }) => {
  const scrollRef = useRef(null);
  const [step, setStep] = useState(STEP.MOBILE);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [error, setError] = useState('');

  const { loginMobile, sendOtp, registerMobile } = useAuth();

  const handleSendOtp = async () => {
    setError('');
    const mobile = mobileNumber.trim();
    if (!mobile) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    setOtp('');
    setOtpMessage('');
    try {
      const result = await sendOtp(mobile);
      if (result && result.success) {
        setStep(STEP.OTP);
        setOtpMessage('OTP sent. Enter the code below.');
      } else {
        Alert.alert('Error', result?.message || 'Failed to send OTP');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setOtpMessage('');
    const mobile = mobileNumber.trim();
    if (!mobile) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await sendOtp(mobile);
      if (result && result.success) {
        setOtpMessage('New OTP sent. Enter the new code below.');
      } else {
        Alert.alert('Error', result?.message || 'Failed to resend OTP');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    setError('');
    const mobile = mobileNumber.trim();
    const code = otp.trim();
    if (!mobile || !code) {
      Alert.alert('Error', 'Please enter mobile number and OTP');
      return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!/^[0-9]{6}$/.test(code)) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setIsLoading(true);
    try {
      const result = await loginMobile(mobile, code);
      if (result && result.success) {
        Alert.alert('Success', result.message || 'Login successful', [
          { text: 'OK', onPress: () => onGoToSearch && onGoToSearch() },
        ]);
        return;
      }
      const isNewUser =
        result?.userNotFound === true ||
        (result?.message && /not found|register first/i.test(String(result.message)));
      if (isNewUser) {
        setStep(STEP.NEW_USER);
        setError('');
      } else {
        Alert.alert('Error', result?.message || 'Login failed');
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? '';
      const isNewUser = /not found|register first/i.test(String(msg)) || err?.response?.status === 404;
      if (isNewUser) {
        setStep(STEP.NEW_USER);
        setError('');
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError('');
    if (!fullName.trim() || !email.trim() || !school.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    setIsLoading(true);
    try {
      const result = await registerMobile({
        mobileNumber: mobileNumber.trim(),
        otp: otp.trim(),
        firstName,
        lastName,
        schoolName: school.trim(),
        email: email.trim(),
      });
      if (result && result.success) {
        Alert.alert('Success', result.message || 'Account created', [
          { text: 'OK', onPress: () => onGoToSearch && onGoToSearch() },
        ]);
      } else {
        Alert.alert('Error', result?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToOtp = () => {
    setStep(STEP.OTP);
    setError('');
  };

  const showMobile = step === STEP.MOBILE;
  const showOtp = step === STEP.OTP;
  const showNewUser = step === STEP.NEW_USER;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, ...styles.mainContent }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginContainer}>
            <Text style={styles.loginTitle}>Login or create account</Text>

            <View style={styles.formContainer}>
              {/* Mobile number */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, isMobileFocused && styles.inputFocused]}
                  placeholder="Mobile Number (10 digits)"
                  placeholderTextColor={`${colors.textLight}80`}
                  value={mobileNumber}
                  onChangeText={(t) => setMobileNumber(t.replace(/\D/g, '').slice(0, 10))}
                  onFocus={() => setIsMobileFocused(true)}
                  onBlur={() => setIsMobileFocused(false)}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!showNewUser}
                />
              </View>

              {showMobile && (
                <TouchableOpacity
                  style={[
                    styles.sendOtpButton,
                    mobileNumber.trim().length === 10 && { backgroundColor: colors.primary },
                    isLoading && styles.sendOtpButtonDisabled,
                  ]}
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

              {showOtp && (
                <>
                  {otpMessage ? (
                    <Text style={localStyles.otpMessage}>{otpMessage}</Text>
                  ) : null}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, isOtpFocused && styles.inputFocused]}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor={`${colors.textLight}80`}
                      value={otp}
                      onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                      onFocus={() => setIsOtpFocused(true)}
                      onBlur={() => setIsOtpFocused(false)}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                    onPress={handleContinue}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.loginButtonText}>Continue</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resendButton} onPress={handleResendOtp} disabled={isLoading}>
                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              {showNewUser && (
                <>
                  <Text style={localStyles.newUserTitle}>This number isn't registered. Create an account.</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.registerInput, styles.input]}
                      placeholder="Full Name"
                      placeholderTextColor={`${colors.textLight}80`}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.registerInput, styles.input]}
                      placeholder="Email"
                      placeholderTextColor={`${colors.textLight}80`}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.registerInput, styles.input]}
                      placeholder="School"
                      placeholderTextColor={`${colors.textLight}80`}
                      value={school}
                      onChangeText={setSchool}
                      autoCapitalize="words"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                    onPress={handleCreateAccount}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.registerButtonText}>Create account</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resendButton} onPress={handleBackToOtp} disabled={isLoading}>
                    <Text style={styles.resendButtonText}>Back to OTP</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {showMobile && (
              <TouchableOpacity style={styles.searchButton} onPress={() => onGoToSearch && onGoToSearch()}>
                <Text style={styles.searchButtonText}>Search Schools</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  otpMessage: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 8,
    textAlign: 'center',
  },
  newUserTitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LoginScreen;
