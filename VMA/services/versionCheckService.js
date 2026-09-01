import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/apiConfig';
import { getAppPlatform, getAppVersion } from '../utils/appVersion';
import ApiService from './apiService';

const OPTIONAL_DISMISS_PREFIX = 'optional_update_dismissed_';

/**
 * @typedef {object} VersionCheckResult
 * @property {boolean} forceUpdateRequired
 * @property {boolean} optionalUpdateAvailable
 * @property {string|null} message
 * @property {string|null} storeUrl
 * @property {string|null} minVersion
 * @property {string|null} latestVersion
 */

/**
 * Fetch backend version policy and evaluate this install.
 * @returns {Promise<VersionCheckResult>}
 */
export async function checkAppVersionPolicy() {
    const platform = getAppPlatform();
    const version = getAppVersion();

    try {
        const result = await ApiService.getVersionPolicy(platform, version);
        if (!result?.success || !result?.data) {
            return emptyResult();
        }

        const data = result.data;
        return {
            forceUpdateRequired: data.forceUpdateRequired === true,
            optionalUpdateAvailable: data.optionalUpdateAvailable === true,
            message: data.forceUpdateRequired
                ? data.forceUpdateMessage
                : data.optionalUpdateMessage,
            storeUrl: data.storeUrl || null,
            minVersion: data.minVersion || null,
            latestVersion: data.latestVersion || null,
        };
    } catch (error) {
        console.warn('versionCheckService.checkAppVersionPolicy:', error?.message || error);
        return emptyResult();
    }
}

/**
 * Whether optional update prompt was dismissed for this latest version.
 * @param {string} latestVersion
 * @returns {Promise<boolean>}
 */
export async function wasOptionalUpdateDismissed(latestVersion) {
    if (!latestVersion) {
        return false;
    }
    try {
        const key = `${OPTIONAL_DISMISS_PREFIX}${latestVersion}`;
        const value = await AsyncStorage.getItem(key);
        return value === '1';
    } catch {
        return false;
    }
}

/**
 * @param {string} latestVersion
 */
export async function dismissOptionalUpdate(latestVersion) {
    if (!latestVersion) {
        return;
    }
    try {
        const key = `${OPTIONAL_DISMISS_PREFIX}${latestVersion}`;
        await AsyncStorage.setItem(key, '1');
    } catch (error) {
        console.warn('dismissOptionalUpdate:', error?.message || error);
    }
}

function emptyResult() {
    return {
        forceUpdateRequired: false,
        optionalUpdateAvailable: false,
        message: null,
        storeUrl: null,
        minVersion: null,
        latestVersion: null,
    };
}

export { OPTIONAL_DISMISS_PREFIX };
