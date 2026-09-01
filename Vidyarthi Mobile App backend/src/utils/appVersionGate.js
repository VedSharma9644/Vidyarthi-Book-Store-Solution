const appVersionPolicyService = require('../services/appVersionPolicyService');
const { orderChannelFromRequest } = require('./orderChannel');

const APP_VERSION_UPDATE_MESSAGE =
    'Please update the Vidyarthi Kart app to the latest version from the Play Store or App Store to continue.';

/**
 * @param {import('express').Request} req
 * @returns {'android'|'ios'|null}
 */
function appPlatformFromRequest(req) {
    if (!req?.headers) {
        return null;
    }
    const raw =
        req.headers['x-app-platform'] ||
        req.headers['X-App-Platform'] ||
        req.body?.appPlatform;
    if (!raw) {
        return null;
    }
    const v = String(raw).trim().toLowerCase();
    if (v === 'android' || v === 'ios') {
        return v;
    }
    return null;
}

/**
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function appVersionFromRequest(req) {
    if (!req?.headers) {
        return null;
    }
    const raw =
        req.headers['x-app-version'] ||
        req.headers['X-App-Version'] ||
        req.body?.appVersion;
    if (raw == null || raw === '') {
        return null;
    }
    return String(raw).trim();
}

/**
 * Hard block for mobile apps below min version when force update is enabled.
 * Separate from student-name checkout gate.
 * @param {import('express').Request} req
 * @returns {Promise<{ blocked: boolean, status: number, body: object }|null>}
 */
async function mobileAppVersionUpgradeGate(req) {
    const channel = orderChannelFromRequest(req);
    if (channel === 'website') {
        return null;
    }

    const platform = appPlatformFromRequest(req);
    if (!platform) {
        return null;
    }

    const version = appVersionFromRequest(req);
    const evaluation = await appVersionPolicyService.evaluate(platform, version);

    if (!evaluation.forceUpdateRequired) {
        return null;
    }

    return {
        blocked: true,
        status: 400,
        body: {
            success: false,
            code: 'APP_VERSION_UPDATE_REQUIRED',
            message: evaluation.forceUpdateMessage || APP_VERSION_UPDATE_MESSAGE,
            data: {
                minVersion: evaluation.minVersion,
                latestVersion: evaluation.latestVersion,
                storeUrl: evaluation.storeUrl,
                platform: evaluation.platform,
            },
        },
    };
}

module.exports = {
    APP_VERSION_UPDATE_MESSAGE,
    appPlatformFromRequest,
    appVersionFromRequest,
    mobileAppVersionUpgradeGate,
};
