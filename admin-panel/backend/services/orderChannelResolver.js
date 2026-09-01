/**
 * Admin display: website orders are tagged at checkout; all other orders are treated as mobile app.
 * (Mobile app does not send a channel header — absence of `website` implies mobile.)
 */

/**
 * @param {object|null|undefined} data - Firestore order document
 * @returns {{ channel: 'website'|'mobile', label: string }}
 */
function resolveOrderChannel(data) {
  const stored =
    data && typeof data === 'object' && data.orderChannel
      ? String(data.orderChannel).trim().toLowerCase()
      : '';
  if (stored === 'website') {
    return { channel: 'website', label: 'Website' };
  }
  return { channel: 'mobile', label: 'Mobile app' };
}

module.exports = {
  resolveOrderChannel,
};
