import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cartStyles, colors } from '../../css/cartStyles';

const DELIVERY_CHARGE = 300;

const CartSummary = ({ cartItems }) => {
  const navigate = useNavigate();

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
    navigate('/checkout');
  };

  return (
    <div style={cartStyles.cartSummary}>
      <h2 style={cartStyles.cartSummaryTitle}>Order Summary</h2>

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

