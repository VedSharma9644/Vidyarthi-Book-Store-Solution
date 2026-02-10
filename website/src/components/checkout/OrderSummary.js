import React from 'react';
import { checkoutStyles, colors } from '../../css/checkoutStyles';
import { getCategoryDisplayName, getOptionalBundlesFirst, getOptionalBundlesRest } from '../../utils/categoryNames';

const DELIVERY_CHARGE = 300;

const OrderSummary = ({ cartItems, onPlaceOrder, isProcessing }) => {
  const groupItemsByCategory = () => {
    const textbooks = [];
    const mandatoryNotebooks = [];
    const optionalByType = {};
    cartItems.forEach(item => {
      if (item.bookType === 'TEXTBOOK') {
        textbooks.push(item);
      } else if (item.bookType === 'MANDATORY_NOTEBOOK') {
        mandatoryNotebooks.push(item);
      } else {
        const type = item.bookType || 'OTHER';
        if (!optionalByType[type]) {
          optionalByType[type] = { type, title: getCategoryDisplayName(type), items: [] };
        }
        optionalByType[type].items.push(item);
      }
    });
    return { textbooks, mandatoryNotebooks, optionalByType };
  };

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
  const { textbooks, mandatoryNotebooks, optionalByType } = groupItemsByCategory();
  const optionalGroups = Object.values(optionalByType);
  const optionalFirst = getOptionalBundlesFirst(optionalGroups);
  const optionalRest = getOptionalBundlesRest(optionalGroups);

  const renderBundleRow = (label, items) => {
    if (!items || items.length === 0) return null;
    const bundleTotal = items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
    return (
      <div key={label} style={{ ...checkoutStyles.priceRow, marginBottom: '6px' }}>
        <span style={{ ...checkoutStyles.priceLabel, fontSize: '13px' }}>
          {label} ({items.length} item{items.length !== 1 ? 's' : ''})
        </span>
        <span style={{ ...checkoutStyles.priceValue, fontSize: '13px' }}>₹{bundleTotal.toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div style={checkoutStyles.orderSummaryCard}>
      <h2 style={checkoutStyles.checkoutSectionTitle}>Order Summary</h2>

      {(textbooks.length > 0 || mandatoryNotebooks.length > 0 || optionalGroups.length > 0) && (
        <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${colors.borderLight || '#e5e7eb'}` }}>
          {optionalFirst.map((group) => renderBundleRow(`${group.title} Bundle`, group.items))}
          {renderBundleRow('Mandatory Textbooks Bundle', textbooks)}
          {renderBundleRow('Mandatory Notebooks Bundle', mandatoryNotebooks)}
          {optionalRest.map((group) => renderBundleRow(`${group.title} Bundle`, group.items))}
        </div>
      )}

      <div style={checkoutStyles.priceBreakdown}>
        <div style={checkoutStyles.priceRow}>
          <span style={checkoutStyles.priceLabel}>Subtotal ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''}):</span>
          <span style={checkoutStyles.priceValue}>₹{subtotal.toFixed(2)}</span>
        </div>

        <div style={checkoutStyles.priceRow}>
          <span style={checkoutStyles.priceLabel}>Delivery Charge:</span>
          <span style={checkoutStyles.priceValue}>₹{delivery.toFixed(2)}</span>
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

