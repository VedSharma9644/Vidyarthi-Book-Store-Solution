// Grade Model for Firestore
class Grade {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.schoolId = data.schoolId || '';
    this.displayOrder = data.displayOrder || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert Firestore document to Grade object
  static fromFirestore(doc) {
    const data = doc.data();
    return new Grade({
      id: doc.id,
      ...data,
    });
  }

  // Convert Grade object to Firestore document
  toFirestore() {
    return {
      name: this.name,
      schoolId: this.schoolId,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Validate grade data
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Grade name is required.');
    } else if (this.name.length > 100) {
      errors.push('Grade name cannot exceed 100 characters.');
    }

    if (!this.schoolId || this.schoolId.trim().length === 0) {
      errors.push('School ID is required.');
    }

    return errors;
  }
}

module.exports = Grade;

