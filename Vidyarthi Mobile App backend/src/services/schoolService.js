const { db } = require('../config/firebase');

class SchoolService {
    constructor() {
        this.schoolsRef = db.collection('schools');
    }

    /**
     * Search schools by code or name
     * @param {string} searchTerm - Search term (code or name)
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>} - Array of matching schools
     */
    async searchSchools(searchTerm = '', limit = 20) {
        try {
            let query = this.schoolsRef.where('isActive', '==', true);

            if (searchTerm && searchTerm.trim().length > 0) {
                const searchLower = searchTerm.toLowerCase().trim();
                
                // Get all active schools and filter in memory
                // Firestore doesn't support case-insensitive search or OR queries easily
                const snapshot = await query.get();
                
                const schools = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const school = {
                        id: doc.id,
                        ...data,
                    };
                    
                    // Check if code or name matches (case-insensitive)
                    const codeMatch = school.code?.toLowerCase().includes(searchLower);
                    const nameMatch = school.name?.toLowerCase().includes(searchLower);
                    const branchMatch = school.branchName?.toLowerCase().includes(searchLower);
                    
                    if (codeMatch || nameMatch || branchMatch) {
                        schools.push(school);
                    }
                });

                // Sort by relevance (exact code match first, then name match)
                schools.sort((a, b) => {
                    const aCodeExact = a.code?.toLowerCase() === searchLower;
                    const bCodeExact = b.code?.toLowerCase() === searchLower;
                    if (aCodeExact && !bCodeExact) return -1;
                    if (!aCodeExact && bCodeExact) return 1;
                    return 0;
                });

                return schools.slice(0, limit);
            } else {
                // Return all active schools if no search term
                const snapshot = await query.limit(limit).get();
                const schools = [];
                snapshot.forEach(doc => {
                    schools.push({
                        id: doc.id,
                        ...doc.data(),
                    });
                });
                return schools;
            }
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

