import React, { useState } from 'react';
import { getResponsiveBooksStyles } from '../../css/booksStyles';
import { useIsMobile, useIsTablet } from '../../hooks/useMediaQuery';
import BookCard from './BookCard';
import BookTable from './BookTable';

const OptionalBundleSection = ({ 
  bundleType, 
  bundleTitle, 
  items, 
  isSelected, 
  onToggle
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const booksStyles = getResponsiveBooksStyles(isMobile, isTablet);
  const [isExpanded, setIsExpanded] = useState(true); // Open by default so user can see contents; they can collapse if they want

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Bundle Header */}
      <div
        style={booksStyles.optionalBundleHeader}
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!isExpanded) {
            onToggle();
          }
        }}
      >
        <div
          style={{
            ...booksStyles.bundleCheckbox,
            ...(isSelected && booksStyles.bundleCheckboxChecked),
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isSelected && (
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={booksStyles.bundleTitle}>{bundleTitle}</h3>
          <p style={booksStyles.bundleDescription}>
            {items.length} item{items.length !== 1 ? 's' : ''} in this bundle
          </p>
        </div>
        <button
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Bundle Items - Table on desktop, Cards on mobile */}
      {isExpanded && (
        <>
          {isMobile ? (
            <div style={booksStyles.booksGrid}>
              {items.map((item) => (
                <BookCard
                  key={item.id}
                  book={item}
                />
              ))}
            </div>
          ) : (
            <BookTable books={items} />
          )}
        </>
      )}
    </div>
  );
};

export default OptionalBundleSection;

