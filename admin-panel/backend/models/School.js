// School Model for Firestore
class School {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.branchName = data.branchName || '';
    this.code = data.code || '';
    this.board = data.board || '';
    this.address = data.address || '';
    this.city = data.city || '';
    this.state = data.state || '';
    this.phoneNumber = data.phoneNumber || '';
    this.email = data.email || '';
    this.schoolLogo = data.schoolLogo || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert Firestore document to School object
  static fromFirestore(doc) {
    const data = doc.data();
    return new School({
      id: doc.id,
      ...data,
    });
  }

  // Convert School object to Firestore document
  toFirestore() {
    return {
      name: this.name,
      branchName: this.branchName,
      code: this.code,
      board: this.board,
      address: this.address,
      city: this.city,
      state: this.state,
      phoneNumber: this.phoneNumber,
      email: this.email,
      schoolLogo: this.schoolLogo,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Validate school data
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('School name is required.');
    } else if (this.name.length > 200) {
      errors.push('School name cannot exceed 200 characters.');
    }

    if (!this.branchName || this.branchName.trim().length === 0) {
      errors.push('Branch name is required.');
    } else if (this.branchName.length > 100) {
      errors.push('Branch name cannot exceed 100 characters.');
    }

    if (!this.code || this.code.trim().length === 0) {
      errors.push('School code is required.');
    } else if (this.code.length > 20) {
      errors.push('Code cannot exceed 20 characters.');
    }

    if (!this.board || this.board.trim().length === 0) {
      errors.push('Board is required.');
    } else if (this.board.length > 50) {
      errors.push('Board cannot exceed 50 characters.');
    }

    if (!this.address || this.address.trim().length === 0) {
      errors.push('Address is required.');
    } else if (this.address.length > 300) {
      errors.push('Address cannot exceed 300 characters.');
    }

    if (!this.city || this.city.trim().length === 0) {
      errors.push('City is required.');
    } else if (this.city.length > 100) {
      errors.push('City cannot exceed 100 characters.');
    }

    if (!this.state || this.state.trim().length === 0) {
      errors.push('State is required.');
    } else if (this.state.length > 100) {
      errors.push('State cannot exceed 100 characters.');
    }

    if (!this.phoneNumber || this.phoneNumber.trim().length === 0) {
      errors.push('Phone number is required.');
    }

    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email is required.');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        errors.push('Email address is not valid.');
      }
    }

    return errors;
  }
}

module.exports = School;

