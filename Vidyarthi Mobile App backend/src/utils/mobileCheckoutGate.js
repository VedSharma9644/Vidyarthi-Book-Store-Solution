const { orderChannelFromRequest } = require('./orderChannel');

const APP_UPDATE_MESSAGE =
    'Please update the Vidyarthi Kart app to the latest version from the Play Store or App Store to continue checkout.';

/**
 * @param {object|null|undefined} orderingStudent
 * @param {object|null|undefined} shippingAddress
 * @returns {boolean}
 */
function hasCheckoutStudentName(orderingStudent, shippingAddress) {
    const fromStudent =
        orderingStudent &&
        typeof orderingStudent.name === 'string' &&
        orderingStudent.name.trim();
    if (fromStudent) {
        return true;
    }
    const fromShip =
        shippingAddress &&
        typeof shippingAddress.studentName === 'string' &&
        shippingAddress.studentName.trim();
    return Boolean(fromShip);
}

/**
 * Non-website clients must send a student name (new app). Missing name ⇒ old app ⇒ upgrade prompt.
 * @param {import('express').Request} req
 * @param {{ orderingStudent?: object|null, shippingAddress?: object|null }} payload
 * @returns {{ blocked: boolean, status: number, body: object }|null} null when allowed
 */
function mobileStudentNameUpgradeGate(req, payload = {}) {
    const channel = orderChannelFromRequest(req);
    if (channel === 'website') {
        return null;
    }

    const { orderingStudent = null, shippingAddress = null } = payload;
    if (hasCheckoutStudentName(orderingStudent, shippingAddress)) {
        return null;
    }

    return {
        blocked: true,
        status: 400,
        body: {
            success: false,
            code: 'APP_UPDATE_REQUIRED',
            message: APP_UPDATE_MESSAGE,
        },
    };
}

module.exports = {
    APP_UPDATE_MESSAGE,
    hasCheckoutStudentName,
    mobileStudentNameUpgradeGate,
};
