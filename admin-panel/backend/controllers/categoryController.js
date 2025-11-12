const { db } = require('../config/database');
const Category = require('../models/Category');

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const { schoolId } = req.query;
    let categories = [];

    if (schoolId) {
      // Filter categories by schoolId through grades
      // First, get all grades for this school
      const gradesSnapshot = await db.collection('grades')
        .where('schoolId', '==', schoolId)
        .where('isActive', '==', true)
        .get();
      
      const gradeIds = [];
      gradesSnapshot.forEach((doc) => {
        gradeIds.push(doc.id);
      });

      if (gradeIds.length > 0) {
        // Get all categories for these grades
        // Firestore doesn't support 'in' queries with more than 10 items, so we'll batch if needed
        const batchSize = 10;
        for (let i = 0; i < gradeIds.length; i += batchSize) {
          const batch = gradeIds.slice(i, i + batchSize);
          const categoriesSnapshot = await db.collection('categories')
            .where('isActive', '==', true)
            .where('gradeId', 'in', batch)
            .get();
          
          categoriesSnapshot.forEach((doc) => {
            categories.push(Category.fromFirestore(doc));
          });
        }
      }
    } else {
      // Get all active categories
      const categoriesSnapshot = await db.collection('categories')
        .where('isActive', '==', true)
        .get();
      
      categoriesSnapshot.forEach((doc) => {
        categories.push(Category.fromFirestore(doc));
      });
    }

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryDoc = await db.collection('categories').doc(id).get();

    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const category = Category.fromFirestore(categoryDoc);
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message,
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const category = new Category({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Validate
    const errors = category.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Verify grade exists
    if (category.gradeId) {
      const gradeDoc = await db.collection('grades').doc(category.gradeId).get();
      if (!gradeDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Grade not found',
          errors: ['The specified grade does not exist'],
        });
      }
    }

    // Add to Firestore
    const docRef = await db.collection('categories').add(category.toFirestore());
    const newCategory = await db.collection('categories').doc(docRef.id).get();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: Category.fromFirestore(newCategory),
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryDoc = await db.collection('categories').doc(id).get();

    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const existingCategory = Category.fromFirestore(categoryDoc);
    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Preserve createdAt
    updatedData.createdAt = existingCategory.createdAt;

    const category = new Category({
      id: id,
      ...updatedData,
    });

    // Validate
    const errors = category.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Verify grade exists if gradeId is being updated
    if (category.gradeId && category.gradeId !== existingCategory.gradeId) {
      const gradeDoc = await db.collection('grades').doc(category.gradeId).get();
      if (!gradeDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Grade not found',
          errors: ['The specified grade does not exist'],
        });
      }
    }

    // Update in Firestore
    await db.collection('categories').doc(id).update(category.toFirestore());
    const updatedCategory = await db.collection('categories').doc(id).get();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: Category.fromFirestore(updatedCategory),
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message,
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryDoc = await db.collection('categories').doc(id).get();

    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Soft delete - set isActive to false
    await db.collection('categories').doc(id).update({
      isActive: false,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

