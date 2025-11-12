const { db } = require('../config/database');
const Grade = require('../models/Grade');

// Get all grades
const getAllGrades = async (req, res) => {
  try {
    const { schoolId } = req.query;
    let query = db.collection('grades').where('isActive', '==', true);

    // Filter by schoolId if provided
    if (schoolId) {
      query = query.where('schoolId', '==', schoolId);
    }

    const gradesSnapshot = await query.get();
    const grades = [];

    gradesSnapshot.forEach((doc) => {
      grades.push(Grade.fromFirestore(doc));
    });

    // Sort by displayOrder, then by name
    grades.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      data: grades,
      count: grades.length,
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grades',
      error: error.message,
    });
  }
};

// Get grade by ID
const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const gradeDoc = await db.collection('grades').doc(id).get();

    if (!gradeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
      });
    }

    const grade = Grade.fromFirestore(gradeDoc);
    res.json({
      success: true,
      data: grade,
    });
  } catch (error) {
    console.error('Error fetching grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grade',
      error: error.message,
    });
  }
};

// Create new grade
const createGrade = async (req, res) => {
  try {
    const grade = new Grade({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Validate
    const errors = grade.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Verify school exists
    if (grade.schoolId) {
      const schoolDoc = await db.collection('schools').doc(grade.schoolId).get();
      if (!schoolDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'School not found',
          errors: ['The specified school does not exist'],
        });
      }
    }

    // Add to Firestore
    const docRef = await db.collection('grades').add(grade.toFirestore());
    const newGrade = await db.collection('grades').doc(docRef.id).get();

    res.status(201).json({
      success: true,
      message: 'Grade created successfully',
      data: Grade.fromFirestore(newGrade),
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create grade',
      error: error.message,
    });
  }
};

// Update grade
const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const gradeDoc = await db.collection('grades').doc(id).get();

    if (!gradeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
      });
    }

    const existingGrade = Grade.fromFirestore(gradeDoc);
    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Preserve createdAt
    updatedData.createdAt = existingGrade.createdAt;

    const grade = new Grade({
      id: id,
      ...updatedData,
    });

    // Validate
    const errors = grade.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Verify school exists if schoolId is being changed
    if (grade.schoolId && grade.schoolId !== existingGrade.schoolId) {
      const schoolDoc = await db.collection('schools').doc(grade.schoolId).get();
      if (!schoolDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'School not found',
          errors: ['The specified school does not exist'],
        });
      }
    }

    // Update in Firestore
    await db.collection('grades').doc(id).update(grade.toFirestore());
    const updatedGrade = await db.collection('grades').doc(id).get();

    res.json({
      success: true,
      message: 'Grade updated successfully',
      data: Grade.fromFirestore(updatedGrade),
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update grade',
      error: error.message,
    });
  }
};

// Delete grade (soft delete)
const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const gradeDoc = await db.collection('grades').doc(id).get();

    if (!gradeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found',
      });
    }

    // Soft delete - set isActive to false
    await db.collection('grades').doc(id).update({
      isActive: false,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Grade deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete grade',
      error: error.message,
    });
  }
};

module.exports = {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
};

