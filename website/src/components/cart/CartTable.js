import React, { useState } from 'react';
import { colors } from '../../css/theme';
import { getProductImageByCategory, DEFAULT_IMAGES } from '../../config/imagePaths';

// Helper function to format category name
const getCategoryName = (bookType) => {
  if (!bookType) return 'Other';
  
  const categoryMap = {
    'TEXTBOOK': 'Textbooks',
    'NOTEBOOK': 'Notebooks',
    'UNIFORM': 'Uniforms',
    'STATIONARY': 'Stationary',
    'STATIONERY': 'Stationery',
    'OTHER': 'Other',
  };
  
  return categoryMap[bookType.toUpperCase()] || bookType.charAt(0) + bookType.slice(1).toLowerCase().replace(/_/g, ' ');
};

const CartTable = ({ items }) => {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const getItemImage = (item) => {
    if (item.image && item.image.trim() !== '' && !imageErrors[item.id]) {
      return item.image;
    }
    return getProductImageByCategory(item.bookType) || DEFAULT_IMAGES.BOOK_PLACEHOLDER;
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      overflowX: 'auto',
      backgroundColor: colors.white,
      borderRadius: '8px',
      border: `1px solid ${colors.borderLight}`,
      marginBottom: '24px',
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '700px',
      }}>
        {/* Table Header */}
        <thead>
          <tr style={{
            backgroundColor: colors.gray50,
            borderBottom: `2px solid ${colors.borderLight}`,
          }}>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              width: '60px',
            }}>Image</th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
            }}>Product Name</th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              width: '120px',
            }}>Unit Price</th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              width: '150px',
            }}>Pieces in Bundle</th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'right',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              width: '120px',
            }}>Subtotal</th>
          </tr>
        </thead>
        
        {/* Table Body */}
        <tbody>
          {items.map((item, index) => (
            <tr
              key={item.id}
              style={{
                borderBottom: index < items.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.gray50;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Image */}
              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                <div style={{
                  width: '60px',
                  height: '80px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  backgroundColor: colors.gray100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img
                    src={getItemImage(item)}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={() => handleImageError(item.id)}
                  />
                </div>
              </td>
              
              {/* Product Name */}
              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: colors.textPrimary,
                  lineHeight: '1.4',
                }}>
                  {item.name}
                </div>
                {/* Category Badge */}
                <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    backgroundColor: colors.gray100,
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {getCategoryName(item.bookType)}
                  </span>
                  {item.bookType === 'TEXTBOOK' && (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
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
              </td>
              
              {/* Unit Price */}
              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.primary,
                }}>
                  ₹{item.price || 0}
                </div>
              </td>
              
              {/* Pieces in Bundle (Read-only) */}
              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}>
                  {item.bundlePieceCount || item.quantity || 0}
                </div>
              </td>
              
              {/* Subtotal */}
              <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: colors.primary,
                }}>
                  ₹{item.subtotal || (item.price * item.quantity)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CartTable;

