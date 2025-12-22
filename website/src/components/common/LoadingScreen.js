import React from 'react';
import { colors } from '../../css/theme';

const LoadingScreen = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: colors.backgroundLight,
    }}>
      <div style={{
        fontSize: '18px',
        color: colors.textLight,
      }}>
        Loading...
      </div>
    </div>
  );
};

export default LoadingScreen;

