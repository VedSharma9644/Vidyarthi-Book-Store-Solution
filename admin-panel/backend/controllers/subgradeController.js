const { db } = require('../config/database');
const Subgrade = require('../models/Subgrade');

const getAllSubgrades = async (req, res) => {
  try {
    const { gradeId } = req.query;
    let query = db.collection('subgrades').where('isActive', '==', true);

    if (gradeId) {
      query = query.where('gradeId', '==', gradeId);
    }

    const snapshot = await query.get();
    const subgrades = [];
    snapshot.forEach((doc) => {
      subgrades.push(Subgrade.fromFirestore(doc));
    });

    subgrades.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    res.json({
      success: true,
      data: subgrades,
      count: subgrades.length,
    });
  } catch (error) {
    console.error('Error fetching subgrades:', error);
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
    const doc = await db.collection('subgrades').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Subgrade not found',
      });
    }

    res.json({
      success: true,
      data: Subgrade.fromFirestore(doc),
    });
  } catch (error) {
    console.error('Error fetching subgrade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subgrade',
      error: error.message,
    });
  }
};

const createSubgrade = async (req, res) => {
  try {
    const subgrade = new Subgrade({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const errors = subgrade.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    if (subgrade.gradeId) {
      const gradeDoc = await db.collection('grades').doc(subgrade.gradeId).get();
      if (!gradeDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Grade not found',
          errors: ['The specified grade does not exist'],
        });
      }
    }

    const docRef = await db.collection('subgrades').add(subgrade.toFirestore());
    const newDoc = await db.collection('subgrades').doc(docRef.id).get();

    res.status(201).json({
      success: true,
      message: 'Subgrade created successfully',
      data: Subgrade.fromFirestore(newDoc),
    });
  } catch (error) {
    console.error('Error creating subgrade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subgrade',
      error: error.message,
    });
  }
};

const updateSubgrade = async (req, res) => {
  try {
    const { id } = req.params;
    const existingDoc = await db.collection('subgrades').doc(id).get();

    if (!existingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Subgrade not found',
      });
    }

    const existing = Subgrade.fromFirestore(existingDoc);
    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
    };
    updatedData.createdAt = existing.createdAt;

    const subgrade = new Subgrade({ id, ...updatedData });

    const errors = subgrade.validate();
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors,
      });
    }

    if (subgrade.gradeId && subgrade.gradeId !== existing.gradeId) {
      const gradeDoc = await db.collection('grades').doc(subgrade.gradeId).get();
      if (!gradeDoc.exists) {
        return res.status(400).json({
          success: false,
          message: 'Grade not found',
          errors: ['The specified grade does not exist'],
        });
      }
    }

    await db.collection('subgrades').doc(id).update(subgrade.toFirestore());
    const updatedDoc = await db.collection('subgrades').doc(id).get();

    res.json({
      success: true,
      message: 'Subgrade updated successfully',
      data: Subgrade.fromFirestore(updatedDoc),
    });
  } catch (error) {
    console.error('Error updating subgrade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subgrade',
      error: error.message,
    });
  }
};

const deleteSubgrade = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('subgrades').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Subgrade not found',
      });
    }

    await db.collection('subgrades').doc(id).update({
      isActive: false,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Subgrade deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subgrade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subgrade',
      error: error.message,
    });
  }
};

module.exports = {
  getAllSubgrades,
  getSubgradeById,
  createSubgrade,
  updateSubgrade,
  deleteSubgrade,
};
