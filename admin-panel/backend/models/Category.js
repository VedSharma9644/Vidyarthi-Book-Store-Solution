// Category Model for Firestore
class Category {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.imageUrl = data.imageUrl || '';
    this.gradeId = data.gradeId || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert Firestore document to Category object
  static fromFirestore(doc) {
    const data = doc.data();
    return new Category({
      id: doc.id,
      ...data,
    });
  }

  // Convert Category object to Firestore document
  toFirestore() {
    return {
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      gradeId: this.gradeId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Validate category data
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Category name is required.');
    } else if (this.name.length > 100) {
      errors.push('Category name cannot exceed 100 characters.');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Description cannot exceed 500 characters.');
    }

    if (this.imageUrl && this.imageUrl.length > 500) {
      errors.push('Image URL cannot exceed 500 characters.');
    }

    if (!this.gradeId || this.gradeId.trim().length === 0) {
      errors.push('Grade ID is required.');
    }

    return errors;
  }
}

module.exports = Category;

