const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (should add auth middleware later)
 */
router.put('/:id', userController.updateUser);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (should add auth middleware later)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   POST /api/users/:id/profile-image
 * @desc    Upload profile image for user
 * @access  Private (should add auth middleware later)
 */
router.post('/:id/profile-image', userController.upload, userController.uploadProfileImage);

module.exports = router;

