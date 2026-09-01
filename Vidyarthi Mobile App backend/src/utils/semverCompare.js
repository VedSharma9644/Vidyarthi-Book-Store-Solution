/**
 * Compare dotted version strings (e.g. 1.0.18). Missing segments treated as 0.
 * @param {string} a
 * @param {string} b
 * @returns {-1|0|1} negative if a < b, 0 if equal, positive if a > b
 */
function compareVersions(a, b) {
    const pa = parseVersionParts(a);
    const pb = parseVersionParts(b);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i += 1) {
        const av = pa[i] ?? 0;
        const bv = pb[i] ?? 0;
        if (av > bv) return 1;
        if (av < bv) return -1;
    }
    return 0;
}

/**
 * @param {string|undefined|null} version
 * @returns {number[]}
 */
function parseVersionParts(version) {
    if (version == null || version === '') {
        return [0];
    }
    return String(version)
        .trim()
        .split('.')
        .map((part) => {
            const n = parseInt(part, 10);
            return Number.isFinite(n) ? n : 0;
        });
}

/**
 * @param {string|undefined|null} current
 * @param {string|undefined|null} minimum
 * @returns {boolean}
 */
function isVersionBelow(current, minimum) {
    if (!minimum) {
        return false;
    }
    if (!current) {
        return true;
    }
    return compareVersions(current, minimum) < 0;
}

module.exports = {
    compareVersions,
    parseVersionParts,
    isVersionBelow,
};
