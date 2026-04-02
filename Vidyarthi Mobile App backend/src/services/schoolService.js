const { db } = require('../config/firebase');

class SchoolService {
    constructor() {
        this.schoolsRef = db.collection('schools');
    }

    normalizeUpper(value) {
        if (value == null) return '';
        return String(value).trim().toUpperCase();
    }

    normalizeLower(value) {
        if (value == null) return '';
        return String(value).trim().toLowerCase();
    }

    looksLikeCodeSearch(value) {
        const s = String(value || '').trim();
        if (!s) return false;
        // Heuristic: school codes often include digits/dashes or are short.
        return /[0-9-]/.test(s) || s.length <= 6;
    }

    /**
     * Search schools by code or name
     * @param {string} searchTerm - Search term (code or name)
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>} - Array of matching schools
     */
    async searchSchools(searchTerm = '', limit = 20) {
        try {
            const baseQuery = this.schoolsRef.where('isActive', '==', true);

            const trimmed = String(searchTerm || '').trim();
            if (!trimmed) {
                const snapshot = await baseQuery.limit(limit).get();
                return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            }

            const searchUpper = this.normalizeUpper(trimmed);
            const searchLower = this.normalizeLower(trimmed);

            const makePrefixEnd = (prefix) => `${prefix}\uf8ff`;

            const queryByCodePrefix = async () => {
                const snap = await baseQuery
                    .orderBy('codeUpper')
                    .startAt(searchUpper)
                    .endAt(makePrefixEnd(searchUpper))
                    .limit(limit)
                    .get();
                return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            };

            const queryByNamePrefix = async () => {
                const snap = await baseQuery
                    .orderBy('nameLower')
                    .startAt(searchLower)
                    .endAt(makePrefixEnd(searchLower))
                    .limit(limit)
                    .get();
                return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            };

            // Prefer the more likely query first, but merge both for better UX.
            const preferCode = this.looksLikeCodeSearch(trimmed);
            const [primary, secondary] = preferCode
                ? [queryByCodePrefix, queryByNamePrefix]
                : [queryByNamePrefix, queryByCodePrefix];

            let schools = [];
            try {
                schools = await primary();
            } catch (e) {
                // If the new field isn't backfilled for some docs or index isn't ready, continue to fallback logic.
                console.warn('Primary school prefix query failed, will fallback:', e?.message || e);
            }

            // If we have room, try the secondary query and merge (dedupe by id).
            if (schools.length < limit) {
                try {
                    const secondarySchools = await secondary();
                    const seen = new Set(schools.map((s) => s.id));
                    for (const s of secondarySchools) {
                        if (!seen.has(s.id)) {
                            schools.push(s);
                            seen.add(s.id);
                            if (schools.length >= limit) break;
                        }
                    }
                } catch (e) {
                    console.warn('Secondary school prefix query failed:', e?.message || e);
                }
            }

            // Safe fallback: old scan-based search (slow) if indexed queries return nothing.
            if (schools.length === 0) {
                const snapshot = await baseQuery.get();
                const matched = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const school = { id: doc.id, ...data };
                    const codeMatch = this.normalizeLower(school.code).includes(searchLower);
                    const nameMatch = this.normalizeLower(school.name).includes(searchLower);
                    const branchMatch = this.normalizeLower(school.branchName).includes(searchLower);
                    if (codeMatch || nameMatch || branchMatch) {
                        matched.push(school);
                    }
                });
                matched.sort((a, b) => {
                    const aCodeExact = this.normalizeLower(a.code) === searchLower;
                    const bCodeExact = this.normalizeLower(b.code) === searchLower;
                    if (aCodeExact && !bCodeExact) return -1;
                    if (!aCodeExact && bCodeExact) return 1;
                    return 0;
                });
                return matched.slice(0, limit);
            }

            return schools.slice(0, limit);
        } catch (error) {
            console.error('Error searching schools:', error);
            throw error;
        }
    }

    /**
     * Get school by code
     * @param {string} code - School code
     * @returns {Promise<object|null>} - School object or null
     */
    async getSchoolByCode(code) {
        try {
            if (!code || !code.trim()) {
                return null;
            }

            const snapshot = await this.schoolsRef
                .where('code', '==', code.trim().toUpperCase())
                .where('isActive', '==', true)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
            };
        } catch (error) {
            console.error('Error getting school by code:', error);
            throw error;
        }
    }

    /**
     * Get school by ID
     * @param {string} id - School ID
     * @returns {Promise<object|null>} - School object or null
     */
    async getSchoolById(id) {
        try {
            if (!id) {
                return null;
            }

            const doc = await this.schoolsRef.doc(id).get();
            
            if (!doc.exists) {
                return null;
            }

            const data = doc.data();
            if (!data.isActive) {
                return null;
            }

            return {
                id: doc.id,
                ...data,
            };
        } catch (error) {
            console.error('Error getting school by ID:', error);
            throw error;
        }
    }

    /**
     * Validate school code
     * @param {string} code - School code to validate
     * @returns {Promise<object|null>} - School object if valid, null otherwise
     */
    async validateSchoolCode(code) {
        try {
            return await this.getSchoolByCode(code);
        } catch (error) {
            console.error('Error validating school code:', error);
            throw error;
        }
    }
}

module.exports = new SchoolService();

