import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPPORT_PHONE_E164 = '+919848113298';
const SUPPORT_PHONE_DIGITS = '919848113298';
const SUPPORT_DISPLAY = '+91 98481 13298';

const ICON_BLUE = '#2563EB';
const ICON_FACE = '#93C5FD';
const ICON_MIC = '#1D4ED8';

async function openUrl(url) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported || Platform.OS === 'android') {
      await Linking.openURL(url);
      return true;
    }
  } catch (e) {
    console.warn('Failed to open URL:', url, e?.message || e);
  }
  return false;
}

/** Customer-support style: person + headset + mic (no icon packages). */
function SupportHeadsetIcon() {
  return (
    <View style={icon.root}>
      {/* Headset band */}
      <View style={icon.band} />
      {/* Ear cups */}
      <View style={[icon.ear, icon.earLeft]} />
      <View style={[icon.ear, icon.earRight]} />
      {/* Head */}
      <View style={icon.head} />
      {/* Shoulders / torso hint */}
      <View style={icon.shoulders} />
      {/* Mic boom + tip */}
      <View style={icon.micArm} />
      <View style={icon.micTip} />
    </View>
  );
}

/**
 * Floating contact button (bottom-left). Offers Call or WhatsApp.
 */
export default function ContactSupportFab({ visible = true }) {
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  const handlePress = () => {
    Alert.alert(
      'Contact us',
      SUPPORT_DISPLAY,
      [
        {
          text: 'Call',
          onPress: async () => {
            const ok = await openUrl(`tel:${SUPPORT_PHONE_E164}`);
            if (!ok) {
              Alert.alert('Unable to call', 'Please dial ' + SUPPORT_DISPLAY + ' manually.');
            }
          },
        },
        {
          text: 'WhatsApp',
          onPress: async () => {
            const ok = await openUrl(`https://wa.me/${SUPPORT_PHONE_DIGITS}`);
            if (!ok) {
              Alert.alert(
                'Unable to open WhatsApp',
                'Please message ' + SUPPORT_DISPLAY + ' on WhatsApp.'
              );
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: Math.max(insets.bottom, 8) + 72,
          left: 16 + Math.max(insets.left, 0),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Contact support by phone or WhatsApp"
      >
        <SupportHeadsetIcon />
      </TouchableOpacity>
    </View>
  );
}

const icon = StyleSheet.create({
  root: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  band: {
    position: 'absolute',
    top: 2,
    width: 26,
    height: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 3.5,
    borderBottomWidth: 0,
    borderColor: ICON_BLUE,
  },
  ear: {
    position: 'absolute',
    top: 12,
    width: 9,
    height: 12,
    borderRadius: 4,
    backgroundColor: ICON_BLUE,
  },
  earLeft: {
    left: 4,
  },
  earRight: {
    right: 4,
  },
  head: {
    position: 'absolute',
    top: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ICON_FACE,
    borderWidth: 1.5,
    borderColor: ICON_BLUE,
  },
  shoulders: {
    position: 'absolute',
    bottom: 2,
    width: 24,
    height: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: ICON_BLUE,
  },
  micArm: {
    position: 'absolute',
    right: 5,
    top: 20,
    width: 11,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: ICON_MIC,
    transform: [{ rotate: '28deg' }],
  },
  micTip: {
    position: 'absolute',
    right: 2,
    top: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ICON_MIC,
  },
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 999,
    elevation: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
