const schoolService = require('../services/schoolService');
const gradeService = require('../services/gradeService');
const subgradeService = require('../services/subgradeService');

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

/**
 * Get combined school page data (school + grades + subgrades + book presence)
 * @route   GET /api/schools/:id/page-data
 * @access  Public
 */
const getSchoolPageData = async (req, res) => {
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

        const gradesAll = await gradeService.getAllGrades(id);
        const gradeIds = Array.isArray(gradesAll) ? gradesAll.map((g) => g.id).filter(Boolean) : [];

        const subgrades = await subgradeService.getSubgradesByGradeIds(gradeIds);

        const sectionsByGradeIdRaw = {};
        (subgrades || []).forEach((sg) => {
            const gid = sg.gradeId;
            if (!gid) return;
            if (!sectionsByGradeIdRaw[gid]) sectionsByGradeIdRaw[gid] = [];
            sectionsByGradeIdRaw[gid].push(sg);
        });

        // hasActiveBooks on grade/subgrade (maintained by admin book writes + backfill). false = hide.
        const grades = (gradesAll || []).filter((g) => g.hasActiveBooks !== false);
        const sectionsByGradeId = {};
        grades.forEach((g) => {
            const list = sectionsByGradeIdRaw[g.id] || [];
            sectionsByGradeId[g.id] = list.filter((sg) => sg.hasActiveBooks !== false);
        });

        return res.json({
            success: true,
            data: {
                school,
                grades,
                sectionsByGradeId,
            },
        });
    } catch (error) {
        console.error('Get school page data error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load school page data',
            error: error.message,
        });
    }
};

module.exports = {
    searchSchools,
    getSchoolByCode,
    validateSchoolCode,
    getSchoolById,
    getSchoolPageData,
};

