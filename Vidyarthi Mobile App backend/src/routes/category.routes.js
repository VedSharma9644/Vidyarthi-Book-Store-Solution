const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

/**
 * @route   GET /api/categories
 * @desc    Get all categories (optionally filtered by gradeId)
 * @access  Public
 * @query   { gradeId?: string }
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

module.exports = router;

