import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';

export const POLICY_NOTICE_TEXT =
  'Missing, Replacement, or Return Requests are allowed within 7 business days of delivery.';

const GAP = '     •     ';

/**
 * Compact horizontal scrolling notice. Fixed height so layouts stay stable.
 */
export default function ScrollingNoticeBanner({ text = POLICY_NOTICE_TEXT, style }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    if (!segmentWidth) return;

    if (animRef.current) {
      animRef.current.stop();
    }

    translateX.setValue(0);
    const duration = Math.max(16000, Math.round(segmentWidth * 28));

    animRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: -segmentWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animRef.current.start();

    return () => {
      if (animRef.current) {
        animRef.current.stop();
      }
    };
  }, [segmentWidth, translateX]);

  const segment = `${text}${GAP}`;

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      {/*
        Measure full string in a very wide off-screen row so Yoga does not
        clamp text to the banner/screen width (which caused "within…" cutoff).
      */}
      <View style={styles.measureHost} pointerEvents="none">
        <Text
          style={styles.text}
          onLayout={(e) => {
            const w = Math.ceil(e.nativeEvent.layout.width);
            if (w > 0 && Math.abs(w - segmentWidth) > 1) {
              setSegmentWidth(w);
            }
          }}
        >
          {segment}
        </Text>
      </View>

      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.track,
            {
              width: segmentWidth * 2,
              transform: [{ translateX }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.text, { width: segmentWidth }]} numberOfLines={1}>
            {segment}
          </Text>
          <Text style={[styles.text, { width: segmentWidth }]} numberOfLines={1}>
            {segment}
          </Text>
        </Animated.View>
      ) : (
        <Text style={[styles.text, styles.placeholder]} numberOfLines={1}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 34,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F59E0B',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  measureHost: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
    width: 4000,
    flexDirection: 'row',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  placeholder: {
    paddingHorizontal: 12,
  },
});
