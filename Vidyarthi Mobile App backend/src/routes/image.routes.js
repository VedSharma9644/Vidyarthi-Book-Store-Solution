const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');

/**
 * @route   GET /api/images
 * @desc    Get images by category
 * @access  Public
 * @query   category?: string, limit?: number
 */
router.get('/', imageController.getImages);

/**
 * @route   GET /api/images/banner
 * @desc    Get banner images for homepage
 * @access  Public
 */
router.get('/banner', imageController.getBannerImages);

module.exports = router;

