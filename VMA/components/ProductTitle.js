import React from 'react';
import { Text } from 'react-native';

/**
 * Product / textbook title — wraps to multiple lines (no ellipsis truncation).
 * Use everywhere book/product names are shown (cart, grade list, orders, etc.).
 */
export default function ProductTitle({ children, style, ...rest }) {
  return (
    <Text style={[{ flexShrink: 1 }, style]} {...rest}>
      {children}
    </Text>
  );
}
