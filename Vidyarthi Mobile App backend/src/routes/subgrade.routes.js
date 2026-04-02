const express = require('express');
const router = express.Router();
const subgradeController = require('../controllers/subgrade.controller');

/**
 * @route   GET /api/subgrades
 * @desc    Get all subgrades (optionally filtered by gradeId)
 * @query   { gradeId?: string }
 */
router.get('/', subgradeController.getSubgradesByGradeId);

/**
 * @route   POST /api/subgrades/by-grade-ids
 * @desc    Batch get subgrades for multiple gradeIds
 * @body    { gradeIds: string[] }
 */
router.post('/by-grade-ids', subgradeController.getSubgradesByGradeIds);

/**
 * @route   GET /api/subgrades/:id
 * @desc    Get subgrade by ID
 */
router.get('/:id', subgradeController.getSubgradeById);

module.exports = router;
