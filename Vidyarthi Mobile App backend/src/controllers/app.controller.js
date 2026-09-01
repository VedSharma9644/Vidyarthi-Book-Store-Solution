const appVersionPolicyService = require('../services/appVersionPolicyService');

/**
 * Public version policy for mobile app launch check.
 * @route GET /api/app/version-policy
 * @query platform - android | ios
 * @query version - installed app version (e.g. 1.0.18)
 */
const getVersionPolicy = async (req, res) => {
    try {
        const platformRaw = String(req.query.platform || '').trim().toLowerCase();
        const platform = platformRaw === 'ios' ? 'ios' : 'android';
        const currentVersion = req.query.version ? String(req.query.version).trim() : null;

        const policy = await appVersionPolicyService.getPolicy();
        const evaluation = await appVersionPolicyService.evaluate(platform, currentVersion, policy);

        return res.json({
            success: true,
            data: evaluation,
        });
    } catch (error) {
        console.error('getVersionPolicy:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to load app version policy',
        });
    }
};

module.exports = {
    getVersionPolicy,
};
