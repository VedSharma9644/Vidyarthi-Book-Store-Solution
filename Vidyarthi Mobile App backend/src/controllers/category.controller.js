const categoryService = require('../services/categoryService');

/**
 * Get all categories
 * @route   GET /api/categories
 * @access  Public
 * @query   { gradeId?: string }
 */
const getAllCategories = async (req, res) => {
    try {
        const { gradeId } = req.query;
        const categories = await categoryService.getAllCategories(gradeId);

        res.json({
            success: true,
            data: categories,
            count: categories.length,
        });
    } catch (error) {
        console.error('Error in getAllCategories controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message,
        });
    }
};

/**
 * Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categoryService.getCategoryById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error('Error in getCategoryById controller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category',
            error: error.message,
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
};

