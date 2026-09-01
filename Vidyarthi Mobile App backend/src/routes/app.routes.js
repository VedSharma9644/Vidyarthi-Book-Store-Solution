const express = require('express');
const router = express.Router();
const appController = require('../controllers/app.controller');

/**
 * @route GET /api/app/version-policy
 * @desc  Mobile app version policy (min/latest, force vs optional update)
 * @access Public
 */
router.get('/version-policy', appController.getVersionPolicy);

module.exports = router;
