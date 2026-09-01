const { db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');
const { isVersionBelow, compareVersions } = require('../utils/semverCompare');

const COLLECTION = 'app_config';
const DOC_ID = 'mobile';
const CACHE_TTL_MS = 60_000;

const DEFAULT_ANDROID_STORE =
    'https://play.google.com/store/apps/details?id=com.creayaa.vidyarthikart';
const DEFAULT_IOS_STORE = 'https://apps.apple.com/app/vidyarthi-kart/id6756518319';

const DEFAULT_POLICY = {
    android: {
        minVersion: '0.0.0',
        latestVersion: '1.0.18',
        storeUrl: DEFAULT_ANDROID_STORE,
    },
    ios: {
        minVersion: '0.0.0',
        latestVersion: '1.0.18',
        storeUrl: DEFAULT_IOS_STORE,
    },
    forceUpdateEnabled: false,
    optionalUpdateEnabled: true,
    forceUpdateMessage:
        'Please update the Vidyarthi Kart app to the latest version from the Play Store or App Store to continue.',
    optionalUpdateMessage: 'A newer version of Vidyarthi Kart is available. Update now for the best experience.',
};

class AppVersionPolicyService {
    constructor() {
        this.cachedPolicy = null;
        this.cacheExpiresAt = 0;
    }

    /**
     * @returns {Promise<object>}
     */
    async getPolicy() {
        const now = Date.now();
        if (this.cachedPolicy && now < this.cacheExpiresAt) {
            return this.cachedPolicy;
        }

        try {
            const snap = await db.collection(COLLECTION).doc(DOC_ID).get();
            if (snap.exists) {
                this.cachedPolicy = this.normalizePolicy(snap.data());
            } else {
                this.cachedPolicy = { ...DEFAULT_POLICY };
            }
        } catch (error) {
            console.error('appVersionPolicyService.getPolicy:', error.message);
            this.cachedPolicy = { ...DEFAULT_POLICY };
        }

        this.cacheExpiresAt = now + CACHE_TTL_MS;
        return this.cachedPolicy;
    }

    /**
     * @param {object|null|undefined} raw
     * @returns {object}
     */
    normalizePolicy(raw) {
        const android = raw?.android || {};
        const ios = raw?.ios || {};
        return {
            android: {
                minVersion: String(android.minVersion || DEFAULT_POLICY.android.minVersion),
                latestVersion: String(android.latestVersion || DEFAULT_POLICY.android.latestVersion),
                storeUrl: String(android.storeUrl || DEFAULT_POLICY.android.storeUrl),
            },
            ios: {
                minVersion: String(ios.minVersion || DEFAULT_POLICY.ios.minVersion),
                latestVersion: String(ios.latestVersion || DEFAULT_POLICY.ios.latestVersion),
                storeUrl: String(ios.storeUrl || DEFAULT_POLICY.ios.storeUrl),
            },
            forceUpdateEnabled: raw?.forceUpdateEnabled === true,
            optionalUpdateEnabled: raw?.optionalUpdateEnabled !== false,
            forceUpdateMessage: String(raw?.forceUpdateMessage || DEFAULT_POLICY.forceUpdateMessage),
            optionalUpdateMessage: String(
                raw?.optionalUpdateMessage || DEFAULT_POLICY.optionalUpdateMessage
            ),
        };
    }

    /**
     * @param {'android'|'ios'} platform
     * @param {string|undefined|null} currentVersion
     * @param {object} [policy]
     * @returns {Promise<object>}
     */
    async evaluate(platform, currentVersion, policy = null) {
        const resolvedPolicy = policy || (await this.getPolicy());
        const platformKey = platform === 'ios' ? 'ios' : 'android';
        const platformPolicy = resolvedPolicy[platformKey];

        const minVersion = platformPolicy.minVersion;
        const latestVersion = platformPolicy.latestVersion;
        const storeUrl = platformPolicy.storeUrl;

        const belowMin =
            resolvedPolicy.forceUpdateEnabled &&
            isVersionBelow(currentVersion, minVersion);

        const optionalAvailable =
            resolvedPolicy.optionalUpdateEnabled &&
            !belowMin &&
            currentVersion &&
            compareVersions(currentVersion, latestVersion) < 0;

        return {
            platform: platformKey,
            currentVersion: currentVersion || null,
            minVersion,
            latestVersion,
            storeUrl,
            forceUpdateRequired: belowMin,
            optionalUpdateAvailable: optionalAvailable,
            forceUpdateMessage: resolvedPolicy.forceUpdateMessage,
            optionalUpdateMessage: resolvedPolicy.optionalUpdateMessage,
        };
    }

    /**
     * Upsert policy document (admin / seed scripts).
     * @param {object} data
     */
    async savePolicy(data) {
        const normalized = this.normalizePolicy(data);
        await db
            .collection(COLLECTION)
            .doc(DOC_ID)
            .set(
                {
                    ...normalized,
                    updatedAt: Timestamp.now(),
                },
                { merge: true }
            );
        this.cachedPolicy = normalized;
        this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
        return normalized;
    }

    clearCache() {
        this.cachedPolicy = null;
        this.cacheExpiresAt = 0;
    }
}

module.exports = new AppVersionPolicyService();
