import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import authService from '../services/auth';
import './ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      if (response.data?.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'Password updated. Redirecting to sign in…',
        });
        await authService.logout();
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      } else {
        setMessage({
          type: 'error',
          text: response.data?.message || 'Could not update password.',
        });
      }
    } catch (error) {
      const text =
        error.response?.data?.message ||
        error.message ||
        'Could not update password. Please try again.';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid change-password-page">
      <div className="header">
        <h1 className="header-title text-white">Change password</h1>
        <p className="text-white mb-0">Update the admin account password stored in your system</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              {message.text ? (
                <div
                  className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                  role="alert"
                >
                  {message.text}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="change-password-form">
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    className="form-control"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    New password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    className="form-control"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={saving}
                  />
                  <div className="form-text">At least 6 characters.</div>
                </div>
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="form-control"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Update password'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={saving}
                    onClick={() => navigate('/admin-dashboard')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
