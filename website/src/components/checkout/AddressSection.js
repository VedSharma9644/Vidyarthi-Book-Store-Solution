import React, { useState } from 'react';
import { checkoutStyles, colors } from '../../css/checkoutStyles';
import AddressModal from './AddressModal';

const AddressSection = ({
  shippingAddress,
  onAddressChange,
  requireStudentSelection = false,
  selectedStudentId = '',
  onStudentRequired,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const addressBlockedUntilStudent =
    requireStudentSelection && !selectedStudentId;

  const handleOpenAddress = () => {
    if (addressBlockedUntilStudent) {
      if (onStudentRequired) {
        onStudentRequired();
      }
      return;
    }
    setShowModal(true);
  };

  const formatAddressDisplay = () => {
    if (addressBlockedUntilStudent) {
      return 'Select a student above, then add your shipping address';
    }
    if (!shippingAddress.address && !shippingAddress.city) {
      return 'Tap to add shipping address';
    }
    const parts = [];
    if (shippingAddress.address) parts.push(shippingAddress.address);
    if (shippingAddress.city) parts.push(shippingAddress.city);
    if (shippingAddress.state) parts.push(shippingAddress.state);
    if (shippingAddress.postalCode) parts.push(shippingAddress.postalCode);
    return parts.join(', ');
  };

  const formatStudentInfo = () => {
    const parts = [];
    if (shippingAddress.studentName) parts.push(`Student: ${shippingAddress.studentName}`);
    if (shippingAddress.studentRollNumber) parts.push(`Roll No: ${shippingAddress.studentRollNumber}`);
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  return (
    <>
      <div style={checkoutStyles.checkoutSection}>
        <h2 style={checkoutStyles.checkoutSectionTitle}>Shipping Address</h2>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenAddress();
            }
          }}
          onClick={handleOpenAddress}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...checkoutStyles.infoCard,
            ...(isHovered && !addressBlockedUntilStudent && checkoutStyles.infoCardHover),
            ...(addressBlockedUntilStudent && { opacity: 0.65, cursor: 'not-allowed' }),
          }}
        >
          <div style={checkoutStyles.infoCardLeft}>
            <div style={checkoutStyles.infoCardIcon}>
              <span style={checkoutStyles.infoCardIconText}>📍</span>
            </div>
            <div style={checkoutStyles.infoCardDetails}>
              <h3 style={checkoutStyles.infoCardTitle}>
                {shippingAddress.name || 'Add Shipping Address'}
              </h3>
              {formatStudentInfo() && (
                <p style={{
                  fontSize: '13px',
                  color: colors.primary,
                  fontWeight: '500',
                  margin: '4px 0',
                }}>
                  {formatStudentInfo()}
                </p>
              )}
              <p style={checkoutStyles.infoCardSubtitle}>
                {formatAddressDisplay()}
              </p>
            </div>
          </div>
          <span style={checkoutStyles.chevronIcon}>›</span>
        </div>
      </div>

      {showModal && (
        <AddressModal
          onClose={() => setShowModal(false)}
          onSelectAddress={onAddressChange}
          selectedAddress={shippingAddress}
        />
      )}
    </>
  );
};

export default AddressSection;
