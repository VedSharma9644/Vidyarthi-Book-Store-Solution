import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { styles } from '../../css/styles';
import { LOGO_IMAGES } from '../../config/imagePaths';
import LoginForm from './LoginForm';
import LoginMethodToggle from './LoginMethodToggle';
import DemoLoginButton from './DemoLoginButton';
import DemoCredentialsInfo from './DemoCredentialsInfo';

const LoginScreen = () => {
  const [loginMethod, setLoginMethod] = useState('email');
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/');
  };

  const handleMethodChange = (method) => {
    setLoginMethod(method);
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

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.loginContainer}>
          <h2 style={styles.loginTitle}>Login</h2>
          
          {/* Demo Login Button */}
          <DemoLoginButton onLoginSuccess={handleLoginSuccess} />

          {/* Login Method Toggle */}
          <LoginMethodToggle 
            loginMethod={loginMethod} 
            onMethodChange={handleMethodChange}
          />
          
          {/* Demo Credentials Info */}
          {loginMethod === 'email' && <DemoCredentialsInfo />}

          {/* Login Form */}
          <LoginForm 
            loginMethod={loginMethod}
            onLoginSuccess={handleLoginSuccess}
          />

          {/* Sign Up Link */}
          <div style={styles.signUpContainer}>
            <p style={styles.signUpText}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.signUpLink}>
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
