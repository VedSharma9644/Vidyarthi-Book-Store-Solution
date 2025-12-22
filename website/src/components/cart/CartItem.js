import React, { useState } from 'react';
import { cartStyles, colors } from '../../css/cartStyles';
import { getProductImageByCategory } from '../../config/imagePaths';

// Helper function to format category name
const getCategoryName = (bookType) => {
  if (!bookType) return 'Other';
  
  const categoryMap = {
    'TEXTBOOK': 'Mandatory',
    'NOTEBOOK': 'Notebook',
    'UNIFORM': 'Uniform',
    'STATIONARY': 'Stationary',
    'STATIONERY': 'Stationery', // Handle both spellings
    'OTHER': 'Other',
  };
  
  return categoryMap[bookType.toUpperCase()] || bookType.charAt(0) + bookType.slice(1).toLowerCase().replace(/_/g, ' ');
};

const CartItem = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const [localImageError, setLocalImageError] = useState(false);

  const imageUri = item.image && item.image.trim() !== '' ? item.image : null;
  const fallbackImage = getProductImageByCategory(item.bookType);
  const categoryName = getCategoryName(item.bookType);

  return (
    <div style={cartStyles.cartItem}>
      {/* Item Image */}
      <div>
        {imageUri && !imageError ? (
          <img
            src={imageUri}
            alt={item.name}
            style={cartStyles.cartItemImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            <img
              src={fallbackImage}
              alt={item.name || 'Product'}
              style={cartStyles.cartItemImage}
              onError={() => setLocalImageError(true)}
            />
            {localImageError && (
              <div style={cartStyles.cartItemImagePlaceholder}>📚</div>
            )}
          </>
        )}
      </div>

      {/* Item Details */}
      <div style={cartStyles.cartItemDetails}>
        {/* Category Badge */}
        <div style={cartStyles.cartItemCategory}>
          <span style={{
            ...cartStyles.cartItemCategoryBadge,
            ...(item.bookType === 'TEXTBOOK' && cartStyles.cartItemCategoryBadgeMandatory),
          }}>
            {categoryName}
          </span>
        </div>
        
        <h3 style={cartStyles.cartItemTitle}>{item.name}</h3>

        {/* Price Information */}
        <div style={cartStyles.cartItemPriceInfo}>
          <div style={cartStyles.cartItemPriceRow}>
            <span style={cartStyles.cartItemPriceLabel}>Unit Price:</span>
            <span style={cartStyles.cartItemPriceValue}>₹{item.price || 0}</span>
          </div>
          <div style={cartStyles.cartItemPriceRow}>
            <span style={cartStyles.cartItemPriceLabel}>Quantity:</span>
            <span style={cartStyles.cartItemPriceValue}>{item.quantity}</span>
          </div>
          <div style={{
            ...cartStyles.cartItemPriceRow,
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px solid ${colors.borderLight}`,
            fontSize: '16px',
            fontWeight: 'bold',
          }}>
            <span style={cartStyles.cartItemPriceLabel}>Subtotal:</span>
            <span style={{ ...cartStyles.cartItemPriceValue, fontSize: '18px' }}>
              ₹{item.subtotal || (item.price * item.quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;

