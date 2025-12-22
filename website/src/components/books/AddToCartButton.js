import React from 'react';
import { colors } from '../../css/styles';

const AddToCartButton = ({ 
  textbooks, 
  optionalItemsByType, 
  selectedBundles, 
  isAddingToCart, 
  onAddToCart 
}) => {
  const hasOptionalSelected = Object.entries(selectedBundles).some(
    ([type, selected]) => selected && optionalItemsByType[type]
  );

  return (
    <div style={{
      padding: '16px',
      borderTop: `1px solid ${colors.borderLight}`,
      backgroundColor: colors.white,
      boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      bottom: 0,
    }}>
      <button
        style={{
          width: '100%',
          height: '52px',
          backgroundColor: colors.primary,
          borderRadius: '12px',
          border: 'none',
          cursor: isAddingToCart ? 'not-allowed' : 'pointer',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          opacity: isAddingToCart ? 0.6 : 1,
          color: colors.white,
          fontSize: '18px',
          fontWeight: 'bold',
        }}
        onClick={onAddToCart}
        disabled={isAddingToCart}
      >
        {isAddingToCart ? (
          <>
            <span>⏳</span>
            <span>Adding...</span>
          </>
        ) : (
          <>
            <span>🛒</span>
            <span>Add All to Cart</span>
          </>
        )}
      </button>
      <p style={{
        color: colors.textSecondary,
        fontSize: '12px',
        textAlign: 'center',
        marginTop: '8px',
        margin: '8px 0 0 0',
      }}>
        {textbooks.length} mandatory textbook{textbooks.length !== 1 ? 's' : ''}
        {hasOptionalSelected && ' + Optional bundles selected'}
      </p>
    </div>
  );
};

export default AddToCartButton;

