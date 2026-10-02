import React from 'react';

/**
 * Product / textbook title — wraps fully so names are never clipped
 * (matches mobile app ProductTitle behavior).
 */
export default function ProductTitle({ children, style, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      style={{
        margin: 0,
        lineHeight: 1.4,
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        whiteSpace: 'normal',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
