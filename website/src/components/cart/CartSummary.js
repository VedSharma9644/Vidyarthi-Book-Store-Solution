import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartStyles, colors } from '../../css/cartStyles';
import { borderRadius } from '../../css/theme';
import {
  readCheckoutStudentName,
  persistCheckoutStudentName,
} from '../../utils/students';

const DELIVERY_CHARGE = 300;

const CartSummary = ({ cartItems }) => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState(() => readCheckoutStudentName());
  const [studentError, setStudentError] = useState('');

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.subtotal || (item.price * item.quantity));
    }, 0);
  };

  const calculateDelivery = () => {
    return cartItems.length > 0 ? DELIVERY_CHARGE : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDelivery();
  };

  const subtotal = calculateSubtotal();
  const delivery = calculateDelivery();
  const total = calculateTotal();

  const handleCheckout = () => {
    const trimmed = studentName.trim();
    if (!trimmed) {
      setStudentError('Please enter the student name before checkout.');
      return;
    }
    setStudentError('');
    persistCheckoutStudentName(trimmed);
    navigate('/checkout', { state: { studentName: trimmed } });
  };

  return (
    <div style={cartStyles.cartSummary}>
      <h2 style={cartStyles.cartSummaryTitle}>Order Summary</h2>

      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="cart-student-name"
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: colors.textPrimary,
            marginBottom: '6px',
          }}
        >
          Order Placing for:
        </label>
        <div style={{ marginBottom: '8px', color: colors.textPrimary, fontSize: '13px', fontWeight: 700 }}>
          STUDENT NAME <span style={{ color: '#ef4444' }}>*</span>
        </div>
        <input
          id="cart-student-name"
          type="text"
          value={studentName}
          onChange={(e) => {
            setStudentName(e.target.value);
            if (studentError) setStudentError('');
          }}
          placeholder="Enter student name"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            border: `1px solid ${studentError ? '#ef4444' : colors.borderLight || '#dee2e6'}`,
            borderRadius: borderRadius.md,
            boxSizing: 'border-box',
          }}
        />
        {studentError ? (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#ef4444' }}>{studentError}</p>
        ) : (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: colors.textSecondary }}>
            Required before you proceed to checkout.
          </p>
        )}
      </div>

      <div style={cartStyles.cartSummaryRow}>
        <span style={cartStyles.cartSummaryLabel}>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}):</span>
        <span style={cartStyles.cartSummaryValue}>₹{subtotal.toFixed(2)}</span>
      </div>

      <div style={cartStyles.cartSummaryRow}>
        <span style={cartStyles.cartSummaryLabel}>Delivery Charge:</span>
        <span style={cartStyles.cartSummaryValue}>₹{delivery.toFixed(2)}</span>
      </div>

      <div style={cartStyles.cartSummaryTotal}>
        <span style={cartStyles.cartSummaryTotalLabel}>Total:</span>
        <span style={cartStyles.cartSummaryTotalValue}>₹{total.toFixed(2)}</span>
      </div>

      <button
        style={cartStyles.checkoutButton}
        onClick={handleCheckout}
        disabled={cartItems.length === 0}
        onMouseEnter={(e) => {
          if (cartItems.length > 0) {
            Object.assign(e.currentTarget.style, cartStyles.checkoutButtonHover);
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = colors.primary;
        }}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartSummary;
