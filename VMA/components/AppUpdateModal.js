import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { colors, spacing } from '../css/styles';

/**
 * Startup update popup — force (required) or optional.
 * @param {object} props
 * @param {boolean} props.visible
 * @param {'force'|'optional'} props.mode
 * @param {string|null} props.message
 * @param {string|null} props.storeUrl
 * @param {string|null} props.minVersion
 * @param {string|null} props.latestVersion
 * @param {() => void} [props.onDismiss] - optional updates only
 */
export default function AppUpdateModal({
  visible,
  mode = 'optional',
  message,
  storeUrl,
  minVersion,
  latestVersion,
  onDismiss,
}) {
  const isForce = mode === 'force';

  const title = isForce ? 'Update required' : 'Update available';
  const defaultMessage = isForce
    ? 'Please update the Vidyarthi Kart app to the latest version from the Play Store or App Store to continue.'
    : 'A newer version of Vidyarthi Kart is available. Update now for the best experience.';

  const versionHint =
    minVersion && latestVersion && minVersion !== latestVersion
      ? `Required: ${minVersion} or newer (latest: ${latestVersion})`
      : latestVersion && !isForce
        ? `Latest version: ${latestVersion}`
        : minVersion && isForce
          ? `Required: ${minVersion} or newer`
          : null;

  const storeLabel = Platform.OS === 'ios' ? 'App Store' : 'Play Store';

  const handleUpdate = async () => {
    if (!storeUrl) {
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(storeUrl);
      if (canOpen) {
        await Linking.openURL(storeUrl);
      }
    } catch (error) {
      console.warn('AppUpdateModal open store:', error?.message || error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isForce ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message || defaultMessage}</Text>
          {versionHint ? <Text style={styles.hint}>{versionHint}</Text> : null}
          {isForce ? (
            <Text style={styles.subhint}>
              You need to install the latest version from the {storeLabel} before you can use the app.
            </Text>
          ) : null}

          <View style={styles.actions}>
            {!isForce && onDismiss ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonSecondaryText}>Later</Text>
              </TouchableOpacity>
            ) : null}
            {storeUrl ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, isForce && styles.buttonFull]}
                onPress={handleUpdate}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonPrimaryText}>Update now</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.gray700,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subhint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  buttonSecondaryText: {
    color: colors.gray700,
    fontSize: 15,
    fontWeight: '600',
  },
});
