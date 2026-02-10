// Subgrade Model for Firestore (section under a grade)
class Subgrade {
  constructor(data) {
    this.id = data.id || null;
    this.gradeId = data.gradeId || '';
    this.name = data.name || '';
    this.displayOrder = data.displayOrder || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Subgrade({
      id: doc.id,
      ...data,
    });
  }

  toFirestore() {
    return {
      gradeId: this.gradeId,
      name: this.name,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  validate() {
    const errors = [];

    if (!this.gradeId || this.gradeId.trim().length === 0) {
      errors.push('Grade ID is required.');
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Subgrade name is required.');
    } else if (this.name.length > 100) {
      errors.push('Subgrade name cannot exceed 100 characters.');
    }

    return errors;
  }
}

module.exports = Subgrade;
