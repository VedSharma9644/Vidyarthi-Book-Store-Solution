import React, { useState } from 'react';
import { colors } from '../../css/theme';
import { getProductImageByCategory, DEFAULT_IMAGES } from '../../config/imagePaths';

const BookTable = ({ books }) => {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (bookId) => {
    setImageErrors(prev => ({ ...prev, [bookId]: true }));
  };

  const getBookImage = (book) => {
    if (book.coverImageUrl && book.coverImageUrl.trim() !== '' && !imageErrors[book.id]) {
      return book.coverImageUrl;
    }
    return getProductImageByCategory(book.bookType || book.category) || DEFAULT_IMAGES.BOOK_PLACEHOLDER;
  };

  if (!books || books.length === 0) {
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
        minWidth: '600px',
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
            }}>Per Unit</th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              width: '100px',
            }}>Quantity</th>
            <th style={{
              padding: '12px 16px',
              textAlign: 'right',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              width: '120px',
            }}>Total</th>
          </tr>
        </thead>
        
        {/* Table Body */}
        <tbody>
          {books.map((book, index) => (
            <tr
              key={book.id}
              style={{
                borderBottom: index < books.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
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
                    src={getBookImage(book)}
                    alt={book.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={() => handleImageError(book.id)}
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
                  {book.title}
                </div>
              </td>
              
              {/* Per Unit Price */}
              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.primary,
                }}>
                  ₹{book.perProductPrice || '-'}
                </div>
              </td>
              
              {/* Quantity */}
              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}>
                  {book.productQuantity || '-'}
                </div>
              </td>
              
              {/* Total Price */}
              <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: colors.primary,
                }}>
                  ₹{book.price || '0'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookTable;

