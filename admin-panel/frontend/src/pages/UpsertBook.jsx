import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { schoolsAPI, categoriesAPI, booksAPI, gradesAPI, subgradesAPI, uploadAPI } from '../services/api';
import './UpsertBook.css';




// disable wheel and arrow change for input fields
const preventWheelChange = (e) => {
  e.target.blur();
};
const preventArrowChange = (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
  }
};




const UpsertBook = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('id');
  const duplicateFromId = searchParams.get('duplicateFrom');

  const [formData, setFormData] = useState({
    Id: bookId || '0',
    ProductQuantity: '',
    PerProductPrice: '',
    CoverImageUrl: '',
    Title: '',
    Author: '',
    Publisher: '',
    ISBN: '',
    Description: '',
    Price: '0.00',
    StockQuantity: '0',
    BookType: '',
    otherBookType: '',
    SchoolId: '',
    GradeId: '',
    SubgradeId: '',
    CategoryId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [showOtherBookType, setShowOtherBookType] = useState(false);
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [subgrades, setSubgrades] = useState([]);
  const [loadingSubgrades, setLoadingSubgrades] = useState(false);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);

  const bookTypeOptions = [
    { value: 'TEXTBOOK', label: 'Mandatory Textbook' },
    { value: 'NOTEBOOK', label: 'Notebook' },
    { value: 'MANDATORY_NOTEBOOK', label: 'Mandatory Notebook' },
    { value: 'STATIONARY', label: 'Stationary' },
    { value: 'UNIFORM', label: 'Uniform' },
    { value: 'OPTIONAL_1', label: 'Optional 1' },
    { value: 'OPTIONAL_2', label: 'Optional 2' },
    { value: 'OPTIONAL_3', label: 'Optional 3' },
    { value: 'OPTIONAL_4', label: 'Optional 4' },
    { value: 'OTHER', label: 'Other' },
  ];

  // Load grades when school is selected
  const loadGradesForSchool = async (schoolId) => {
    try {
      setLoadingGrades(true);
      const response = await gradesAPI.getAll(schoolId);
      if (response.data.success) {
        setGrades(response.data.data || []);
      } else {
        setGrades([]);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      setGrades([]);
    } finally {
      setLoadingGrades(false);
    }
  };

  const loadSubgradesForGrade = async (gradeId) => {
    try {
      setLoadingSubgrades(true);
      const response = await subgradesAPI.getAll(gradeId);
      if (response.data.success) {
        setSubgrades(response.data.data || []);
      } else {
        setSubgrades([]);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      setSubgrades([]);
    } finally {
      setLoadingSubgrades(false);
    }
  };

  const loadCategoriesForGrade = async (gradeId) => {
    try {
      setLoadingCategories(true);
      const response = await categoriesAPI.getAll();
      if (response.data.success) {
        const allCategories = response.data.data || [];
        const filteredCategories = allCategories.filter(cat => cat.gradeId === gradeId);
        setCategories(filteredCategories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategoriesForSubgrade = async (subgradeId) => {
    try {
      setLoadingCategories(true);
      const response = await categoriesAPI.getAll(null, subgradeId);
      if (response.data.success) {
        setCategories(response.data.data || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    // Load schools on component mount
    const loadSchools = async () => {
      try {
        setLoadingSchools(true);
        const response = await schoolsAPI.getAll();
        if (response.data.success) {
          setSchools(response.data.data || []);
        }
      } catch (error) {
        console.error('Error loading schools:', error);
        alert('Failed to load schools. Please try again.');
      } finally {
        setLoadingSchools(false);
      }
    };

    loadSchools();

    // Source book: edit mode uses bookId, duplicate mode uses duplicateFromId
    const sourceBookId = bookId || duplicateFromId;
    const isDuplicateMode = !bookId && duplicateFromId;

    // If editing or duplicating, fetch book data
    if (sourceBookId) {
      const fetchBook = async () => {
        try {
          const response = await booksAPI.getById(sourceBookId);
          if (response.data.success) {
            const book = response.data.data;

            // If book has category, fetch school and grade from category
            let schoolId = '';
            let gradeId = '';
            if (book.categoryId) {
              try {
                const categoryResponse = await categoriesAPI.getById(book.categoryId);
                if (categoryResponse.data.success && categoryResponse.data.data.gradeId) {
                  gradeId = categoryResponse.data.data.gradeId;
                  const gradeResponse = await gradesAPI.getById(gradeId);
                  if (gradeResponse.data.success && gradeResponse.data.data.schoolId) {
                    schoolId = gradeResponse.data.data.schoolId;
                  }
                }
              } catch (error) {
                console.error('Error fetching category/grade:', error);
              }
            }

            schoolId = book.schoolId || schoolId;
            gradeId = book.gradeId || gradeId;
            const subgradeId = book.subgradeId || '';

            setFormData({
              Id: isDuplicateMode ? '0' : book.id,
              ProductQuantity: book.productQuantity || '',
              PerProductPrice: book.perProductPrice?.toString() || '',
              CoverImageUrl: book.coverImageUrl || '',
              Title: isDuplicateMode ? `${(book.title || '').trim()} (Copy)`.trim() : (book.title || ''),
              Author: book.author || '',
              Publisher: book.publisher || '',
              ISBN: isDuplicateMode ? '' : (book.isbn || ''),
              Description: book.description || '',
              Price: book.price?.toString() || '0.00',
              StockQuantity: isDuplicateMode ? '0' : (book.stockQuantity?.toString() || '0'),
              BookType: book.bookType || '',
              otherBookType: '',
              SchoolId: schoolId,
              GradeId: gradeId,
              SubgradeId: subgradeId,
              CategoryId: book.categoryId || '',
            });

            if (schoolId) loadGradesForSchool(schoolId);
            if (gradeId) loadSubgradesForGrade(gradeId);
            if (subgradeId) loadCategoriesForSubgrade(subgradeId);
            else if (gradeId) loadCategoriesForGrade(gradeId);
          }
        } catch (error) {
          console.error('Error fetching book:', error);
          alert('Failed to load book data. Please try again.');
        }
      };
      fetchBook();
    }
  }, [bookId, duplicateFromId]);

  // Refetch current stock from database (updated after each order)
  const refreshStockFromDb = async () => {
    if (!bookId) return;
    try {
      setIsRefreshingStock(true);
      const response = await booksAPI.getById(bookId);
      if (response.data.success && response.data.data) {
        const book = response.data.data;
        const currentStock = book.stockQuantity !== undefined && book.stockQuantity !== null
          ? String(book.stockQuantity)
          : '0';
        setFormData((prev) => ({ ...prev, StockQuantity: currentStock }));
      }
    } catch (error) {
      console.error('Error refreshing stock:', error);
      alert('Failed to refresh stock. Please try again.');
    } finally {
      setIsRefreshingStock(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'SchoolId') {
      setFormData(prev => ({
        ...prev,
        SchoolId: value,
        GradeId: '',
        SubgradeId: '',
        CategoryId: '',
      }));
      setGrades([]);
      setSubgrades([]);
      setCategories([]);
      if (value) loadGradesForSchool(value);
    } else if (name === 'GradeId') {
      setFormData(prev => ({
        ...prev,
        GradeId: value,
        SubgradeId: '',
        CategoryId: '',
      }));
      setSubgrades([]);
      setCategories([]);
      if (value) {
        loadSubgradesForGrade(value);
        loadCategoriesForGrade(value);
      }
    } else if (name === 'SubgradeId') {
      setFormData(prev => ({
        ...prev,
        SubgradeId: value,
        CategoryId: '',
      }));
      if (value) {
        loadCategoriesForSubgrade(value);
      } else if (formData.GradeId) {
        loadCategoriesForGrade(formData.GradeId);
      } else {
        setCategories([]);
      }
    }
    // Handle BookType change - show/hide otherBookType input
    else if (name === 'BookType') {
      setShowOtherBookType(value === 'OTHER');
      if (value !== 'OTHER') {
        setFormData(prev => ({
          ...prev,
          BookType: value,
          otherBookType: ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          BookType: value
        }));
      }
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        // Auto-fill Total Price when Product Quantity or Per Product Price changes
        if (name === 'ProductQuantity' || name === 'PerProductPrice') {
          const qty = name === 'ProductQuantity' ? value : prev.ProductQuantity;
          const perPrice = name === 'PerProductPrice' ? value : prev.PerProductPrice;
          const qtyNum = parseFloat(qty);
          const perPriceNum = parseFloat(perPrice);
          if (!isNaN(qtyNum) && !isNaN(perPriceNum) && qtyNum >= 0 && perPriceNum >= 0) {
            const total = qtyNum * perPriceNum;
            next.Price = total.toFixed(2);
          }
        }
        return next;
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      // Upload image immediately when selected
      uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      const response = await uploadAPI.uploadImage(file);
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          CoverImageUrl: response.data.url,
        }));
      } else {
        alert('Failed to upload image: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.Title.trim()) {
      newErrors.Title = 'Title is required.';
    } else if (formData.Title.length > 200) {
      newErrors.Title = 'Title cannot exceed 200 characters.';
    }
    
    if (!formData.Author.trim()) {
      newErrors.Author = 'Author is required.';
    } else if (formData.Author.length > 100) {
      newErrors.Author = 'Author cannot exceed 100 characters.';
    }
    
    if (formData.Publisher && formData.Publisher.length > 100) {
      newErrors.Publisher = 'Publisher name cannot exceed 100 characters.';
    }
    
    if (!formData.ISBN.trim()) {
      newErrors.ISBN = 'ISBN is required.';
    } else if (formData.ISBN.length > 20) {
      newErrors.ISBN = 'ISBN cannot exceed 20 characters.';
    }
    
    if (formData.Description && formData.Description.length > 1000) {
      newErrors.Description = 'Description cannot exceed 1000 characters.';
    }
    
    const price = parseFloat(formData.Price);
    if (!formData.Price || isNaN(price)) {
      newErrors.Price = 'The Price field is required.';
    } else if (price < 0 || price > 99999) {
      newErrors.Price = 'Price must be between 0 and 99999.';
    }
    
    const stockQuantity = parseInt(formData.StockQuantity);
    if (formData.StockQuantity === '' || isNaN(stockQuantity)) {
      newErrors.StockQuantity = 'The StockQuantity field is required.';
    } else if (stockQuantity < 0) {
      newErrors.StockQuantity = 'Stock quantity must be 0 or more.';
    }
    
    if (!formData.BookType) {
      newErrors.BookType = 'Book Type is required.';
    } else if (formData.BookType === 'OTHER' && !formData.otherBookType.trim()) {
      newErrors.otherBookType = 'Please specify the book type.';
    }
    
    if (!formData.SchoolId) {
      newErrors.SchoolId = 'School is required.';
    }
    
    if (!formData.GradeId) {
      newErrors.GradeId = 'Grade is required.';
    }
    
    // Category is optional
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare JSON data (file uploads will be handled separately if needed)
      const submitData = {
        Title: formData.Title,
        Author: formData.Author,
        Publisher: formData.Publisher || '',
        ISBN: formData.ISBN,
        Description: formData.Description || '',
        Price: parseFloat(formData.Price) || 0,
        DiscountPrice: null, // Always set to null - discount price field removed
        StockQuantity: parseInt(formData.StockQuantity) || 0,
        CoverImageUrl: formData.CoverImageUrl || '',
        BookType: formData.BookType === 'OTHER' ? formData.otherBookType : formData.BookType,
        CategoryId: formData.CategoryId,
        GradeId: formData.GradeId,
        SubgradeId: formData.SubgradeId || '',
        SchoolId: formData.SchoolId,

        // ⭐ Additional fields for product quantity and per product price
        ProductQuantity: formData.ProductQuantity || '',
        PerProductPrice: formData.PerProductPrice ? parseFloat(formData.PerProductPrice) : null,
      };
      
      // Call API to save book
      let response;
      if (formData.Id === '0') {
        response = await booksAPI.create(submitData);
      } else {
        response = await booksAPI.update(formData.Id, submitData);
      }

      if (response.data.success) {
        alert(bookId ? 'Book updated successfully' : 'Book created successfully');
        navigate('/get-all-books');
      } else {
        // Show validation errors if available
        const errorMessage = response.data.errors 
          ? response.data.errors.join('\n')
          : response.data.message || 'Failed to save book';
        alert(errorMessage);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error saving book:', error);
      
      // Show detailed error message
      let errorMessage = 'Failed to save book. Please try again.';
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join('\n');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      alert(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <span>{bookId ? 'Edit Book' : duplicateFromId ? 'Add New Book (from duplicate)' : 'Add New Book'}</span>
          <button
            type="button"
            className="btn btn-sm btn-light"
            onClick={() => navigate('/get-all-books')}
          >
            Back
          </button>
        </div>
        <div className="card-body">
          {duplicateFromId && (
            <div className="alert alert-info mb-3" role="alert">
              <strong>Creating a duplicate.</strong> This form was pre-filled from an existing product. Change only the fields you need (e.g. Title, ISBN) and save to create a new product. Stock is set to 0 for the new product.
            </div>
          )}
          <div className="row justify-content-center">
            <div className="col-lg-7 border border-2 py-4 px-4">
              <form id="submit-form" onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
                <input
                  type="hidden"
                  id="Id"
                  name="Id"
                  value={formData.Id}
                />
                <input
                  type="hidden"
                  id="CoverImageUrl"
                  name="CoverImageUrl"
                  value={formData.CoverImageUrl}
                />

                <div className="mb-3">
                  <label className="form-label" htmlFor="Title">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Title ? 'is-invalid' : ''}`}
                    type="text"
                    id="Title"
                    name="Title"
                    maxLength="200"
                    value={formData.Title}
                    onChange={handleChange}
                    required
                  />

                  {errors.Title && (
                    <span className="text-danger">{errors.Title}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="Author">
                    Author <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Author ? 'is-invalid' : ''}`}
                    type="text"
                    id="Author"
                    name="Author"
                    maxLength="100"
                    value={formData.Author}
                    onChange={handleChange}
                    required
                  />
                  {errors.Author && (
                    <span className="text-danger">{errors.Author}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="Publisher">
                    Publisher
                  </label>
                  <input
                    className={`form-control ${errors.Publisher ? 'is-invalid' : ''}`}
                    type="text"
                    id="Publisher"
                    name="Publisher"
                    maxLength="100"
                    value={formData.Publisher}
                    onChange={handleChange}
                  />
                  {errors.Publisher && (
                    <span className="text-danger">{errors.Publisher}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="ISBN">
                    ISBN <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.ISBN ? 'is-invalid' : ''}`}
                    type="text"
                    id="ISBN"
                    name="ISBN"
                    maxLength="20"
                    value={formData.ISBN}
                    onChange={handleChange}
                    required
                  />
                  {errors.ISBN && (
                    <span className="text-danger">{errors.ISBN}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="Description">
                    Description
                  </label>
                  <textarea
                    className={`form-control ${errors.Description ? 'is-invalid' : ''}`}
                    rows="3"
                    id="Description"
                    name="Description"
                    maxLength="1000"
                    value={formData.Description}
                    onChange={handleChange}
                  />
                  {errors.Description && (
                    <span className="text-danger">{errors.Description}</span>
                  )}
                </div>

                {/* Product Quantity */}
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label" htmlFor="ProductQuantity">
                      Product Quantity
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      id="ProductQuantity"
                      name="ProductQuantity"
                      value={formData.ProductQuantity || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Per Product Price */}
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label" htmlFor="PerProductPrice">
                      Per Product Price
                    </label>
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      onWheel={preventWheelChange}
                      id="PerProductPrice"
                      name="PerProductPrice"
                      value={formData.PerProductPrice || ""}
                      onChange={handleChange}
                      onKeyDown={preventArrowChange}
                    />
                  </div>
                </div>

                {/* Total Price (auto-calculated from Product Quantity × Per Product Price) */}
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label" htmlFor="Price">
                      Total Price <span className="text-danger">*</span>
                    </label>
                    <small className="text-muted d-block mb-1">
                      Auto-filled from Product Quantity × Per Product Price. You can override if needed.
                    </small>
                    <input
                      className={`form-control ${errors.Price ? 'is-invalid' : ''}`}
                      type="text"
                      id="Price"
                      name="Price"
                      value={formData.Price}
                      onChange={handleChange}
                      required
                    />
                    {errors.Price && (
                      <span className="text-danger">{errors.Price}</span>
                    )}
                  </div>
                </div>

                {/* Additional fields for product quantity and price ends here */}

                <div className="row">
                  <div className="col-md-12 mb-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                      <label className="form-label mb-0" htmlFor="StockQuantity">
                        Stock Quantity <span className="text-danger">*</span>
                      </label>
                      {bookId && (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={refreshStockFromDb}
                          disabled={isRefreshingStock}
                        >
                          {isRefreshingStock ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Refreshing…
                            </>
                          ) : (
                            <>↻ Refresh stock from database</>
                          )}
                        </button>
                      )}
                    </div>
                    <small className="text-muted d-block mb-1">
                      Stock is updated in the database after each order. {bookId ? 'Use “Refresh stock” to load the current value.' : ''}
                    </small>
                    <input
                      className={`form-control ${errors.StockQuantity ? 'is-invalid' : ''}`}
                      type="number"
                      id="StockQuantity"
                      name="StockQuantity"
                      min="0"
                      value={formData.StockQuantity}
                      onChange={handleChange}
                      onWheel={preventWheelChange}
                      onKeyDown={preventArrowChange}
                      required
                    />
                    {errors.StockQuantity && (
                      <span className="text-danger">{errors.StockQuantity}</span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="BookType">
                    Product Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-control ${errors.BookType ? 'is-invalid' : ''}`}
                    id="bookTypeSelect"
                    name="BookType"
                    value={formData.BookType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Book Type --</option>
                    {bookTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.BookType && (
                    <span className="text-danger">{errors.BookType}</span>
                  )}
                </div>

                {showOtherBookType && (
                  <div className="mb-3" id="otherBookTypeDiv">
                    <label htmlFor="otherBookType" className="form-label">
                      Specify Other Book Type <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="otherBookType"
                      name="otherBookType"
                      className={`form-control ${errors.otherBookType ? 'is-invalid' : ''}`}
                      placeholder="Enter custom book type"
                      value={formData.otherBookType}
                      onChange={handleChange}
                    />
                    {errors.otherBookType && (
                      <span className="text-danger">{errors.otherBookType}</span>
                    )}
                    <small className="form-text text-muted">Please specify the book type</small>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label" htmlFor="SchoolId">
                    School <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-control ${errors.SchoolId ? 'is-invalid' : ''}`}
                    id="SchoolId"
                    name="SchoolId"
                    value={formData.SchoolId}
                    onChange={handleChange}
                    required
                    disabled={loadingSchools}
                  >
                    <option value="">-- Select School --</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.branchName 
                          ? `${school.name} - ${school.branchName}`
                          : school.name}
                      </option>
                    ))}
                  </select>
                  {loadingSchools && (
                    <small className="form-text text-muted">Loading schools...</small>
                  )}
                  {errors.SchoolId && (
                    <span className="text-danger">{errors.SchoolId}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="GradeId">
                    Grade <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-control ${errors.GradeId ? 'is-invalid' : ''}`}
                    id="GradeId"
                    name="GradeId"
                    value={formData.GradeId}
                    onChange={handleChange}
                    required
                    disabled={!formData.SchoolId || loadingGrades}
                  >
                    <option value="">
                      {!formData.SchoolId 
                        ? '-- Select School First --'
                        : loadingGrades 
                        ? 'Loading grades...'
                        : grades.length === 0
                        ? 'No grades found for this school'
                        : '-- Select Grade --'}
                    </option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                  {loadingGrades && (
                    <small className="form-text text-muted">Loading grades...</small>
                  )}
                  {errors.GradeId && (
                    <span className="text-danger">{errors.GradeId}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="SubgradeId">
                    Section (optional)
                  </label>
                  <select
                    className="form-control"
                    id="SubgradeId"
                    name="SubgradeId"
                    value={formData.SubgradeId}
                    onChange={handleChange}
                    disabled={!formData.GradeId || loadingSubgrades}
                  >
                    <option value="">
                      {!formData.GradeId
                        ? '-- Select Grade First --'
                        : loadingSubgrades
                        ? 'Loading sections...'
                        : '-- Select Section (optional) --'}
                    </option>
                    {subgrades.map(sg => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="CategoryId">
                    Category (optional)
                  </label>
                  <select
                    className="form-control"
                    id="CategoryId"
                    name="CategoryId"
                    value={formData.CategoryId}
                    onChange={handleChange}
                    disabled={(!formData.GradeId && !formData.SubgradeId) || loadingCategories}
                  >
                    <option value="">
                      {!formData.GradeId 
                        ? '-- Select Grade First --'
                        : loadingCategories 
                        ? 'Loading categories...'
                        : categories.length === 0
                        ? 'No categories found'
                        : '-- Select Category (optional) --'}
                    </option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {loadingCategories && (
                    <small className="form-text text-muted">Loading categories...</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Cover Image</label>
                  <input
                    type="file"
                    name="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <small className="form-text text-info">
                      Uploading image...
                    </small>
                  )}
                  {coverImageFile && !uploadingImage && (
                    <small className="form-text text-success">
                      ✓ Image uploaded: {coverImageFile.name}
                    </small>
                  )}
                  {formData.CoverImageUrl && (
                    <div className="mt-2">
                      <img 
                        src={formData.CoverImageUrl} 
                        alt="Cover preview" 
                        style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsertBook;

