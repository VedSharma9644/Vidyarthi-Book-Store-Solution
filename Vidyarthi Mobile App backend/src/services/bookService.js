const { db } = require('../config/firebase');

class BookService {
    constructor() {
        this.booksRef = db.collection('books');
    }

    /**
     * Get all books with optional filtering and pagination
     * @param {Object} options - Query options
     * @param {number} options.offset - Pagination offset
     * @param {number} options.limit - Number of books to return
     * @param {string} options.category - Filter by category ID
     * @param {string} options.price - Price filter (e.g., "0-100", "100-500")
     * @param {string} options.sort - Sort order (e.g., "price_asc", "price_desc", "name_asc")
     * @returns {Promise<Array>} Array of books
     */
    async getAllBooks(options = {}) {
        try {
            const { offset = 0, limit = 20, category, price, sort } = options;
            
            // Start with base query - only active books
            // Use orderBy on createdAt first (required for pagination with offset)
            let query = this.booksRef
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc');

            // Apply category filter if provided
            if (category) {
                // Note: When using multiple where clauses with orderBy, Firestore requires composite indexes
                // For now, we'll filter client-side if category is provided to avoid index issues
                query = query.limit(parseInt(limit) * 3); // Get more to account for filtering
            } else {
                // Apply pagination only if no category filter
                query = query.offset(parseInt(offset)).limit(parseInt(limit));
            }

            const snapshot = await query.get();
            let books = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Apply category filter client-side if needed
                if (category && data.categoryId !== category) {
                    return; // Skip this book
                }

                // Apply price filter client-side if needed
                if (price) {
                    const [minPrice, maxPrice] = price.split('-').map(p => parseFloat(p));
                    const bookPrice = parseFloat(data.price || 0);
                    if (!isNaN(minPrice) && bookPrice < minPrice) {
                        return; // Skip this book
                    }
                    if (!isNaN(maxPrice) && bookPrice > maxPrice) {
                        return; // Skip this book
                    }
                }

                books.push({
                    id: doc.id,
                    ...data,
                });
            });

            // Apply sorting client-side if needed
            if (sort === 'price_asc') {
                books.sort((a, b) => (parseFloat(a.price || 0)) - (parseFloat(b.price || 0)));
            } else if (sort === 'price_desc') {
                books.sort((a, b) => (parseFloat(b.price || 0)) - (parseFloat(a.price || 0)));
            } else if (sort === 'name_asc') {
                books.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            }

            // Apply pagination if category filter was used
            if (category) {
                books = books.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
            }

            return books;
        } catch (error) {
            console.error('Error getting all books:', error);
            throw error;
        }
    }

    /**
     * Get book by ID
     * @param {string} bookId - Book document ID
     * @returns {Promise<Object|null>} Book object or null if not found
     */
    async getBookById(bookId) {
        try {
            const doc = await this.booksRef.doc(bookId).get();
            
            if (!doc.exists) {
                return null;
            }

            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            };
        } catch (error) {
            console.error('Error getting book by ID:', error);
            throw error;
        }
    }

    /**
     * Get general books (books not tied to a specific category/grade)
     * @param {Object} options - Query options
     * @param {number} options.offset - Pagination offset
     * @param {number} options.limit - Number of books to return
     * @returns {Promise<Array>} Array of general books
     */
    async getGeneralBooks(options = {}) {
        try {
            const { offset = 0, limit = 20 } = options;
            
            // Get all active books and filter client-side for books without categoryId
            // Firestore doesn't support querying for null/empty strings easily
            let query = this.booksRef
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc')
                .offset(parseInt(offset))
                .limit(parseInt(limit) * 2); // Get more to account for filtering

            const snapshot = await query.get();
            const books = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                // Filter for books without categoryId or with empty categoryId
                if (!data.categoryId || data.categoryId === '') {
                    books.push({
                        id: doc.id,
                        ...data,
                    });
                }
            });

            // Apply limit after filtering
            return books.slice(0, parseInt(limit));
        } catch (error) {
            console.error('Error getting general books:', error);
            throw error;
        }
    }
}

module.exports = new BookService();

