const { db } = require('../config/database');
const Book = require('../models/Book');
const bookInventoryFlags = require('../services/bookInventoryFlagsService');
const bookBulkImportService = require('../services/bookBulkImportService');
const multer = require('multer');
const path = require('path');

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowed = ['.xlsx', '.xls', '.csv'];
    if (allowed.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed'));
  },
});

function toCreatedAtIso(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate().toISOString();
  if (value._seconds != null) return new Date(value._seconds * 1000).toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const lite =
      req.query.lite === '1' ||
      req.query.lite === 'true' ||
      req.query.lite === 'yes';

    const booksSnapshot = await db.collection('books')
      .where('isActive', '==', true)
      .get();
    const books = [];

    booksSnapshot.forEach((doc) => {
      if (lite) {
        books.push({
          id: doc.id,
          createdAt: toCreatedAtIso(doc.data().createdAt),
        });
      } else {
        books.push(Book.fromFirestore(doc));
      }
    });

    res.json({
      success: true,
      data: books,
      count: books.length,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message,
    });
  }
};

// Get book by ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const bookDoc = await db.collection('books').doc(id).get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const book = Book.fromFirestore(bookDoc);
    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message,
    });
  }
};

// Create new book
const createBook = async (req, res) => {
  try {
    // Map frontend field names to model field names
    const bookData = {
      title: req.body.Title || req.body.title,
      author: req.body.Author || req.body.author,
      publisher: req.body.Publisher || req.body.publisher || '',
      isbn: req.body.ISBN || req.body.isbn,
      sku: req.body.SKU || req.body.sku || '',
      description: req.body.Description || req.body.description || '',
      price: req.body.Price || req.body.price,
      productQuantity: req.body.ProductQuantity || req.body.productQuantity || '',
      perProductPrice: req.body.PerProductPrice || req.body.perProductPrice || null,

      discountPrice: req.body.DiscountPrice || req.body.discountPrice || null,
      stockQuantity: req.body.StockQuantity || req.body.stockQuantity,
      coverImageUrl: req.body.CoverImageUrl || req.body.coverImageUrl || '',
      bookType: req.body.BookType || req.body.bookType,
      publicationDate: req.body.PublicationDate || req.body.publicationDate || new Date(),
      isFeatured: req.body.IsFeatured !== undefined ? req.body.IsFeatured : (req.body.isFeatured !== undefined ? req.body.isFeatured : false),
      categoryId: req.body.CategoryId || req.body.categoryId,
      gradeId: req.body.GradeId || req.body.gradeId || '',
      subgradeId: req.body.SubgradeId || req.body.subgradeId || '',
      schoolId: req.body.SchoolId || req.body.schoolId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (bookData.categoryId && (!bookData.gradeId || !bookData.schoolId || !bookData.subgradeId)) {
      try {
        const categoryDoc = await db.collection('categories').doc(bookData.categoryId).get();
        if (categoryDoc.exists) {
          const categoryData = categoryDoc.data();
          if (!bookData.gradeId && categoryData.gradeId) {
            bookData.gradeId = categoryData.gradeId;
          }
          if (!bookData.subgradeId && categoryData.subgradeId) {
            bookData.subgradeId = categoryData.subgradeId;
          }
          if (!bookData.schoolId && bookData.gradeId) {
            const gradeDoc = await db.collection('grades').doc(bookData.gradeId).get();
            if (gradeDoc.exists) {
              const gradeData = gradeDoc.data();
              if (gradeData.schoolId) {
                bookData.schoolId = gradeData.schoolId;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Warning: Could not fetch grade/school/subgrade from category:', error.message);
      }
    }

    const book = new Book(bookData);

    // Validate
    const errors = book.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Verify category exists
    if (book.categoryId) {
      const categoryDoc = await db.collection('categories').doc(book.categoryId).get();
      if (!categoryDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found',
          errors: ['The specified category does not exist'],
        });
      }
    }

    // Add to Firestore
    const docRef = await db.collection('books').add(book.toFirestore());
    const newBook = await db.collection('books').doc(docRef.id).get();

    const created = Book.fromFirestore(newBook);
    try {
      await bookInventoryFlags.refreshAfterBookChange(null, bookInventoryFlags.modelToRefBook(created));
    } catch (e) {
      console.warn('bookInventoryFlags refresh after create:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: created,
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message,
    });
  }
};

// Update book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const bookDoc = await db.collection('books').doc(id).get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const existingBook = Book.fromFirestore(bookDoc);
    
    // Map frontend field names to model field names
    const updatedData = {
      title: req.body.Title !== undefined ? req.body.Title : (req.body.title !== undefined ? req.body.title : existingBook.title),
      author: req.body.Author !== undefined ? req.body.Author : (req.body.author !== undefined ? req.body.author : existingBook.author),
      publisher: req.body.Publisher !== undefined ? req.body.Publisher : (req.body.publisher !== undefined ? req.body.publisher : existingBook.publisher),
      isbn: req.body.ISBN !== undefined ? req.body.ISBN : (req.body.isbn !== undefined ? req.body.isbn : existingBook.isbn),
      sku: req.body.SKU !== undefined ? req.body.SKU : (req.body.sku !== undefined ? req.body.sku : existingBook.sku || ''),
      description: req.body.Description !== undefined ? req.body.Description : (req.body.description !== undefined ? req.body.description : existingBook.description),
      price: req.body.Price !== undefined ? req.body.Price : (req.body.price !== undefined ? req.body.price : existingBook.price),
      productQuantity:
                    req.body.ProductQuantity !== undefined
                      ? req.body.ProductQuantity
                      : (req.body.productQuantity !== undefined
                          ? req.body.productQuantity
                          : existingBook.productQuantity || ''),

      perProductPrice:
                    req.body.PerProductPrice !== undefined
                      ? req.body.PerProductPrice
                      : (req.body.perProductPrice !== undefined
                          ? req.body.perProductPrice
                          : existingBook.perProductPrice || null),

      discountPrice: req.body.DiscountPrice !== undefined ? req.body.DiscountPrice : (req.body.discountPrice !== undefined ? req.body.discountPrice : existingBook.discountPrice),
      stockQuantity: req.body.StockQuantity !== undefined ? req.body.StockQuantity : (req.body.stockQuantity !== undefined ? req.body.stockQuantity : existingBook.stockQuantity),
      coverImageUrl: req.body.CoverImageUrl !== undefined ? req.body.CoverImageUrl : (req.body.coverImageUrl !== undefined ? req.body.coverImageUrl : existingBook.coverImageUrl),
      bookType: req.body.BookType !== undefined ? req.body.BookType : (req.body.bookType !== undefined ? req.body.bookType : existingBook.bookType),
      publicationDate: req.body.PublicationDate !== undefined ? req.body.PublicationDate : (req.body.publicationDate !== undefined ? req.body.publicationDate : existingBook.publicationDate),
      isFeatured: req.body.IsFeatured !== undefined ? req.body.IsFeatured : (req.body.isFeatured !== undefined ? req.body.isFeatured : existingBook.isFeatured),
      categoryId: req.body.CategoryId !== undefined ? req.body.CategoryId : (req.body.categoryId !== undefined ? req.body.categoryId : existingBook.categoryId),
      gradeId: req.body.GradeId !== undefined ? req.body.GradeId : (req.body.gradeId !== undefined ? req.body.gradeId : existingBook.gradeId || ''),
      subgradeId: req.body.SubgradeId !== undefined ? req.body.SubgradeId : (req.body.subgradeId !== undefined ? req.body.subgradeId : existingBook.subgradeId || ''),
      schoolId: req.body.SchoolId !== undefined ? req.body.SchoolId : (req.body.schoolId !== undefined ? req.body.schoolId : existingBook.schoolId || ''),
      updatedAt: new Date(),
    };

    if (updatedData.categoryId && (!updatedData.gradeId || !updatedData.schoolId || !updatedData.subgradeId)) {
      try {
        const categoryDoc = await db.collection('categories').doc(updatedData.categoryId).get();
        if (categoryDoc.exists) {
          const categoryData = categoryDoc.data();
          if (!updatedData.gradeId && categoryData.gradeId) {
            updatedData.gradeId = categoryData.gradeId;
          }
          if (!updatedData.subgradeId && categoryData.subgradeId) {
            updatedData.subgradeId = categoryData.subgradeId;
          }
          if (!updatedData.schoolId && updatedData.gradeId) {
            const gradeDoc = await db.collection('grades').doc(updatedData.gradeId).get();
            if (gradeDoc.exists) {
              const gradeData = gradeDoc.data();
              if (gradeData.schoolId) {
                updatedData.schoolId = gradeData.schoolId;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Warning: Could not fetch grade/school/subgrade from category:', error.message);
      }
    }

    // Preserve createdAt
    updatedData.createdAt = existingBook.createdAt;

    const book = new Book({
      id: id,
      ...updatedData,
    });

    // Validate
    const errors = book.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Verify category exists if categoryId is being updated
    if (book.categoryId && book.categoryId !== existingBook.categoryId) {
      const categoryDoc = await db.collection('categories').doc(book.categoryId).get();
      if (!categoryDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found',
          errors: ['The specified category does not exist'],
        });
      }
    }

    // Update in Firestore
    await db.collection('books').doc(id).update(book.toFirestore());
    const updatedBook = await db.collection('books').doc(id).get();

    const updated = Book.fromFirestore(updatedBook);
    try {
      await bookInventoryFlags.refreshAfterBookChange(
        bookInventoryFlags.modelToRefBook(existingBook),
        bookInventoryFlags.modelToRefBook(updated)
      );
    } catch (e) {
      console.warn('bookInventoryFlags refresh after update:', e.message);
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
    });
  }
};

// Delete book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const bookDoc = await db.collection('books').doc(id).get();

    if (!bookDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const bookData = bookDoc.data();

    // Permanently delete the book document from Firestore
    await db.collection('books').doc(id).delete();

    try {
      await bookInventoryFlags.refreshAfterBookChange(
        {
          gradeId: bookData.gradeId || '',
          subgradeId: bookData.subgradeId || '',
          isActive: true,
        },
        null
      );
    } catch (e) {
      console.warn('bookInventoryFlags refresh after delete:', e.message);
    }

    // Optionally delete the cover image from Firebase Storage if it exists
    if (bookData.coverImageUrl) {
      try {
        const { admin } = require('../config/database');
        const bucket = admin.storage().bucket('vidyarthi-mobile-app.firebasestorage.app');
        
        // Extract the file path from the URL
        // URL format: https://storage.googleapis.com/bucket-name/path/to/file
        const urlParts = bookData.coverImageUrl.split('/');
        const fileName = urlParts.slice(4).join('/'); // Skip https://storage.googleapis.com/bucket-name/
        
        if (fileName) {
          const file = bucket.file(fileName);
          const [exists] = await file.exists();
          
          if (exists) {
            await file.delete();
            console.log(`Deleted cover image: ${fileName}`);
          }
        }
      } catch (storageError) {
        // Log error but don't fail the deletion if image deletion fails
        console.warn('Warning: Could not delete cover image from storage:', storageError.message);
      }
    }

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
    });
  }
};

// Get books with low inventory (fewer than 5 orders left)
// Orders left = floor(stockQuantity / productQuantity) per bundle
const getLowInventoryBooks = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold, 10) || 5;

    const booksSnapshot = await db.collection('books')
      .where('isActive', '==', true)
      .get();

    const lowInventory = [];
    const gradeIds = new Set();
    const schoolIds = new Set();

    booksSnapshot.forEach((doc) => {
      const book = Book.fromFirestore(doc);
      const stock = parseInt(book.stockQuantity, 10) || 0;
      const unitsPerBundle = parseInt(book.productQuantity, 10) || 1;
      const ordersLeft = Math.floor(stock / unitsPerBundle);

      if (ordersLeft < threshold) {
        lowInventory.push({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          bookType: book.bookType || '',
          stockQuantity: stock,
          productQuantity: unitsPerBundle,
          ordersLeft,
          gradeId: book.gradeId || '',
          schoolId: book.schoolId || '',
          categoryId: book.categoryId || '',
        });
        if (book.gradeId) gradeIds.add(book.gradeId);
        if (book.schoolId) schoolIds.add(book.schoolId);
      }
    });

    // Fetch grade and school names
    const gradesMap = {};
    const schoolsMap = {};
    await Promise.all([
      ...Array.from(gradeIds).map(async (id) => {
        const doc = await db.collection('grades').doc(id).get();
        if (doc.exists) gradesMap[id] = doc.data().name || '';
      }),
      ...Array.from(schoolIds).map(async (id) => {
        const doc = await db.collection('schools').doc(id).get();
        if (doc.exists) {
          const d = doc.data();
          schoolsMap[id] = d.name + (d.branchName ? ` - ${d.branchName}` : '') || '';
        }
      }),
    ]);

    const result = lowInventory.map((item) => ({
      ...item,
      gradeName: gradesMap[item.gradeId] || 'N/A',
      schoolName: schoolsMap[item.schoolId] || 'N/A',
    }));

    res.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Error fetching low inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low inventory',
      error: error.message,
    });
  }
};

/** Download Excel template for bulk product upload */
const downloadBulkImportTemplate = async (req, res) => {
  try {
    const buffer = bookBulkImportService.buildTemplateBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="bulk-books-template.xlsx"'
    );
    return res.send(buffer);
  } catch (error) {
    console.error('Error generating bulk import template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message,
    });
  }
};

/** Preview or import books from Excel/CSV */
const bulkImportBooks = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Spreadsheet file is required (.xlsx, .xls, or .csv)',
      });
    }

    const schoolId = String(req.body.schoolId || '').trim();
    const gradeId = String(req.body.gradeId || '').trim();
    const subgradeId = String(req.body.subgradeId || '').trim();
    const dryRun =
      req.body.dryRun === true ||
      req.body.dryRun === 'true' ||
      req.body.dryRun === '1';

    if (!schoolId || !gradeId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId and gradeId are required',
      });
    }

    const result = await bookBulkImportService.importBooksFromSpreadsheet(req.file.buffer, {
      schoolId,
      gradeId,
      subgradeId: subgradeId || '',
      dryRun,
    });

    return res.json({
      success: true,
      message: dryRun
        ? 'Preview ready'
        : `Created ${result.createdCount} product(s)${
            result.invalidCount ? `, ${result.invalidCount} row(s) skipped` : ''
          }`,
      data: result,
    });
  } catch (error) {
    console.error('Error in bulkImportBooks:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to import books',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getLowInventoryBooks,
  downloadBulkImportTemplate,
  bulkImportBooks,
  bulkUpload,
};

