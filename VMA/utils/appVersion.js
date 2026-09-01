import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Installed app version from Expo config (app.json / native build).
 * @returns {string}
 */
export function getAppVersion() {
    const fromExpo = Constants.expoConfig?.version;
    if (fromExpo) {
        return String(fromExpo);
    }
    const fromManifest = Constants.manifest?.version;
    if (fromManifest) {
        return String(fromManifest);
    }
    return '0.0.0';
}

/**
 * @returns {'android'|'ios'}
 */
export function getAppPlatform() {
    return Platform.OS === 'ios' ? 'ios' : 'android';
}
