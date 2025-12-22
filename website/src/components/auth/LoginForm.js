import React, { useState, useEffect } from 'react';
import { styles, colors } from '../../css/styles';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ loginMethod, onLoginSuccess }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { loginMobile, sendOtp, login } = useAuth();

  // Reset form when login method changes
  useEffect(() => {
    if (loginMethod === 'mobile') {
      setEmail('');
      setPassword('');
      setOtpSent(false);
    } else {
      setMobileNumber('');
      setOtp('');
      setOtpSent(false);
    }
  }, [loginMethod]);

  const handleSendOtp = async () => {
    if (!mobileNumber.trim()) {
      alert('Please enter your mobile number');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobileNumber.trim())) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setIsLoading(true);
      const result = await sendOtp(mobileNumber.trim());
      
      if (result.success) {
        setOtpSent(true);
        alert('OTP sent to your mobile number');
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!mobileNumber.trim() || !otp.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobileNumber.trim())) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp.trim())) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const result = await loginMobile(mobileNumber.trim(), otp.trim());
      
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const result = await login(email.trim(), password.trim());
      
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.formContainer}>
      {loginMethod === 'mobile' ? (
        <>
          {/* Mobile Number Input */}
          <div style={styles.inputContainer}>
            <input
              type="tel"
              style={{
                ...styles.input,
                ...(isMobileFocused && styles.inputFocused)
              }}
              placeholder="Mobile Number (10 digits)"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              onFocus={() => setIsMobileFocused(true)}
              onBlur={() => setIsMobileFocused(false)}
              maxLength={10}
            />
          </div>

          {/* Send OTP Button */}
          {!otpSent && (
            <button
              style={{
                ...styles.sendOtpButton,
                ...(mobileNumber.trim().length === 10 && { 
                  backgroundColor: colors.primary,
                  color: colors.white,
                }),
                ...(isLoading && styles.sendOtpButtonDisabled)
              }}
              onClick={handleSendOtp}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          )}

          {/* OTP Input */}
          {otpSent && (
            <>
              <div style={styles.inputContainer}>
                <input
                  type="tel"
                  style={{
                    ...styles.input,
                    ...(isOtpFocused && styles.inputFocused)
                  }}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onFocus={() => setIsOtpFocused(true)}
                  onBlur={() => setIsOtpFocused(false)}
                  maxLength={6}
                />
              </div>

              <button
                style={{
                  ...styles.loginButton,
                  ...(isLoading && styles.loginButtonDisabled)
                }}
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login with OTP'}
              </button>

              <button
                style={styles.resendButton}
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </>
          )}
        </>
      ) : (
        <>
          {/* Email Input */}
          <div style={styles.inputContainer}>
            <input
              type="email"
              style={{
                ...styles.input,
                ...(isEmailFocused && styles.inputFocused)
              }}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
            />
          </div>

          {/* Password Input */}
          <div style={styles.inputContainer}>
            <input
              type="password"
              style={{
                ...styles.input,
                ...(isPasswordFocused && styles.inputFocused)
              }}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
          </div>

          {/* Email Login Button */}
          <button
            style={{
              ...styles.loginButton,
              ...(isLoading && styles.loginButtonDisabled)
            }}
            onClick={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </>
      )}
    </div>
  );
};

export default LoginForm;

