/**
 * Where the customer placed the order.
 * Only the website sends `X-Order-Channel: website` today; orders without that field are
 * shown as "Mobile app" in admin. Optional values android | ios are accepted if sent later.
 */

const VALID_CHANNELS = new Set(['website', 'android', 'ios']);

/**
 * @param {string|undefined|null} value - Header/body value
 * @returns {'website'|'android'|'ios'|null}
 */
function normalizeOrderChannel(value) {
    if (value == null || value === '') {
        return null;
    }
    const v = String(value).trim().toLowerCase();
    if (v === 'web') {
        return 'website';
    }
    if (VALID_CHANNELS.has(v)) {
        return v;
    }
    return null;
}

/**
 * Read channel from Express request (header preferred, then body).
 * @param {import('express').Request} req
 * @returns {'website'|'android'|'ios'|null}
 */
function orderChannelFromRequest(req) {
    if (!req) {
        return null;
    }
    const header =
        req.headers['x-order-channel'] ||
        req.headers['X-Order-Channel'] ||
        req.headers['x-order-channel'.toLowerCase()];
    return normalizeOrderChannel(header || req.body?.orderChannel);
}

/**
 * @param {'website'|'android'|'ios'|null|undefined} channel
 * @returns {string}
 */
function orderChannelLabel(channel) {
    switch (channel) {
        case 'website':
            return 'Website';
        case 'android':
            return 'Mobile app (Android)';
        case 'ios':
            return 'Mobile app (iOS)';
        default:
            return 'Unknown';
    }
}

module.exports = {
    normalizeOrderChannel,
    orderChannelFromRequest,
    orderChannelLabel,
    VALID_CHANNELS,
};
