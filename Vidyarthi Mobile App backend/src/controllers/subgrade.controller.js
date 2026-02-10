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
    getSubgradeById,
};
