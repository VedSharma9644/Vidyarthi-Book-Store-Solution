const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/school.controller');

/**
 * @route   GET /api/schools/search
 * @desc    Search schools by code or name
 * @access  Public
 * @query   { q?: string, limit?: number }
 */
router.get('/search', schoolController.searchSchools);

/**
 * @route   GET /api/schools/validate-code
 * @desc    Validate a school code
 * @access  Public
 * @query   { code: string }
 */
router.get('/validate-code', schoolController.validateSchoolCode);

/**
 * @route   GET /api/schools/code/:code
 * @desc    Get school by code
 * @access  Public
 */
router.get('/code/:code', schoolController.getSchoolByCode);

/**
 * @route   GET /api/schools/:id
 * @desc    Get school by ID
 * @access  Public
 */
router.get('/:id', schoolController.getSchoolById);

module.exports = router;

