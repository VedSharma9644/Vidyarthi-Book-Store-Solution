const schoolService = require('../services/schoolService');

/**
 * Search schools by code or name
 */
const searchSchools = async (req, res) => {
    try {
        const { q, limit } = req.query;
        const searchLimit = parseInt(limit) || 20;

        const schools = await schoolService.searchSchools(q, searchLimit);

        res.json({
            success: true,
            data: schools,
            count: schools.length,
        });
    } catch (error) {
        console.error('Search schools error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search schools',
            error: error.message,
        });
    }
};

/**
 * Get school by code
 */
const getSchoolByCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'School code is required',
            });
        }

        const school = await schoolService.getSchoolByCode(code);

        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found',
            });
        }

        res.json({
            success: true,
            data: school,
        });
    } catch (error) {
        console.error('Get school by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get school',
            error: error.message,
        });
    }
};

/**
 * Validate school code
 */
const validateSchoolCode = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'School code is required',
            });
        }

        const school = await schoolService.validateSchoolCode(code);

        if (!school) {
            return res.json({
                success: false,
                isValid: false,
                message: 'Invalid school code',
            });
        }

        res.json({
            success: true,
            isValid: true,
            data: school,
        });
    } catch (error) {
        console.error('Validate school code error:', error);
        res.status(500).json({
            success: false,
            isValid: false,
            message: 'Failed to validate school code',
            error: error.message,
        });
    }
};

/**
 * Get school by ID
 */
const getSchoolById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'School ID is required',
            });
        }

        const school = await schoolService.getSchoolById(id);

        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found',
            });
        }

        res.json({
            success: true,
            data: school,
        });
    } catch (error) {
        console.error('Get school by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get school',
            error: error.message,
        });
    }
};

module.exports = {
    searchSchools,
    getSchoolByCode,
    validateSchoolCode,
    getSchoolById,
};

