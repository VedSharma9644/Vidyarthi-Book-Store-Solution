import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../css/styles';

/**
 * Consistent blue top header with a centered page title.
 * Title is absolutely centered so side actions never hide it.
 */
export default function ScreenHeader({
  title,
  onBack,
  right = null,
  backLabel = '←',
}) {
  const displayTitle = title != null && String(title).trim() ? String(title).trim() : '';

  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backText}>{backLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}
      </View>

      <View style={styles.titleWrap} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {displayTitle}
        </Text>
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {right || <View style={styles.sidePlaceholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  side: {
    minWidth: 48,
    maxWidth: 120,
    zIndex: 2,
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  sidePlaceholder: {
    width: 40,
    height: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  titleWrap: {
    position: 'absolute',
    left: 56,
    right: 56,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    width: '100%',
  },
});
