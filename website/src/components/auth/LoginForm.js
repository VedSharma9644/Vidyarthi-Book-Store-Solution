import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles, colors } from '../../css/styles';
import { useAuth } from '../../contexts/AuthContext';

const PROFILE_COMPLETE_PATH = '/profile/complete';
const OTP_PENDING_KEY = 'login_otp_pending';

function getOtpPending() {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(OTP_PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.mobileNumber && data?.otpSent ? data : null;
  } catch {
    return null;
  }
}

function setOtpPending(mobileNumber) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(
        OTP_PENDING_KEY,
        JSON.stringify({ mobileNumber, otpSent: true })
      );
    }
  } catch (_) {}
}

function clearOtpPending() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(OTP_PENDING_KEY);
    }
  } catch (_) {}
}

const STEP = { MOBILE: 'mobile', OTP: 'otp', NEW_USER: 'new_user' };

const LoginForm = ({ onLoginSuccess, onRegisterSuccess }) => {
  const navigate = useNavigate();
  const newUserFormRef = useRef(null);
  const { loginMobile, sendOtp, registerMobile } = useAuth();

  const pending = getOtpPending();
  const [step, setStep] = useState(() =>
    pending?.otpSent ? STEP.OTP : STEP.MOBILE
  );
  const [mobileNumber, setMobileNumber] = useState(() => pending?.mobileNumber ?? '');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  useEffect(() => {
    if (step === STEP.NEW_USER && newUserFormRef.current) {
      newUserFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [step]);

  const handleSendOtp = async () => {
    setError('');
    const mobile = mobileNumber.trim();
    if (!mobile) {
      setError('Please enter your mobile number');
      return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setOtp('');
    setOtpMessage('');
    try {
      const result = await sendOtp(mobile);
      if (result?.success) {
        setOtpPending(mobile);
        setStep(STEP.OTP);
        setOtpMessage('OTP sent. Enter the code below.');
      } else {
        setError(result?.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setOtpMessage('');
    const mobile = mobileNumber.trim();
    if (!mobile) return;
    setLoading(true);
    setError('');
    try {
      const result = await sendOtp(mobile);
      if (result?.success) {
        setOtpPending(mobile);
        setOtpMessage('New OTP sent. Enter the new code below.');
      } else {
        setError(result?.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setError('');
    const mobile = mobileNumber.trim();
    const code = otp.trim();
    if (!mobile || !code) {
      setError('Please enter mobile number and OTP');
      return;
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!/^[0-9]{6}$/.test(code)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await loginMobile(mobile, code);
      if (result?.success) {
        clearOtpPending();
        onLoginSuccess?.();
        navigate('/', { replace: true });
        return;
      }
      const isNewUser =
        result?.userNotFound === true ||
        (result?.message && /not found|register first/i.test(String(result.message)));
      if (isNewUser) {
        setStep(STEP.NEW_USER);
        setError('');
      } else {
        setError(result?.message || 'Login failed');
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? '';
      const isNewUser = /not found|register first/i.test(String(msg)) || err?.response?.status === 404;
      if (isNewUser) {
        setStep(STEP.NEW_USER);
        setError('');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError('');
    if (!fullName.trim() || !email.trim() || !school.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    setLoading(true);
    try {
      const result = await registerMobile({
        mobileNumber: mobileNumber.trim(),
        otp: otp.trim(),
        firstName,
        lastName,
        schoolName: school.trim(),
        email: email.trim(),
      });
      if (result?.success) {
        clearOtpPending();
        onRegisterSuccess?.();
        onLoginSuccess?.();
        setTimeout(() => navigate(PROFILE_COMPLETE_PATH, { replace: true }), 0);
      } else {
        setError(result?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    clearOtpPending();
    setStep(STEP.OTP);
    setError('');
  };

  const showMobile = step === STEP.MOBILE;
  const showOtp = step === STEP.OTP && !showMobile;
  const showNewUser = step === STEP.NEW_USER;

  return (
    <div style={styles.formContainer}>
      {error ? (
        <div
          style={{
            width: '100%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      ) : null}

      {/* Mobile number */}
      <div style={styles.inputContainer}>
        <input
          type="tel"
          style={styles.input}
          placeholder="Mobile Number (10 digits)"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
          maxLength={10}
          disabled={showNewUser}
        />
      </div>

      {showMobile && (
        <button
          style={{
            ...styles.sendOtpButton,
            ...(mobileNumber.trim().length === 10 && {
              backgroundColor: colors.primary,
              color: colors.white,
            }),
            ...(loading && styles.sendOtpButtonDisabled),
          }}
          onClick={handleSendOtp}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      )}

      {showOtp && (
        <>
          {otpMessage ? (
            <p style={{ fontSize: '14px', color: '#059669', marginBottom: '8px', textAlign: 'center' }}>
              {otpMessage}
            </p>
          ) : null}
          <div style={styles.inputContainer}>
            <input
              type="tel"
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
          </div>
          <button
            style={{ ...styles.loginButton, ...(loading && styles.loginButtonDisabled) }}
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
          <button style={styles.resendButton} onClick={handleResendOtp} disabled={loading}>
            Resend OTP
          </button>
        </>
      )}

      {showNewUser && (
        <div ref={newUserFormRef}>
          <p
            style={{
              fontSize: '14px',
              color: colors.contentLight,
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            This number isn’t registered. Create an account to continue.
          </p>
          <div style={styles.inputContainer}>
            <input
              type="text"
              style={{ ...styles.registerInput, ...styles.input }}
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div style={{ ...styles.inputContainer, marginTop: '8px' }}>
            <input
              type="email"
              style={{ ...styles.registerInput, ...styles.input }}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ ...styles.inputContainer, marginTop: '8px' }}>
            <input
              type="text"
              style={{ ...styles.registerInput, ...styles.input }}
              placeholder="School"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </div>
          <button
            style={{
              ...styles.registerButton,
              marginTop: '16px',
              ...(loading && styles.registerButtonDisabled),
            }}
            onClick={handleCreateAccount}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <button
            type="button"
            style={{ ...styles.resendButton, marginTop: '8px' }}
            onClick={handleBackToLogin}
            disabled={loading}
          >
            Back to login
          </button>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
