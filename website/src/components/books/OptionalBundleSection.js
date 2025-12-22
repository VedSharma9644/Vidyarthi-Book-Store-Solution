import React, { useState } from 'react';
import { getResponsiveBooksStyles } from '../../css/booksStyles';
import { useIsMobile, useIsTablet } from '../../hooks/useMediaQuery';
import BookCard from './BookCard';

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
  const [isExpanded, setIsExpanded] = useState(isSelected);

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

      {/* Bundle Items Grid */}
      {isExpanded && (
        <div style={booksStyles.booksGrid}>
          {items.map((item) => (
            <BookCard
              key={item.id}
              book={item}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OptionalBundleSection;

