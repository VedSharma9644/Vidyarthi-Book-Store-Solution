import React, { useState } from 'react';
import { cartStyles, colors } from '../../css/cartStyles';
import { getProductImageByCategory } from '../../config/imagePaths';
import { getCategoryDisplayName } from '../../utils/categoryNames';

const CartItem = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const [localImageError, setLocalImageError] = useState(false);

  const imageUri = item.image && item.image.trim() !== '' ? item.image : null;
  const fallbackImage = getProductImageByCategory(item.bookType);
  const categoryName = getCategoryDisplayName(item.bookType);

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
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={cartStyles.cartItemCategoryBadge}>
              {categoryName}
            </span>
            {(item.bookType === 'TEXTBOOK' || item.bookType === 'MANDATORY_NOTEBOOK') && (
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '700',
                backgroundColor: '#dc2626',
                color: colors.white,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Required
              </span>
            )}
          </div>
        </div>
        
        <h3 style={cartStyles.cartItemTitle}>{item.name}</h3>

        {/* Price Information */}
        <div style={cartStyles.cartItemPriceInfo}>
          <div style={cartStyles.cartItemPriceRow}>
            <span style={cartStyles.cartItemPriceLabel}>Unit Price:</span>
            <span style={cartStyles.cartItemPriceValue}>₹{item.price || 0}</span>
          </div>
          <div style={cartStyles.cartItemPriceRow}>
            <span style={cartStyles.cartItemPriceLabel}>Qty:</span>
            <span style={cartStyles.cartItemPriceValue}>
              {item.quantity ?? item.bundlePieceCount ?? 0}
              {item.productQuantity != null && item.productQuantity > 1 ? ` (${item.productQuantity} per bundle)` : ''}
            </span>
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

