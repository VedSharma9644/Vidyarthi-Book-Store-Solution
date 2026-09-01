const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

// GET /api/books - Get all books
router.get('/', bookController.getAllBooks);

// GET /api/books/inventory/low - Get books with less than 5 orders left (configurable via ?threshold=5)
router.get('/inventory/low', bookController.getLowInventoryBooks);

// GET /api/books/bulk-import/template - Excel template for bulk upload
router.get('/bulk-import/template', bookController.downloadBulkImportTemplate);

// POST /api/books/bulk-import - Preview (dryRun=true) or create books from Excel/CSV
router.post(
  '/bulk-import',
  (req, res, next) => {
    bookController.bulkUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid upload',
        });
      }
      return next();
    });
  },
  bookController.bulkImportBooks
);

// GET /api/books/:id - Get book by ID
router.get('/:id', bookController.getBookById);

// POST /api/books - Create new book
router.post('/', bookController.createBook);

// PUT /api/books/:id - Update book
router.put('/:id', bookController.updateBook);

// DELETE /api/books/:id - Delete book (soft delete)
router.delete('/:id', bookController.deleteBook);

module.exports = router;
