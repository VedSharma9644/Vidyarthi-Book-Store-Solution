import React, { useState } from 'react';
import { booksStyles, colors } from '../../css/booksStyles';
import { getProductImageByCategory, DEFAULT_IMAGES } from '../../config/imagePaths';
import { useIsMobile } from '../../hooks/useMediaQuery';

const BookCard = ({ book }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isMobile = useIsMobile();

  // Get image from API first, fallback to local placeholder based on category
  const imageUri = book.coverImageUrl && book.coverImageUrl.trim() !== '' 
    ? book.coverImageUrl 
    : null;
  
  // Fallback image based on book category
  const fallbackImage = getProductImageByCategory(book.bookType || book.category) || DEFAULT_IMAGES.BOOK_PLACEHOLDER;

  // Mobile layout: horizontal card
  if (isMobile) {
    return (
      <div
        style={{
          ...booksStyles.bookCard,
          ...booksStyles.bookCardMobile,
        }}
      >
        {/* Book Image - Left Side */}
        <div style={booksStyles.bookImageContainerMobile}>
          {imageUri && !imageError ? (
            <img
              src={imageUri}
              alt={book.title}
              style={booksStyles.bookImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <>
              <img
                src={fallbackImage}
                alt={book.title || 'Book'}
                style={booksStyles.bookImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div style={{
                ...booksStyles.bookImagePlaceholder,
                display: 'none',
              }}>
                📚
              </div>
            </>
          )}
        </div>

        {/* Book Content - Right Side */}
        <div style={booksStyles.bookCardContentMobile}>
          <h3 style={booksStyles.bookTitleMobile}>{book.title}</h3>

          {/* Price Information Table */}
          <div style={booksStyles.bookPriceTableMobile}>
            {/* Header Row */}
            <div style={booksStyles.bookPriceTableRow}>
              <span style={{...booksStyles.bookPriceTableHeader}}>Per Unit</span>
              <span style={{...booksStyles.bookPriceTableHeader, textAlign: 'center'}}>Qty</span>
              <span style={{...booksStyles.bookPriceTableHeader, textAlign: 'right'}}>Total</span>
            </div>
            {/* Value Row */}
            <div style={booksStyles.bookPriceTableRow}>
              <span style={{...booksStyles.bookPriceTableValue}}>
                ₹{book.perProductPrice || '-'}
              </span>
              <span style={{...booksStyles.bookPriceTableValue, textAlign: 'center'}}>
                {book.productQuantity || '-'}
              </span>
              <span style={{...booksStyles.bookPriceTableValue, textAlign: 'right'}}>
                ₹{book.price || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Tablet layout: vertical card
  return (
    <div
      style={{
        ...booksStyles.bookCard,
        ...(isHovered && booksStyles.bookCardHover),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Book Image */}
      <div style={booksStyles.bookImageContainer}>
        {imageUri && !imageError ? (
          <img
            src={imageUri}
            alt={book.title}
            style={booksStyles.bookImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            <img
              src={fallbackImage}
              alt={book.title || 'Book'}
              style={booksStyles.bookImage}
              onError={(e) => {
                // If local image also fails, show emoji placeholder
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
            <div style={{
              ...booksStyles.bookImagePlaceholder,
              display: 'none',
            }}>
              📚
            </div>
          </>
        )}
      </div>

      {/* Book Content */}
      <div style={booksStyles.bookCardContent}>
        <h3 style={booksStyles.bookTitle}>{book.title}</h3>

        {/* Price Information */}
        <div style={booksStyles.bookPriceInfo}>
          <div style={booksStyles.bookPriceRow}>
            <span style={booksStyles.bookPriceLabel}>Per Unit:</span>
            <span style={booksStyles.bookPriceValue}>
              ₹{book.perProductPrice || '-'}
            </span>
          </div>
          <div style={booksStyles.bookPriceRow}>
            <span style={booksStyles.bookPriceLabel}>Quantity:</span>
            <span style={booksStyles.bookPriceValue}>
              {book.productQuantity || '-'}
            </span>
          </div>
          <div style={{
            ...booksStyles.bookPriceRow,
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px solid ${colors.borderLight}`,
          }}>
            <span style={booksStyles.bookPriceLabel}>Total:</span>
            <span style={booksStyles.bookTotalPrice}>
              ₹{book.price || '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;

