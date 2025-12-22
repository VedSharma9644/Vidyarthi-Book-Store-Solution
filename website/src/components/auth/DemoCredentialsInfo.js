import React from 'react';
import { styles } from '../../css/styles';

const DemoCredentialsInfo = () => {
  return (
    <div style={styles.demoCredentialsContainer}>
      <p style={styles.demoCredentialsText}>
        📧 Demo Account for Reviewers:<br />
        Email: demo@vidyakart.com<br />
        Password: 123456
      </p>
    </div>
  );
};

export default DemoCredentialsInfo;

