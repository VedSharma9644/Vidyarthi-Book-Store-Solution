import React from 'react';
import { colors } from '../../css/checkoutStyles';
import { borderRadius } from '../../css/theme';

const CheckoutStudentSection = ({
  studentName,
  onStudentNameChange,
  error = '',
  readOnly = false,
  description = 'This student name will be attached to your order in the admin panel.',
}) => (
  <div
    style={{
      backgroundColor: colors.white,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.borderLight}`,
      marginBottom: '16px',
    }}
  >
    <h3 style={{ margin: 0, marginBottom: '6px', color: colors.textPrimary, fontSize: '1rem' }}>
      Order Placing for:
    </h3>
    <div style={{ marginBottom: '12px', color: colors.textPrimary, fontSize: '0.95rem', fontWeight: 600 }}>
      STUDENT NAME <span style={{ color: '#ef4444' }}>*</span>
    </div>
    {readOnly ? (
      <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: colors.textPrimary }}>
        {studentName}
      </p>
    ) : (
      <input
        type="text"
        value={studentName}
        onChange={(e) => onStudentNameChange(e.target.value)}
        placeholder="Enter student name"
        aria-required="true"
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: borderRadius.md,
          border: `1px solid ${error ? '#ef4444' : colors.borderLight}`,
          fontSize: '15px',
          boxSizing: 'border-box',
        }}
      />
    )}
    {error ? (
      <p style={{ margin: '8px 0 0', fontSize: 13, color: '#ef4444' }}>{error}</p>
    ) : (
      <p style={{ margin: '8px 0 0', fontSize: 13, color: colors.textSecondary }}>{description}</p>
    )}
  </div>
);

export default CheckoutStudentSection;
