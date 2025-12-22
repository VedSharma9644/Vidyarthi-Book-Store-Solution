import React, { useState } from 'react';
import { checkoutStyles, colors } from '../../css/checkoutStyles';

const PaymentSection = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleEditPayment = () => {
    alert('Payment method selection will be implemented. Currently using Razorpay for all payments.');
  };

  return (
    <div style={checkoutStyles.checkoutSection}>
      <h2 style={checkoutStyles.checkoutSectionTitle}>Payment Method</h2>
      <div
        style={{
          ...checkoutStyles.infoCard,
          ...(isHovered && checkoutStyles.infoCardHover),
        }}
        onClick={handleEditPayment}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={checkoutStyles.infoCardLeft}>
          <div style={checkoutStyles.infoCardIcon}>
            <span style={checkoutStyles.infoCardIconText}>💳</span>
          </div>
          <div style={checkoutStyles.infoCardDetails}>
            <h3 style={checkoutStyles.infoCardTitle}>Razorpay</h3>
            <p style={checkoutStyles.infoCardSubtitle}>
              Pay securely with Razorpay (Cards, UPI, Netbanking, Wallets)
            </p>
          </div>
        </div>
        <span style={checkoutStyles.chevronIcon}>›</span>
      </div>
    </div>
  );
};

export default PaymentSection;

