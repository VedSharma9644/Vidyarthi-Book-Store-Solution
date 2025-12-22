import React from 'react';
import { styles } from '../../css/styles';

const LoginMethodToggle = ({ loginMethod, onMethodChange }) => {
  return (
    <div style={styles.loginMethodToggle}>
      <button
        style={{
          ...styles.toggleButton,
          ...(loginMethod === 'mobile' && styles.toggleButtonActive)
        }}
        onClick={() => onMethodChange('mobile')}
      >
        <span style={{
          ...styles.toggleButtonText,
          ...(loginMethod === 'mobile' && styles.toggleButtonTextActive)
        }}>
          Mobile OTP
        </span>
      </button>
      <button
        style={{
          ...styles.toggleButton,
          ...(loginMethod === 'email' && styles.toggleButtonActive)
        }}
        onClick={() => onMethodChange('email')}
      >
        <span style={{
          ...styles.toggleButtonText,
          ...(loginMethod === 'email' && styles.toggleButtonTextActive)
        }}>
          Email/Password
        </span>
      </button>
    </div>
  );
};

export default LoginMethodToggle;

