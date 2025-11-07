// Customer Model for Firestore (based on AppUser)
class Customer {
  constructor(data) {
    this.id = data.id || null;
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.parentFullName = data.parentFullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : '');
    this.email = data.email || '';
    this.phoneNumber = data.phoneNumber || '';
    this.dateOfBirth = data.dateOfBirth || null;
    this.schoolName = data.schoolName || '';
    this.classStandard = data.classStandard || '';
    this.address = data.address || '';
    this.city = data.city || '';
    this.state = data.state || '';
    this.postalCode = data.postalCode || '';
    this.country = data.country || '';
    this.createdAt = data.createdAt || new Date();
  }

  // Convert Firestore document to Customer object
  static fromFirestore(doc) {
    const data = doc.data();
    
    // Convert Firestore Timestamp to ISO string for createdAt
    let createdAt = data.createdAt;
    if (createdAt && createdAt.toDate) {
      createdAt = createdAt.toDate().toISOString();
    } else if (createdAt && createdAt._seconds) {
      createdAt = new Date(createdAt._seconds * 1000).toISOString();
    } else if (createdAt) {
      createdAt = new Date(createdAt).toISOString();
    }
    
    const customer = new Customer({
      id: doc.id,
      ...data,
      createdAt: createdAt,
    });
    
    // Ensure parentFullName is set
    if (!customer.parentFullName && (customer.firstName || customer.lastName)) {
      customer.parentFullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
    }
    
    return customer;
  }

  // Convert Customer object to Firestore document
  toFirestore() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      parentFullName: this.parentFullName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      dateOfBirth: this.dateOfBirth,
      schoolName: this.schoolName,
      classStandard: this.classStandard,
      address: this.address,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Customer;

