import React, { useState } from 'react';
import { styles, colors } from '../../css/styles';
import { useAuth } from '../../contexts/AuthContext';

const DemoLoginButton = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@vidyakart.com';
    const demoPassword = '123456';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(demoEmail)) {
      alert('Invalid demo email format');
      return;
    }

    try {
      setIsLoading(true);
      const result = await login(demoEmail, demoPassword);
      
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      style={{
        ...styles.demoLoginButton,
        ...(isLoading && styles.demoLoginButtonDisabled)
      }}
      onClick={handleDemoLogin}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : '🚀 Demo Login (demo@vidyakart.com)'}
    </button>
  );
};

export default DemoLoginButton;

