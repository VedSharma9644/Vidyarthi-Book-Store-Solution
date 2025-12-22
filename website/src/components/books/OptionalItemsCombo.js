import React from 'react';
import { colors } from '../../css/styles';
import BookItem from './BookItem';

const OptionalItemsCombo = ({ optionalItemsByType, selectedBundles, onToggleBundle }) => {
  return (
    <>
      <h2 style={{
        color: colors.textPrimary,
        fontSize: '22px',
        fontWeight: 'bold',
        padding: '20px 16px 12px',
        margin: 0,
      }}>
        Optional Items Combo
      </h2>

      {Object.values(optionalItemsByType).map((group) => (
        <div key={group.type}>
          {/* Category Toggle */}
          <button
            onClick={() => onToggleBundle(group.type)}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '0 16px',
              marginBottom: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '4px',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: selectedBundles[group.type] ? colors.primary : '#ccc',
                backgroundColor: selectedBundles[group.type] ? colors.primary : 'transparent',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '10px',
              }}
            >
              {selectedBundles[group.type] && (
                <span style={{ color: colors.white, fontWeight: 'bold' }}>✓</span>
              )}
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: colors.textPrimary,
              margin: 0,
            }}>
              {group.title}
            </h3>
          </button>

          {/* Items in this category */}
          {selectedBundles[group.type] && group.items.map((item) => (
            <BookItem key={item.id} book={item} />
          ))}
        </div>
      ))}
    </>
  );
};

export default OptionalItemsCombo;

