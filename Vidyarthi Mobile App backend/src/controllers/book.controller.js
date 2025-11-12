const bookService = require('../services/bookService');

/**
 * Get all books with optional filtering and pagination
 * @route GET /api/books/get-all-books
 */
const getAllBooks = async (req, res) => {
    try {
        const { offset, limit, category, price, sort } = req.query;
        
        const options = {
            offset: offset ? parseInt(offset) : 0,
            limit: limit ? parseInt(limit) : 20,
            category: category || null,
            price: price || null,
            sort: sort || null,
        };

        const books = await bookService.getAllBooks(options);

        res.json({
            success: true,
            data: books,
            count: books.length,
            offset: options.offset,
            limit: options.limit,
        });
    } catch (error) {
        console.error('Error in getAllBooks controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch books',
            error: error.message,
        });
    }
};

/**
 * Get general books (not tied to specific category/grade)
 * @route GET /api/books/get-all-generalbooks
 */
const getGeneralBooks = async (req, res) => {
    try {
        const { offset, limit } = req.query;
        
        const options = {
            offset: offset ? parseInt(offset) : 0,
            limit: limit ? parseInt(limit) : 20,
        };

        const books = await bookService.getGeneralBooks(options);

        res.json({
            success: true,
            data: books,
            count: books.length,
            offset: options.offset,
            limit: options.limit,
        });
    } catch (error) {
        console.error('Error in getGeneralBooks controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch general books',
            error: error.message,
        });
    }
};

/**
 * Get book by ID
 * @route GET /api/books/:id
 */
const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const book = await bookService.getBookById(id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found',
            });
        }

        res.json({
            success: true,
            data: book,
        });
    } catch (error) {
        console.error('Error in getBookById controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch book',
            error: error.message,
        });
    }
};

module.exports = {
    getAllBooks,
    getGeneralBooks,
    getBookById,
};

