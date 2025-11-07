const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');

// GET /api/schools - Get all schools
router.get('/', schoolController.getAllSchools);

// GET /api/schools/:id - Get school by ID
router.get('/:id', schoolController.getSchoolById);

// POST /api/schools - Create new school
router.post('/', schoolController.createSchool);

// PUT /api/schools/:id - Update school
router.put('/:id', schoolController.updateSchool);

// DELETE /api/schools/:id - Delete school (soft delete)
router.delete('/:id', schoolController.deleteSchool);

module.exports = router;

