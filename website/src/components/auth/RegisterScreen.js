import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styles } from '../../css/styles';
import { LOGO_IMAGES } from '../../config/imagePaths';
import { useAuth } from '../../contexts/AuthContext';

const RegisterScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [error, setError] = useState('');

  const { sendOtp, registerMobile } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setError('');
    
    // Validation
    if (!fullName.trim() || !email.trim() || !password.trim() || !school.trim() || !phoneNumber.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const result = await sendOtp(phoneNumber.trim());
      
      if (result && result.success) {
        setOtpSent(true);
        setError('');
        alert('OTP sent to your mobile number');
      } else {
        setError(result?.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      setError(error?.message || 'Failed to send OTP. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    setError('');
    
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp.trim())) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      
      // Split full name into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Register with mobile OTP
      const registerData = {
        mobileNumber: phoneNumber.trim(),
        otp: otp.trim(),
        firstName: firstName,
        lastName: lastName,
        schoolName: school.trim(),
        email: email.trim(),
      };

      const result = await registerMobile(registerData);
      
      if (result && result.success) {
        // Registration successful, navigate to home
        navigate('/');
      } else {
        setError(result?.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      setError(error?.message || 'Registration failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    await handleSendOtp();
  };

  const handleTermsOfService = () => {
    alert('Terms of Service will be implemented');
  };

  const handlePrivacyPolicy = () => {
    alert('Privacy Policy will be implemented');
  };

  const isFieldFocused = (fieldName) => focusedField === fieldName;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {!logoError ? (
          <img
            src={LOGO_IMAGES.MAIN}
            alt="Vidyarthi Kart Logo"
            style={{
              height: '60px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '20px',
            }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <h1 style={styles.headerTitle}>Vidyarthi Kart</h1>
        )}
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.registerContainer}>
          <h2 style={styles.loginTitle}>Create Account</h2>

          {/* Error Message */}
          {error && (
            <div style={{
              width: '100%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <div style={styles.formContainer}>
            {/* Full Name Input */}
            <div style={styles.inputContainer}>
              <input
                type="text"
                style={{
                  ...styles.registerInput,
                  ...(isFieldFocused('fullName') && styles.inputFocused),
                }}
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField('')}
                disabled={isLoading || otpSent}
              />
            </div>

            {/* Email Input */}
            <div style={styles.inputContainer}>
              <input
                type="email"
                style={{
                  ...styles.registerInput,
                  ...(isFieldFocused('email') && styles.inputFocused),
                }}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                disabled={isLoading || otpSent}
              />
            </div>

            {/* Password Input */}
            <div style={styles.inputContainer}>
              <input
                type="password"
                style={{
                  ...styles.registerInput,
                  ...(isFieldFocused('password') && styles.inputFocused),
                }}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                disabled={isLoading || otpSent}
              />
            </div>

            {/* Phone Number Input */}
            <div style={styles.inputContainer}>
              <input
                type="tel"
                style={{
                  ...styles.registerInput,
                  ...(isFieldFocused('phoneNumber') && styles.inputFocused),
                }}
                placeholder="Phone Number (10 digits)"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(value);
                }}
                onFocus={() => setFocusedField('phoneNumber')}
                onBlur={() => setFocusedField('')}
                maxLength={10}
                disabled={isLoading || otpSent}
              />
            </div>

            {/* School Input */}
            <div style={styles.inputContainer}>
              <input
                type="text"
                style={{
                  ...styles.registerInput,
                  ...(isFieldFocused('school') && styles.inputFocused),
                }}
                placeholder="School"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                onFocus={() => setFocusedField('school')}
                onBlur={() => setFocusedField('')}
                disabled={isLoading || otpSent}
              />
            </div>

            {/* OTP Input - Show after OTP is sent */}
            {otpSent && (
              <div style={styles.inputContainer}>
                <input
                  type="tel"
                  style={{
                    ...styles.registerInput,
                    ...(isFieldFocused('otp') && styles.inputFocused),
                  }}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField('')}
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Send OTP / Verify OTP Button */}
          {!otpSent ? (
            <button
              style={{
                ...styles.registerButton,
                ...(isLoading && styles.registerButtonDisabled),
              }}
              onClick={handleSendOtp}
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          ) : (
            <>
              <button
                style={{
                  ...styles.registerButton,
                  ...(isLoading && styles.registerButtonDisabled),
                }}
                onClick={handleVerifyOtpAndRegister}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying & Registering...' : 'Verify OTP & Create Account'}
              </button>
              <button
                style={styles.resendButton}
                onClick={handleResendOtp}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </>
          )}

          {/* Terms and Privacy Policy */}
          <div style={styles.legalContainer}>
            <p style={styles.legalText}>
              By creating an account, you agree to our{' '}
              <span style={styles.legalLink} onClick={handleTermsOfService}>
                Terms of Service
              </span>{' '}
              and{' '}
              <span style={styles.legalLink} onClick={handlePrivacyPolicy}>
                Privacy Policy
              </span>
              .
            </p>
          </div>

          {/* Login Link */}
          <div style={styles.signUpContainer}>
            <p style={styles.signUpText}>
              Already have an account?{' '}
              <Link to="/login" style={styles.signUpLink}>
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;

