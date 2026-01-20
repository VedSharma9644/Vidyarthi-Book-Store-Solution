import { useState, useEffect } from 'react';
import { emailAPI } from '../services/api';
import './EmailConfig.css';

const EmailConfig = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: false,
    fromEmail: '',
  });
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getConfig();
      if (response.data.success && response.data.data) {
        setFormData({
          smtpHost: response.data.data.smtpHost || '',
          smtpPort: response.data.data.smtpPort || '587',
          smtpUser: response.data.data.smtpUser || '',
          smtpPassword: '', // Don't load password
          smtpSecure: response.data.data.smtpSecure || false,
          fromEmail: response.data.data.fromEmail || '',
        });
      }
    } catch (error) {
      console.error('Error loading email config:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load email configuration',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      const response = await emailAPI.saveConfig(formData);
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'Email configuration saved successfully!',
        });
        // Reload config to get updated values
        await loadConfig();
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to save email configuration',
        });
      }
    } catch (error) {
      console.error('Error saving email config:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save email configuration',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (e) => {
    e.preventDefault();
    if (!testEmail) {
      setMessage({
        type: 'error',
        text: 'Please enter a test email address',
      });
      return;
    }

    setMessage({ type: '', text: '' });
    setTesting(true);

    try {
      const response = await emailAPI.testConfig(testEmail);
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'Test email sent successfully! Please check your inbox.',
        });
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to send test email',
        });
      }
    } catch (error) {
      console.error('Error testing email config:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send test email',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="header">
        <h1 className="header-title">Email Configuration</h1>
        <p>Configure SMTP settings for sending emails (password reset OTP, etc.)</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`} role="alert">
          {message.text}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="card-title mb-0">SMTP Settings</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="smtpHost" className="form-label">
                    SMTP Host <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="smtpHost"
                    name="smtpHost"
                    value={formData.smtpHost}
                    onChange={handleChange}
                    placeholder="e.g., smtp.gmail.com"
                    required
                  />
                  <small className="form-text text-muted">
                    Gmail: smtp.gmail.com | Outlook: smtp-mail.outlook.com | Custom: your SMTP server
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="smtpPort" className="form-label">
                    SMTP Port <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="smtpPort"
                    name="smtpPort"
                    value={formData.smtpPort}
                    onChange={handleChange}
                    placeholder="587"
                    required
                  />
                  <small className="form-text text-muted">
                    Common ports: 587 (TLS), 465 (SSL), 25 (not recommended)
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="smtpUser" className="form-label">
                    SMTP Username/Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="smtpUser"
                    name="smtpUser"
                    value={formData.smtpUser}
                    onChange={handleChange}
                    placeholder="your-email@gmail.com"
                    required
                  />
                  <small className="form-text text-muted">
                    Your email address used for SMTP authentication
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="smtpPassword" className="form-label">
                    SMTP Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="smtpPassword"
                    name="smtpPassword"
                    value={formData.smtpPassword}
                    onChange={handleChange}
                    placeholder="Enter SMTP password or app password"
                    required
                  />
                  <small className="form-text text-muted">
                    For Gmail: Use App Password (not your regular password). Enable 2FA and generate app password.
                  </small>
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="smtpSecure"
                    name="smtpSecure"
                    checked={formData.smtpSecure}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="smtpSecure">
                    Use SSL/TLS (usually for port 465)
                  </label>
                </div>

                <div className="mb-3">
                  <label htmlFor="fromEmail" className="form-label">
                    From Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="fromEmail"
                    name="fromEmail"
                    value={formData.fromEmail}
                    onChange={handleChange}
                    placeholder="noreply@yourdomain.com"
                  />
                  <small className="form-text text-muted">
                    Email address shown as sender (defaults to SMTP username if not set)
                  </small>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="card-title mb-0">Test Email</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Send a test email to verify your configuration is working correctly.
              </p>
              <form onSubmit={handleTest}>
                <div className="mb-3">
                  <label htmlFor="testEmail" className="form-label">
                    Test Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="testEmail"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-outline-primary" disabled={testing}>
                  {testing ? 'Sending...' : 'Send Test Email'}
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm mt-3">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Guide</h5>
            </div>
            <div className="card-body">
              <h6>Gmail Setup:</h6>
              <ul className="small">
                <li>Host: smtp.gmail.com</li>
                <li>Port: 587</li>
                <li>Enable 2FA on your Google account</li>
                <li>Generate App Password from Google Account settings</li>
                <li>Use App Password (not your regular password)</li>
              </ul>
              <h6 className="mt-3">Outlook Setup:</h6>
              <ul className="small">
                <li>Host: smtp-mail.outlook.com</li>
                <li>Port: 587</li>
                <li>Use your Outlook email and password</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfig;

