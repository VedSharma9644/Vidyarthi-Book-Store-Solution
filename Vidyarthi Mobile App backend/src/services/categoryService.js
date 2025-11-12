const { db } = require('../config/firebase');

class CategoryService {
    constructor() {
        this.categoriesRef = db.collection('categories');
    }

    /**
     * Get all categories, optionally filtered by gradeId
     * @param {string} gradeId - Optional grade ID to filter categories
     * @returns {Promise<Array>} - Array of categories
     */
    async getAllCategories(gradeId = null) {
        try {
            let query = this.categoriesRef.where('isActive', '==', true);

            // Filter by gradeId if provided
            if (gradeId) {
                query = query.where('gradeId', '==', gradeId);
            }

            const snapshot = await query.get();
            const categories = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                categories.push({
                    id: doc.id,
                    ...data,
                });
            });

            return categories;
        } catch (error) {
            console.error('Error getting all categories:', error);
            throw error;
        }
    }

    /**
     * Get category by ID
     * @param {string} id - Category ID
     * @returns {Promise<object|null>} - Category object or null
     */
    async getCategoryById(id) {
        try {
            if (!id) {
                return null;
            }

            const doc = await this.categoriesRef.doc(id).get();
            
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
            console.error('Error getting category by ID:', error);
            throw error;
        }
    }
}

module.exports = new CategoryService();

