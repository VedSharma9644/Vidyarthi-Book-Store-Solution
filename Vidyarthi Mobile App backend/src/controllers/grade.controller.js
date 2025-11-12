const gradeService = require('../services/gradeService');

/**
 * Get all grades
 * @route   GET /api/grades
 * @access  Public
 * @query   { schoolId?: string }
 */
const getAllGrades = async (req, res) => {
    try {
        const { schoolId } = req.query;
        const grades = await gradeService.getAllGrades(schoolId);

        res.json({
            success: true,
            data: grades,
            count: grades.length,
        });
    } catch (error) {
        console.error('Error in getAllGrades controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch grades',
            error: error.message,
        });
    }
};

/**
 * Get grade by ID
 * @route   GET /api/grades/:id
 * @access  Public
 */
const getGradeById = async (req, res) => {
    try {
        const { id } = req.params;
        const grade = await gradeService.getGradeById(id);

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grade not found',
            });
        }

        res.json({
            success: true,
            data: grade,
        });
    } catch (error) {
        console.error('Error in getGradeById controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch grade',
            error: error.message,
        });
    }
};

module.exports = {
    getAllGrades,
    getGradeById,
};

