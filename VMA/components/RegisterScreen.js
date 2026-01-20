import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import { useAuth } from '../contexts/AuthContext';

const RegisterScreen = ({ onBack, onSwitchToLogin, onGoToOtpVerification }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { sendOtp } = useAuth();

  const handleCreateAccount = async () => {
    console.log('RegisterScreen: Create Account clicked');
    console.log('Props received:', { onBack: !!onBack, onSwitchToLogin: !!onSwitchToLogin, onGoToOtpVerification: !!onGoToOtpVerification });
    
    if (!fullName.trim() || !email.trim() || !password.trim() || !school.trim() || !phoneNumber.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending OTP to:', phoneNumber.trim());
      const result = await sendOtp(phoneNumber.trim());
      console.log('OTP Result:', result);
      
      if (result && result.success) {
        console.log('OTP sent successfully, navigating to OTP verification');
        // Navigate to OTP verification screen
        if (onGoToOtpVerification) {
          console.log('Calling onGoToOtpVerification with data');
          onGoToOtpVerification({
            email: email.trim(),
            firstName: fullName.split(' ')[0],
            lastName: fullName.split(' ').slice(1).join(' '),
            userName: fullName.trim(), // Pass the full name as userName
            password,
            schoolName: school.trim(),
            phoneNumber: phoneNumber.trim(),
          });
        } else {
          console.error('onGoToOtpVerification prop is missing!');
          Alert.alert('Error', 'Navigation callback not available. Please restart the app.');
        }
      } else {
        Alert.alert('Error', result?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please check your connection to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of Service will be implemented');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy Policy will be implemented');
  };

  const isFieldFocused = (fieldName) => focusedField === fieldName;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.registerContainer}>
            <View style={styles.formContainer}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.registerInput,
                  isFieldFocused('fullName') && styles.inputFocused,
                ]}
                placeholder="Full Name"
                placeholderTextColor={`${colors.textLight}60`}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField('')}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.registerInput,
                  isFieldFocused('email') && styles.inputFocused,
                ]}
                placeholder="Email"
                placeholderTextColor={`${colors.textLight}60`}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.registerInput,
                  isFieldFocused('password') && styles.inputFocused,
                ]}
                placeholder="Password"
                placeholderTextColor={`${colors.textLight}60`}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.registerInput,
                  isFieldFocused('phoneNumber') && styles.inputFocused,
                ]}
                placeholder="Phone Number"
                placeholderTextColor={`${colors.textLight}60`}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onFocus={() => setFocusedField('phoneNumber')}
                onBlur={() => setFocusedField('')}
                keyboardType="numeric"
                maxLength={10}
                autoCorrect={false}
              />
            </View>

            {/* School Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.registerInput,
                  isFieldFocused('school') && styles.inputFocused,
                ]}
                placeholder="School"
                placeholderTextColor={`${colors.textLight}60`}
                value={school}
                onChangeText={setSchool}
                onFocus={() => setFocusedField('school')}
                onBlur={() => setFocusedField('')}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity 
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
            onPress={handleCreateAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Terms and Privacy Policy */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.legalLink} onPress={handleTermsOfService}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.legalLink} onPress={handlePrivacyPolicy}>
                Privacy Policy
              </Text>
              .
            </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
