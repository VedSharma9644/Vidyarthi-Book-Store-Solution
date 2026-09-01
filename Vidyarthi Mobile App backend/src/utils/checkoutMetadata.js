const { normalizeOrderChannel } = require('./orderChannel');

/**
 * Razorpay order notes backup when Firestore checkout attempt is missing.
 * Keys/values are truncated to Razorpay limits in paymentService.createOrder.
 *
 * @param {{ userId?: string|null, orderChannel?: string|null, orderingStudent?: object|null, shippingAddress?: object|null }} params
 * @returns {Record<string, string>}
 */
function buildRazorpayCheckoutNotes({ userId, orderChannel, orderingStudent, shippingAddress }) {
    const notes = {};
    if (userId) {
        notes.userId = String(userId);
    }
    const channel = normalizeOrderChannel(orderChannel);
    if (channel) {
        notes.orderChannel = channel;
    }
    const studentName =
        (orderingStudent &&
            typeof orderingStudent.name === 'string' &&
            orderingStudent.name.trim()) ||
        (shippingAddress &&
            typeof shippingAddress.studentName === 'string' &&
            shippingAddress.studentName.trim()) ||
        '';
    if (studentName) {
        notes.studentName = String(studentName).trim();
    }
    return notes;
}

/**
 * @param {object|null|undefined} notes - Razorpay order notes
 * @returns {{ userId: string|null, orderChannel: 'website'|'android'|'ios'|null, orderingStudent: object|null }}
 */
function checkoutMetadataFromRazorpayNotes(notes) {
    if (!notes || typeof notes !== 'object') {
        return { userId: null, orderChannel: null, orderingStudent: null };
    }
    const userId = notes.userId != null && String(notes.userId).trim() ? String(notes.userId).trim() : null;
    const orderChannel = normalizeOrderChannel(notes.orderChannel);
    const studentRaw =
        notes.studentName != null && String(notes.studentName).trim()
            ? String(notes.studentName).trim()
            : null;
    const orderingStudent = studentRaw ? { id: null, name: studentRaw } : null;
    return { userId, orderChannel, orderingStudent };
}

/**
 * Merge checkout metadata from client, Firestore attempt, and Razorpay notes (last resort).
 * @param {object} sources
 * @param {object|null} [sources.attempt]
 * @param {'website'|'android'|'ios'|null} [sources.orderChannel]
 * @param {object|null} [sources.orderingStudent]
 * @param {object|null} [sources.razorpayNotes]
 * @returns {{ orderChannel: 'website'|'android'|'ios'|null, orderingStudent: object|null, userId: string|null }}
 */
function mergeCheckoutMetadata({ attempt, orderChannel, orderingStudent, razorpayNotes }) {
    const fromNotes = checkoutMetadataFromRazorpayNotes(razorpayNotes);
    const fromStudent =
        orderingStudent ||
        attempt?.orderingForStudent ||
        fromNotes.orderingStudent ||
        null;
    const fromChannel = orderChannel || attempt?.orderChannel || fromNotes.orderChannel || null;
    const userId =
        (attempt?.userId && String(attempt.userId)) || fromNotes.userId || null;
    return {
        orderChannel: fromChannel,
        orderingStudent: fromStudent,
        userId,
    };
}

module.exports = {
    buildRazorpayCheckoutNotes,
    checkoutMetadataFromRazorpayNotes,
    mergeCheckoutMetadata,
};
