const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');

/**
 * @route   GET /api/grades
 * @desc    Get all grades (optionally filtered by schoolId)
 * @access  Public
 * @query   { schoolId?: string }
 */
router.get('/', gradeController.getAllGrades);

/**
 * @route   GET /api/grades/:id
 * @desc    Get grade by ID
 * @access  Public
 */
router.get('/:id', gradeController.getGradeById);

module.exports = router;

