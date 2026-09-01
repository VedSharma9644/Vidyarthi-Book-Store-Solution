/**
 * Seed Firestore app_config/mobile for version policy.
 * Usage: node scripts/seed-app-version-policy.js
 * Optional env: APP_MIN_VERSION_ANDROID, APP_MIN_VERSION_IOS, APP_FORCE_UPDATE_ENABLED=true
 */
require('dotenv').config();
require('../src/config/firebase');
const appVersionPolicyService = require('../src/services/appVersionPolicyService');

async function main() {
    const forceEnabled = String(process.env.APP_FORCE_UPDATE_ENABLED || '').toLowerCase() === 'true';

    const policy = await appVersionPolicyService.savePolicy({
        android: {
            minVersion: process.env.APP_MIN_VERSION_ANDROID || '1.0.18',
            latestVersion: process.env.APP_LATEST_VERSION_ANDROID || '1.0.18',
            storeUrl:
                process.env.APP_ANDROID_STORE_URL ||
                'https://play.google.com/store/apps/details?id=com.creayaa.vidyarthikart',
        },
        ios: {
            minVersion: process.env.APP_MIN_VERSION_IOS || '1.0.18',
            latestVersion: process.env.APP_LATEST_VERSION_IOS || '1.0.18',
            storeUrl:
                process.env.APP_IOS_STORE_URL ||
                'https://apps.apple.com/app/vidyarthi-kart/id6756518319',
        },
        forceUpdateEnabled: forceEnabled,
        optionalUpdateEnabled: true,
    });

    console.log('Saved app_config/mobile:', JSON.stringify(policy, null, 2));
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
