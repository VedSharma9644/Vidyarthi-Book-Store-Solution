const XLSX = require('xlsx');
const { db } = require('../config/database');
const Book = require('../models/Book');
const bookInventoryFlags = require('./bookInventoryFlagsService');

const ALLOWED_BOOK_TYPES = new Set([
  'TEXTBOOK',
  'NOTEBOOK',
  'MANDATORY_NOTEBOOK',
  'STATIONARY',
  'UNIFORM',
  'OPTIONAL_1',
  'OPTIONAL_2',
  'OPTIONAL_3',
  'OPTIONAL_4',
  'OTHER',
]);

const MAX_ROWS = 200;

const HEADER_ALIASES = {
  title: ['title', 'booktitle', 'product', 'productname', 'name'],
  author: ['author'],
  isbn: ['isbn'],
  sku: ['sku', 'skucode', 'productsku'],
  price: ['price', 'totalprice', 'sellingprice'],
  stockquantity: ['stockquantity', 'stock', 'qty', 'quantity'],
  booktype: ['booktype', 'type', 'categorytype'],
  productquantity: ['productquantity', 'bundleqty', 'unitsperbundle', 'perbundle'],
  perproductprice: ['perproductprice', 'unitprice'],
  publisher: ['publisher'],
  description: ['description', 'desc'],
  section: ['section', 'subgrade', 'sectionname'],
  category: ['category', 'categoryname'],
  coverimageurl: ['coverimageurl', 'imageurl', 'coverurl', 'image'],
};

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function mapHeaders(rawHeaders) {
  const mapping = {};
  rawHeaders.forEach((header, index) => {
    const key = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(key) && mapping[field] == null) {
        mapping[field] = index;
        break;
      }
    }
  });
  return mapping;
}

function cell(row, mapping, field) {
  const idx = mapping[field];
  if (idx == null) return '';
  const v = row[idx];
  if (v == null) return '';
  return String(v).trim();
}

function parseNumber(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

function normalizeBookType(raw) {
  if (!raw) return '';
  const cleaned = String(raw).trim().toUpperCase().replace(/\s+/g, '_');
  const aliases = {
    MANDATORY_TEXTBOOK: 'TEXTBOOK',
    TEXT_BOOK: 'TEXTBOOK',
    SCHOOL_SUGGESTED: 'OPTIONAL_1',
    OPTIONAL: 'OPTIONAL_2',
    STATIONERY: 'STATIONARY',
  };
  const mapped = aliases[cleaned] || cleaned;
  return ALLOWED_BOOK_TYPES.has(mapped) ? mapped : '';
}

/**
 * Parse Excel/CSV buffer into raw sheet rows (array of arrays).
 */
function parseWorkbookToRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet has no sheets');
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  return rows.filter((row) => Array.isArray(row) && row.some((c) => String(c || '').trim() !== ''));
}

/**
 * Build downloadable Excel template buffer.
 */
function buildTemplateBuffer() {
  const headers = [
    'Title',
    'Author',
    'ISBN',
    'SKU',
    'Price',
    'StockQuantity',
    'BookType',
    'ProductQuantity',
    'PerProductPrice',
    'Publisher',
    'Description',
    'Section',
    'Category',
    'CoverImageUrl',
  ];
  const sample = [
    [
      'Madhup Hindi CBSE Pathmala Class 7',
      'Madhubun',
      '9788174500001',
      'DPS-C7-TXT-001',
      555,
      50,
      'TEXTBOOK',
      1,
      '',
      'Madhubun',
      '',
      '',
      '',
      '',
    ],
    [
      'DPS Crown Single Ruled 180 Pages',
      'DPS',
      'NA-NB-001',
      'DPS-C7-NB-001',
      62,
      200,
      'MANDATORY_NOTEBOOK',
      1,
      '',
      'DPS',
      '',
      '',
      '',
      '',
    ],
    [
      'Faber Castel Water Colour Pencil 24 Shades',
      'Faber',
      'NA-ST-001',
      'DPS-C7-ST-001',
      283,
      40,
      'STATIONARY',
      1,
      '',
      'Faber',
      '',
      '',
      '',
      '',
    ],
  ];

  const booksSheet = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  const typesSheet = XLSX.utils.aoa_to_sheet([
    ['BookType', 'Meaning'],
    ['TEXTBOOK', 'Mandatory Textbook'],
    ['NOTEBOOK', 'Notebook'],
    ['MANDATORY_NOTEBOOK', 'Mandatory Notebook'],
    ['STATIONARY', 'Stationary'],
    ['UNIFORM', 'Uniform'],
    ['OPTIONAL_1', 'School suggested'],
    ['OPTIONAL_2', 'Optional'],
    ['OTHER', 'Other'],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, booksSheet, 'Books');
  XLSX.utils.book_append_sheet(wb, typesSheet, 'BookTypes');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function loadGradeContext(schoolId, gradeId) {
  const schoolDoc = await db.collection('schools').doc(schoolId).get();
  if (!schoolDoc.exists) {
    throw Object.assign(new Error('School not found'), { status: 400 });
  }
  const gradeDoc = await db.collection('grades').doc(gradeId).get();
  if (!gradeDoc.exists) {
    throw Object.assign(new Error('Grade not found'), { status: 400 });
  }
  const gradeData = gradeDoc.data() || {};
  if (gradeData.schoolId && String(gradeData.schoolId) !== String(schoolId)) {
    throw Object.assign(new Error('Selected grade does not belong to the selected school'), {
      status: 400,
    });
  }

  const [subSnap, catSnap] = await Promise.all([
    db.collection('subgrades').where('gradeId', '==', gradeId).get(),
    db.collection('categories').where('gradeId', '==', gradeId).get(),
  ]);

  const subgradesByName = new Map();
  subSnap.forEach((doc) => {
    const name = String(doc.data()?.name || '')
      .trim()
      .toLowerCase();
    if (name) subgradesByName.set(name, doc.id);
  });

  const categoriesByName = new Map();
  catSnap.forEach((doc) => {
    const name = String(doc.data()?.name || '')
      .trim()
      .toLowerCase();
    if (name) categoriesByName.set(name, { id: doc.id, subgradeId: doc.data()?.subgradeId || '' });
  });

  return { schoolId, gradeId, subgradesByName, categoriesByName };
}

function rowToBookDraft(row, mapping, rowNumber, ctx, defaultSubgradeId) {
  const errors = [];
  const title = cell(row, mapping, 'title');
  const author = cell(row, mapping, 'author') || '-';
  const isbn = cell(row, mapping, 'isbn');
  const sku = cell(row, mapping, 'sku');
  const price = parseNumber(cell(row, mapping, 'price'));
  const stockQuantity = parseNumber(cell(row, mapping, 'stockquantity'), null);
  const bookTypeRaw = cell(row, mapping, 'booktype');
  const bookType = normalizeBookType(bookTypeRaw);
  const productQuantityRaw = cell(row, mapping, 'productquantity');
  const productQuantity =
    productQuantityRaw === '' ? 1 : parseNumber(productQuantityRaw, 1);
  const perProductPrice = parseNumber(cell(row, mapping, 'perproductprice'), null);
  const publisher = cell(row, mapping, 'publisher');
  const description = cell(row, mapping, 'description');
  const sectionName = cell(row, mapping, 'section');
  const categoryName = cell(row, mapping, 'category');
  const coverImageUrl = cell(row, mapping, 'coverimageurl');

  if (!title) errors.push('Title is required');
  if (!isbn) errors.push('ISBN is required');
  if (price == null || price < 0) errors.push('Valid Price is required');
  if (stockQuantity == null || stockQuantity < 0) errors.push('Valid StockQuantity is required');
  if (!bookType) {
    errors.push(
      bookTypeRaw
        ? `Invalid BookType "${bookTypeRaw}"`
        : 'BookType is required (e.g. TEXTBOOK, NOTEBOOK)'
    );
  }

  let subgradeId = defaultSubgradeId || '';
  if (sectionName) {
    const sid = ctx.subgradesByName.get(sectionName.toLowerCase());
    if (!sid) {
      errors.push(`Section "${sectionName}" not found for this grade`);
    } else {
      subgradeId = sid;
    }
  }

  let categoryId = '';
  if (categoryName) {
    const cat = ctx.categoriesByName.get(categoryName.toLowerCase());
    if (!cat) {
      errors.push(`Category "${categoryName}" not found for this grade`);
    } else {
      categoryId = cat.id;
      if (!subgradeId && cat.subgradeId) {
        subgradeId = cat.subgradeId;
      }
    }
  }

  const draft = {
    rowNumber,
    title,
    author,
    isbn,
    sku: sku || '',
    price,
    stockQuantity,
    bookType,
    productQuantity,
    perProductPrice,
    publisher,
    description,
    coverImageUrl,
    sectionName: sectionName || null,
    categoryName: categoryName || null,
    categoryId,
    subgradeId,
    schoolId: ctx.schoolId,
    gradeId: ctx.gradeId,
    errors,
    valid: errors.length === 0,
  };
  return draft;
}

/**
 * @param {Buffer} buffer
 * @param {{ schoolId: string, gradeId: string, subgradeId?: string, dryRun?: boolean }} options
 */
async function importBooksFromSpreadsheet(buffer, options) {
  const { schoolId, gradeId, subgradeId = '', dryRun = false } = options;
  if (!schoolId || !gradeId) {
    throw Object.assign(new Error('schoolId and gradeId are required'), { status: 400 });
  }

  const rows = parseWorkbookToRows(buffer);
  if (rows.length < 2) {
    throw Object.assign(new Error('File must include a header row and at least one data row'), {
      status: 400,
    });
  }

  const mapping = mapHeaders(rows[0]);
  if (mapping.title == null || mapping.isbn == null || mapping.price == null || mapping.booktype == null) {
    throw Object.assign(
      new Error(
        'Missing required columns. Need at least: Title, ISBN, Price, BookType (StockQuantity recommended).'
      ),
      { status: 400 }
    );
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    throw Object.assign(new Error(`Too many rows. Maximum is ${MAX_ROWS} products per upload.`), {
      status: 400,
    });
  }

  const ctx = await loadGradeContext(schoolId, gradeId);
  if (subgradeId) {
    const exists = [...ctx.subgradesByName.values()].includes(subgradeId);
    if (!exists) {
      // still allow if id exists in firestore for this grade
      const sg = await db.collection('subgrades').doc(subgradeId).get();
      if (!sg.exists || String(sg.data()?.gradeId || '') !== String(gradeId)) {
        throw Object.assign(new Error('Selected section does not belong to this grade'), {
          status: 400,
        });
      }
    }
  }

  const drafts = dataRows.map((row, i) =>
    rowToBookDraft(row, mapping, i + 2, ctx, subgradeId)
  );

  const validRows = drafts.filter((d) => d.valid);
  const invalidRows = drafts.filter((d) => !d.valid);

  if (dryRun) {
    return {
      dryRun: true,
      totalRows: drafts.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      rows: drafts.map((d) => ({
        rowNumber: d.rowNumber,
        title: d.title,
        author: d.author,
        isbn: d.isbn,
        price: d.price,
        stockQuantity: d.stockQuantity,
        bookType: d.bookType,
        productQuantity: d.productQuantity,
        sectionName: d.sectionName,
        categoryName: d.categoryName,
        valid: d.valid,
        errors: d.errors,
      })),
    };
  }

  if (validRows.length === 0) {
    return {
      dryRun: false,
      totalRows: drafts.length,
      createdCount: 0,
      invalidCount: invalidRows.length,
      created: [],
      failed: invalidRows.map((d) => ({
        rowNumber: d.rowNumber,
        title: d.title,
        isbn: d.isbn,
        errors: d.errors,
      })),
    };
  }

  const created = [];
  const failed = invalidRows.map((d) => ({
    rowNumber: d.rowNumber,
    title: d.title,
    isbn: d.isbn,
    errors: d.errors,
  }));

  // Firestore batch limit 500; we cap at 200 books
  let batch = db.batch();
  let ops = 0;
  const pendingRefs = [];

  for (const draft of validRows) {
    const book = new Book({
      title: draft.title,
      author: draft.author,
      publisher: draft.publisher || '',
      isbn: draft.isbn,
      sku: draft.sku || '',
      description: draft.description || '',
      price: draft.price,
      productQuantity: draft.productQuantity != null ? String(draft.productQuantity) : '1',
      perProductPrice: draft.perProductPrice,
      stockQuantity: draft.stockQuantity,
      coverImageUrl: draft.coverImageUrl || '',
      bookType: draft.bookType,
      categoryId: draft.categoryId || '',
      gradeId: draft.gradeId,
      subgradeId: draft.subgradeId || '',
      schoolId: draft.schoolId,
      isActive: true,
      isFeatured: false,
      publicationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const validationErrors = book.validate();
    if (validationErrors.length > 0) {
      failed.push({
        rowNumber: draft.rowNumber,
        title: draft.title,
        isbn: draft.isbn,
        errors: validationErrors,
      });
      continue;
    }

    const ref = db.collection('books').doc();
    batch.set(ref, book.toFirestore());
    pendingRefs.push({
      ref,
      rowNumber: draft.rowNumber,
      title: draft.title,
      isbn: draft.isbn,
      bookType: draft.bookType,
    });
    ops += 1;

    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  for (const item of pendingRefs) {
    created.push({
      id: item.ref.id,
      rowNumber: item.rowNumber,
      title: item.title,
      isbn: item.isbn,
      bookType: item.bookType,
    });
  }

  try {
    await bookInventoryFlags.refreshAfterBookChange(null, {
      schoolId,
      gradeId,
      subgradeId: subgradeId || '',
      isActive: true,
    });
  } catch (e) {
    console.warn('bookInventoryFlags after bulk import:', e.message);
  }

  return {
    dryRun: false,
    totalRows: drafts.length,
    createdCount: created.length,
    invalidCount: failed.length,
    created,
    failed,
  };
}

module.exports = {
  ALLOWED_BOOK_TYPES,
  MAX_ROWS,
  buildTemplateBuffer,
  importBooksFromSpreadsheet,
};
