const { orderChannelFromRequest } = require('../utils/orderChannel');
const { mobileAppVersionUpgradeGate } = require('../utils/appVersionGate');

const EXEMPT_PATHS = new Set(['/health', '/api/app/version-policy', '/api/payment/webhook']);

/**
 * Block outdated mobile app versions when Firestore policy has forceUpdateEnabled.
 * Website (X-Order-Channel: website) and legacy apps without X-App-Platform are skipped.
 */
async function appVersionMiddleware(req, res, next) {
    try {
        const path = req.originalUrl?.split('?')[0] || req.path;
        if (EXEMPT_PATHS.has(path)) {
            return next();
        }

        if (orderChannelFromRequest(req) === 'website') {
            return next();
        }

        const gate = await mobileAppVersionUpgradeGate(req);
        if (gate?.blocked) {
            return res.status(gate.status).json(gate.body);
        }

        return next();
    } catch (error) {
        console.error('appVersionMiddleware:', error.message);
        return next();
    }
}

module.exports = appVersionMiddleware;
