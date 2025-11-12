const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

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

/**
 * @route   POST /api/grades
 * @desc    Create a new grade
 * @access  Public
 */
router.post('/', gradeController.createGrade);

/**
 * @route   PUT /api/grades/:id
 * @desc    Update a grade
 * @access  Public
 */
router.put('/:id', gradeController.updateGrade);

/**
 * @route   DELETE /api/grades/:id
 * @desc    Delete a grade (soft delete)
 * @access  Public
 */
router.delete('/:id', gradeController.deleteGrade);

module.exports = router;

