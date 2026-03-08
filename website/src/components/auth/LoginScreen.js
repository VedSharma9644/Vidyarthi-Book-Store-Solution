import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from '../../css/styles';
import { LOGO_IMAGES } from '../../config/imagePaths';
import LoginForm from './LoginForm';

const LoginScreen = () => {
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/');
  };

  const handleRegisterSuccess = () => {
    navigate('/profile/complete');
  };

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

      {/* Main Content - Mobile OTP only */}
      <div style={styles.mainContent}>
        <div style={styles.loginContainer}>
          <h2 style={styles.loginTitle}>Login or create account</h2>

          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onRegisterSuccess={handleRegisterSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
