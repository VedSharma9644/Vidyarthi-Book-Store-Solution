import React from 'react';
import { colors } from '../../css/styles';

const BookItem = ({ book }) => {
  const imageUri = book.coverImageUrl && book.coverImageUrl.trim() !== '' 
    ? book.coverImageUrl 
    : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundLight,
      padding: '8px 16px',
      minHeight: '72px',
      gap: '16px',
    }}>
      {/* Book Image */}
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '8px',
        backgroundColor: colors.gray100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {imageUri ? (
          <img
            src={imageUri}
            alt={book.title}
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'cover',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{
          display: imageUri ? 'none' : 'flex',
          width: '56px',
          height: '56px',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '20px',
        }}>
          📚
        </div>
      </div>

      {/* Book Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          color: colors.textPrimary,
          fontSize: '16px',
          fontWeight: '500',
          margin: '0 0 6px 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {book.title}
        </h4>

        {/* Price Details */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            fontSize: '12px',
            color: colors.textSecondary,
          }}>
            <span style={{ flex: 1 }}>Per Unit</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            marginTop: '2px',
          }}>
            <span style={{ 
              flex: 1, 
              fontSize: '14px', 
              fontWeight: '600', 
              color: colors.primary 
            }}>
              ₹{book.perProductPrice || '-'}
            </span>

            <span style={{ 
              flex: 1, 
              fontSize: '14px', 
              fontWeight: '600', 
              color: colors.primary,
              textAlign: 'center',
            }}>
              {book.productQuantity || '-'}
            </span>

            <span style={{ 
              flex: 1, 
              fontSize: '14px', 
              fontWeight: '600', 
              color: colors.primary,
              textAlign: 'right',
            }}>
              ₹{book.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookItem;

