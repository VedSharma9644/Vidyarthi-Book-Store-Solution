const subgradeService = require('../services/subgradeService');

const getSubgradesByGradeId = async (req, res) => {
    try {
        const { gradeId } = req.query;
        const subgrades = await subgradeService.getSubgradesByGradeId(gradeId);

        res.json({
            success: true,
            data: subgrades,
            count: subgrades.length,
        });
    } catch (error) {
        console.error('Error in getSubgradesByGradeId controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subgrades',
            error: error.message,
        });
    }
};

/**
 * Batch get subgrades by multiple gradeIds
 * @route   POST /api/subgrades/by-grade-ids
 * @access  Public
 * @body    { gradeIds: string[] }
 */
const getSubgradesByGradeIds = async (req, res) => {
    try {
        const gradeIds = req.body?.gradeIds;
        if (!Array.isArray(gradeIds) || gradeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'gradeIds array is required',
                data: [],
            });
        }

        const subgrades = await subgradeService.getSubgradesByGradeIds(gradeIds);
        return res.json({
            success: true,
            data: subgrades,
            count: subgrades.length,
        });
    } catch (error) {
        console.error('Error in getSubgradesByGradeIds controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch subgrades',
            error: error.message,
        });
    }
};

const getSubgradeById = async (req, res) => {
    try {
        const { id } = req.params;
        const subgrade = await subgradeService.getSubgradeById(id);

        if (!subgrade) {
            return res.status(404).json({
                success: false,
                message: 'Subgrade not found',
            });
        }

        res.json({
            success: true,
            data: subgrade,
        });
    } catch (error) {
        console.error('Error in getSubgradeById controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subgrade',
            error: error.message,
        });
    }
};

module.exports = {
    getSubgradesByGradeId,
    getSubgradesByGradeIds,
    getSubgradeById,
};
