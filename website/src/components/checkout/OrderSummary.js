import React from 'react';
import { checkoutStyles, colors } from '../../css/checkoutStyles';

const DELIVERY_CHARGE = 300;
const TAX_RATE = 0.1; // 10%

const OrderSummary = ({ cartItems, onPlaceOrder, isProcessing }) => {
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.subtotal || (item.price * item.quantity));
    }, 0);
  };

  const calculateDelivery = () => {
    return cartItems.length > 0 ? DELIVERY_CHARGE : 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * TAX_RATE;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateDelivery();
  };

  const subtotal = calculateSubtotal();
  const delivery = calculateDelivery();
  const tax = calculateTax();
  const total = calculateTotal();

  return (
    <div style={checkoutStyles.orderSummaryCard}>
      <h2 style={checkoutStyles.checkoutSectionTitle}>Order Summary</h2>

      <div style={checkoutStyles.priceBreakdown}>
        <div style={checkoutStyles.priceRow}>
          <span style={checkoutStyles.priceLabel}>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}):</span>
          <span style={checkoutStyles.priceValue}>₹{subtotal.toFixed(2)}</span>
        </div>

        <div style={checkoutStyles.priceRow}>
          <span style={checkoutStyles.priceLabel}>Delivery Charge:</span>
          <span style={checkoutStyles.priceValue}>₹{delivery.toFixed(2)}</span>
        </div>

        <div style={checkoutStyles.priceRow}>
          <span style={checkoutStyles.priceLabel}>Tax (10%):</span>
          <span style={checkoutStyles.priceValue}>₹{tax.toFixed(2)}</span>
        </div>

        <div style={checkoutStyles.priceTotalRow}>
          <span style={checkoutStyles.priceTotalLabel}>Total:</span>
          <span style={checkoutStyles.priceTotalValue}>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <button
        style={{
          ...checkoutStyles.placeOrderButton,
          ...(isProcessing && checkoutStyles.placeOrderButtonDisabled),
        }}
        onClick={onPlaceOrder}
        disabled={isProcessing || cartItems.length === 0}
        onMouseEnter={(e) => {
          if (!isProcessing && cartItems.length > 0) {
            Object.assign(e.currentTarget.style, checkoutStyles.placeOrderButtonHover);
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = colors.primary;
        }}
      >
        {isProcessing ? 'Processing...' : 'Place Order'}
      </button>
    </div>
  );
};

export default OrderSummary;

