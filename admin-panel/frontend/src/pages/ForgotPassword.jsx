import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailAPI } from '../services/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP and Reset
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await emailAPI.requestPasswordReset();
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'OTP has been sent to your registered email address. Please check your inbox.',
        });
        setStep(2);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to send OTP. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send OTP. Please make sure email is configured.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!otp || !newPassword || !confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Please fill in all fields',
      });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await emailAPI.resetPassword(otp, newPassword);
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'Password reset successfully! Redirecting to login...',
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to reset password',
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reset password. Please check your OTP and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Reset Password</h1>
          <p>Reset your admin panel password</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`} role="alert">
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="login-form">
            <div className="form-group">
              <p className="text-muted">
                Click the button below to receive an OTP (One-Time Password) on your registered email address.
                The OTP will be valid for 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                required
                autoFocus
                disabled={loading}
                maxLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link"
                onClick={() => setStep(1)}
              >
                Request New OTP
              </button>
              <span className="mx-2">|</span>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

