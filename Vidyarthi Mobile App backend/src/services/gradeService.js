const { db } = require('../config/firebase');

class GradeService {
    constructor() {
        this.gradesRef = db.collection('grades');
    }

    /**
     * Get all grades, optionally filtered by schoolId
     * @param {string} schoolId - Optional school ID to filter grades
     * @returns {Promise<Array>} - Array of grades
     */
    async getAllGrades(schoolId = null) {
        try {
            let query = this.gradesRef.where('isActive', '==', true);

            // Filter by schoolId if provided
            if (schoolId) {
                query = query.where('schoolId', '==', schoolId);
            }

            const snapshot = await query.get();
            const grades = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                grades.push({
                    id: doc.id,
                    ...data,
                });
            });

            // Sort by displayOrder, then by name
            grades.sort((a, b) => {
                const aOrder = a.displayOrder || 0;
                const bOrder = b.displayOrder || 0;
                if (aOrder !== bOrder) {
                    return aOrder - bOrder;
                }
                return (a.name || '').localeCompare(b.name || '');
            });

            return grades;
        } catch (error) {
            console.error('Error getting all grades:', error);
            throw error;
        }
    }

    /**
     * Get grade by ID
     * @param {string} id - Grade ID
     * @returns {Promise<object|null>} - Grade object or null
     */
    async getGradeById(id) {
        try {
            if (!id) {
                return null;
            }

            const doc = await this.gradesRef.doc(id).get();
            
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
            console.error('Error getting grade by ID:', error);
            throw error;
        }
    }
}

module.exports = new GradeService();

