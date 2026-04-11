const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');

/**
 * @route   GET /api/books/get-all-books
 * @desc    Get all books with optional filtering and pagination
 * @access  Public
 * @query   { offset?: number, limit?: number, category?: string, price?: string, sort?: string }
 */
router.get('/get-all-books', bookController.getAllBooks);

/**
 * @route   GET /api/books/get-all-generalbooks
 * @desc    Get general books (not tied to specific category/grade)
 * @access  Public
 * @query   { offset?: number, limit?: number }
 */
router.get('/get-all-generalbooks', bookController.getGeneralBooks);

/**
 * @route   GET /api/books/school-book-presence
 * @desc    Grade/subgrade IDs that have active books for a school (minimal read)
 * @query   schoolId
 */
router.get('/school-book-presence', bookController.getSchoolBookPresence);

/**
 * @route   POST /api/books/grade-books
 * @desc    Active books for a school grade/section (replaces full-catalog client filter)
 * @access  Public
 * @body    { schoolId, gradeId, subgradeId?: string, categoryIds?: string[] }
 */
router.post('/grade-books', bookController.getBooksForGradePage);

/**
 * @route   GET /api/books/:id
 * @desc    Get book by ID
 * @access  Public
 * @note    This route must be last to avoid catching /get-all-books or /get-all-generalbooks
 */
router.get('/:id', bookController.getBookById);

module.exports = router;

