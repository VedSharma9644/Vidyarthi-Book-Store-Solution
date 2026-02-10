// Book Model for Firestore
class Book {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.author = data.author || '';
    this.publisher = data.publisher || '';
    this.isbn = data.isbn || '';
    this.description = data.description || '';
    this.price = data.price !== undefined ? parseFloat(data.price) : 0;
    
    this.productQuantity = data.productQuantity || '';
    this.perProductPrice = data.perProductPrice !== undefined ? parseFloat(data.perProductPrice) : null;

    this.discountPrice = data.discountPrice !== undefined ? parseFloat(data.discountPrice) : null;
    this.stockQuantity = data.stockQuantity !== undefined ? parseInt(data.stockQuantity) : 0;
    this.coverImageUrl = data.coverImageUrl || '';
    this.bookType = data.bookType || '';
    this.publicationDate = data.publicationDate || new Date();
    this.isFeatured = data.isFeatured !== undefined ? data.isFeatured : false;
    this.categoryId = data.categoryId || '';
    this.gradeId = data.gradeId || '';
    this.subgradeId = data.subgradeId || '';
    this.schoolId = data.schoolId || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert Firestore document to Book object
  static fromFirestore(doc) {
    const data = doc.data();
    return new Book({
      id: doc.id,
      ...data,
    });
  }

  // Convert Book object to Firestore document
  toFirestore() {
    const data = {
      title: this.title,
      author: this.author,
      publisher: this.publisher,
      isbn: this.isbn,
      description: this.description,
      price: this.price,
      productQuantity: this.productQuantity,
      perProductPrice: this.perProductPrice,
      stockQuantity: this.stockQuantity,
      coverImageUrl: this.coverImageUrl,
      bookType: this.bookType,
      publicationDate: this.publicationDate,
      isFeatured: this.isFeatured,
      categoryId: this.categoryId,
      gradeId: this.gradeId,
      subgradeId: this.subgradeId,
      schoolId: this.schoolId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    // Only include discountPrice if it's not null
    if (this.discountPrice !== null && this.discountPrice !== undefined) {
      data.discountPrice = this.discountPrice;
    }

    return data;
  }

  // Validate book data
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required.');
    } else if (this.title.length > 200) {
      errors.push('Title cannot exceed 200 characters.');
    }

    if (!this.author || this.author.trim().length === 0) {
      errors.push('Author is required.');
    } else if (this.author.length > 100) {
      errors.push('Author cannot exceed 100 characters.');
    }

    if (this.publisher && this.publisher.length > 100) {
      errors.push('Publisher name cannot exceed 100 characters.');
    }

    if (!this.isbn || this.isbn.trim().length === 0) {
      errors.push('ISBN is required.');
    } else if (this.isbn.length > 20) {
      errors.push('ISBN cannot exceed 20 characters.');
    }

    if (this.description && this.description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters.');
    }

    if (this.price === undefined || this.price === null || isNaN(this.price)) {
      errors.push('Price is required.');
    } else if (this.price < 0 || this.price > 99999) {
      errors.push('Price must be between 0 and 99999.');
    }

    // if (this.discountPrice !== null && this.discountPrice !== undefined) {
    //   if (isNaN(this.discountPrice) || this.discountPrice < 0 || this.discountPrice > 99999) {
    //     errors.push('Discount price must be between 0 and 99999.');
    //   }
    // }

    if (this.stockQuantity === undefined || this.stockQuantity === null || isNaN(this.stockQuantity)) {
      errors.push('Stock quantity is required.');
    } else if (this.stockQuantity < 0) {
      errors.push('Stock quantity must be 0 or more.');
    }

    if (this.coverImageUrl && this.coverImageUrl.length > 500) {
      errors.push('Cover image URL cannot exceed 500 characters.');
    }

    if (!this.bookType || this.bookType.trim().length === 0) {
      errors.push('Book type is required.');
    } else if (this.bookType.length > 50) {
      errors.push('Book type cannot exceed 50 characters.');
    }

    // Category is optional

    return errors;
  }
}

module.exports = Book;

