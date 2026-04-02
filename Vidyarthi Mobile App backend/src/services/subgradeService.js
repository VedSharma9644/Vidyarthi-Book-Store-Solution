const { db } = require('../config/firebase');

class SubgradeService {
    constructor() {
        this.subgradesRef = db.collection('subgrades');
    }

    /**
     * Get all subgrades, optionally filtered by gradeId
     * @param {string} gradeId - Optional grade ID to filter subgrades
     * @returns {Promise<Array>} - Array of subgrades
     */
    async getSubgradesByGradeId(gradeId = null) {
        try {
            let query = this.subgradesRef.where('isActive', '==', true);

            if (gradeId) {
                query = query.where('gradeId', '==', gradeId);
            }

            const snapshot = await query.get();
            const subgrades = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                subgrades.push({
                    id: doc.id,
                    ...data,
                });
            });

            subgrades.sort((a, b) => {
                const aOrder = a.displayOrder || 0;
                const bOrder = b.displayOrder || 0;
                if (aOrder !== bOrder) {
                    return aOrder - bOrder;
                }
                return (a.name || '').localeCompare(b.name || '');
            });

            return subgrades;
        } catch (error) {
            console.error('Error getting subgrades by gradeId:', error);
            throw error;
        }
    }

    /**
     * Get subgrades for multiple grade IDs in fewer round-trips.
     * Uses Firestore 'in' queries (chunked to 10 due to Firestore limits).
     * @param {string[]} gradeIds - Grade IDs
     * @returns {Promise<Array>} - Array of subgrades
     */
    async getSubgradesByGradeIds(gradeIds = []) {
        try {
            const ids = Array.isArray(gradeIds) ? gradeIds.filter(Boolean) : [];
            if (ids.length === 0) return [];

            const chunks = [];
            for (let i = 0; i < ids.length; i += 10) {
                chunks.push(ids.slice(i, i + 10));
            }

            const results = [];
            // Run chunk queries sequentially to reduce Firestore pressure.
            for (const chunk of chunks) {
                const snapshot = await this.subgradesRef
                    .where('isActive', '==', true)
                    .where('gradeId', 'in', chunk)
                    .get();

                snapshot.forEach((doc) => {
                    results.push({
                        id: doc.id,
                        ...doc.data(),
                    });
                });
            }

            results.sort((a, b) => {
                const aOrder = a.displayOrder || 0;
                const bOrder = b.displayOrder || 0;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return (a.name || '').localeCompare(b.name || '');
            });

            return results;
        } catch (error) {
            console.error('Error getting subgrades by gradeIds:', error);
            throw error;
        }
    }

    /**
     * Get subgrade by ID
     * @param {string} id - Subgrade ID
     * @returns {Promise<object|null>} - Subgrade object or null
     */
    async getSubgradeById(id) {
        try {
            if (!id) {
                return null;
            }

            const doc = await this.subgradesRef.doc(id).get();

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
            console.error('Error getting subgrade by ID:', error);
            throw error;
        }
    }
}

module.exports = new SubgradeService();
