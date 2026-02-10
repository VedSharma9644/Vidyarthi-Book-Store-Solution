const { db } = require('../config/database');
const School = require('../models/School');
const Grade = require('../models/Grade');
const { DEFAULT_GRADES } = require('../constants/defaultGrades');

// Get all schools
const getAllSchools = async (req, res) => {
  try {
    const schoolsSnapshot = await db.collection('schools').get();
    const schools = [];

    schoolsSnapshot.forEach((doc) => {
      schools.push(School.fromFirestore(doc));
    });

    res.json({
      success: true,
      data: schools,
      count: schools.length,
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools',
      error: error.message,
    });
  }
};

// Get school by ID
const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolDoc = await db.collection('schools').doc(id).get();

    if (!schoolDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const school = School.fromFirestore(schoolDoc);
    res.json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school',
      error: error.message,
    });
  }
};

// Create new school
const createSchool = async (req, res) => {
  try {
    const school = new School({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Validate
    const errors = school.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Check if school code already exists
    const existingSchool = await db
      .collection('schools')
      .where('code', '==', school.code)
      .get();

    if (!existingSchool.empty) {
      return res.status(400).json({
        success: false,
        message: 'School with this code already exists',
      });
    }

    // Add school to Firestore
    const docRef = await db.collection('schools').add(school.toFirestore());
    const schoolId = docRef.id;

    // Create default grades for the new school (NURSERY, PP-1, PP-2, CLASS-1..12)
    const now = new Date();
    const batch = db.batch();
    for (const { name, displayOrder } of DEFAULT_GRADES) {
      const grade = new Grade({
        name,
        schoolId,
        displayOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      const gradeRef = db.collection('grades').doc();
      batch.set(gradeRef, grade.toFirestore());
    }
    await batch.commit();

    const newSchool = await db.collection('schools').doc(schoolId).get();

    res.status(201).json({
      success: true,
      message: 'School created successfully with default grades',
      data: School.fromFirestore(newSchool),
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create school',
      error: error.message,
    });
  }
};

// Update school
const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolDoc = await db.collection('schools').doc(id).get();

    if (!schoolDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    const existingSchool = School.fromFirestore(schoolDoc);
    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Preserve createdAt
    updatedData.createdAt = existingSchool.createdAt;

    const school = new School({
      id: id,
      ...updatedData,
    });

    // Validate
    const errors = school.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Check if school code already exists (excluding current school)
    if (school.code !== existingSchool.code) {
      const codeCheck = await db
        .collection('schools')
        .where('code', '==', school.code)
        .get();

      if (!codeCheck.empty) {
        return res.status(400).json({
          success: false,
          message: 'School with this code already exists',
        });
      }
    }

    // Update in Firestore
    await db.collection('schools').doc(id).update(school.toFirestore());
    const updatedSchool = await db.collection('schools').doc(id).get();

    res.json({
      success: true,
      message: 'School updated successfully',
      data: School.fromFirestore(updatedSchool),
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update school',
      error: error.message,
    });
  }
};

// Delete school
const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolDoc = await db.collection('schools').doc(id).get();

    if (!schoolDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Soft delete - set isActive to false
    await db.collection('schools').doc(id).update({
      isActive: false,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'School deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete school',
      error: error.message,
    });
  }
};

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
};

