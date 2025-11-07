import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './UpsertBook.css';

const UpsertBook = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('id');

  const [formData, setFormData] = useState({
    Id: bookId || '0',
    CoverImageUrl: '',
    Title: '',
    Author: '',
    Publisher: '',
    ISBN: '',
    Description: '',
    Price: '0.00',
    DiscountPrice: '',
    StockQuantity: '0',
    BookType: '',
    otherBookType: '',
    CategoryId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [showOtherBookType, setShowOtherBookType] = useState(false);

  // Category options - in production, fetch from API
  const categoryOptions = [
    { value: '3', label: 'PARAMITA CBSE CLASS 1' },
    { value: '4', label: 'PARAMITA CBSE CLASS 2' },
    { value: '5', label: 'PARAMITA CBSE CLASS 3' },
    { value: '6', label: 'PARAMITA CBSE CLASS 4' },
    { value: '7', label: 'PARAMITA CBSE CLASS 5' },
    { value: '8', label: 'PARAMITA CBSE CLASS 6' },
    { value: '9', label: 'PARAMITA CBSE CLASS 7' },
    { value: '10', label: 'PARAMITA CBSE CLASS 8' },
    { value: '11', label: 'PARAMITA IIT CLASS 6' },
    { value: '12', label: 'PARAMITA IIT CLASS 7' },
    { value: '13', label: 'PARAMITA IIT CLASS 8' },
    { value: '14', label: 'PARAMITA WORLD SCHOOL- CBSE CLASS 6-ALUGUNUR' },
    { value: '15', label: 'PARAMITA WORLD SCHOOL- CBSE CLASS 7-ALUGUNUR' },
    { value: '16', label: 'PARAMITA WORLD SCHOOL- CBSE CLASS 8-ALUGUNUR' },
    { value: '17', label: 'PARAMITA CBSE CLASS 9' },
    { value: '18', label: 'PARAMITA CBSE CLASS 9- LANGUAGE HINDI' },
    { value: '19', label: 'PARAMITA CBSE CLASS 10' },
    { value: '20', label: 'GRADE 10 CBSE LANGUAGE HINDI' },
    { value: '21', label: 'PARAMITA STATE BOARD CLASS  NURSERY' },
    { value: '22', label: 'PARAMITA STATE BOARD CLASS LKG' },
    { value: '23', label: 'PARAMITA STATE BOARD CLASS UKG' },
    { value: '24', label: 'PARAMITA STATE BOARD CLASS 1' },
    { value: '25', label: 'PARAMITA STATE BOARD CLASS 2' },
    { value: '26', label: 'PARAMITA STATE BOARD CLASS 3' },
    { value: '27', label: 'PARAMITA STATE BOARD CLASS 4' },
    { value: '28', label: 'PARAMITA STATE BOARD CLASS 5' },
    { value: '29', label: 'PARAMITA STATE BOARD CLASS 6' },
    { value: '30', label: 'PARAMITA STATE BOARD CLASS 7' },
    { value: '31', label: 'PARAMITA STATE BOARD CLASS 8' },
    { value: '35', label: 'PARAMITA STATE BOARD CLASS 6- IIT CAMPUS' },
    { value: '36', label: 'PARAMITA STATE BOARD CLASS 7- IIT CAMPUS' },
    { value: '37', label: 'PARAMITA STATE BOARD CLASS 8- IIT CAMPUS' },
    { value: '38', label: 'PARAMITA IIT CLASS-9 --  Bi  P C' },
    { value: '39', label: 'PARAMITA IIT CLASS-10 -- Bi P C' },
    { value: '40', label: 'PARAMITA IIT CLASS-9 -- M  P C' },
    { value: '41', label: 'PARAMITA IIT CLASS-10 -- M P C' },
    { value: '53', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR  CLASS -- NURSERY' },
    { value: '54', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR CLASS -- LKG-PP1' },
    { value: '55', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR CLASS -- UKG-PP2' },
    { value: '56', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR CLASS -- 1' },
    { value: '57', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR CLASS -- 2' },
    { value: '58', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR CLASS -- 3' },
    { value: '59', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR CLASS -- 4' },
    { value: '60', label: 'SIDDARTHA SCHOOLS -KARIMNAGAR CLASS -- 5' },
    { value: '61', label: 'PARAMITA IIT CLASS-9 -- Bi P C HINDI LANGUAGE' },
    { value: '62', label: 'PARAMITA IIT CLASS-10 -- Bi P C HINDI LANGUAGE' },
    { value: '63', label: 'PARAMITA IIT CLASS-9 -- M P C HINDI LANGUAGE' },
    { value: '64', label: 'PARAMITA IIT CLASS-10 -- M P C HINDI LANGUAGE' },
    { value: '65', label: 'PARAMITA WORLD SCHOOL- CBSE CLASS 9-ALUGUNUR' },
    { value: '66', label: 'PARAMITA WORLD SCHOOL- CBSE CLASS 10-ALUGUNUR' },
    { value: '67', label: 'PARAMITA WORLD SCHOOL- CBSE CLASS 9 HINDI LANGUAGE -ALUGUNUR' },
    { value: '68', label: 'PARAMITA WORLD SCHOOL- CBSE CLASS 10 HINDI LANGUAGE -ALUGUNUR' },
  ];

  const bookTypeOptions = [
    { value: 'TEXTBOOK', label: 'TEXTBOOK' },
    { value: 'NOTEBOOK', label: 'NOTEBOOK' },
    { value: 'STATIONARY', label: 'STATIONARY' },
    { value: 'UNIFORM', label: 'UNIFORM' },
    { value: 'OTHER', label: 'OTHER' },
  ];

  useEffect(() => {
    // If editing, fetch book data
    if (bookId) {
      // TODO: Fetch book data from API
      const fetchBook = async () => {
        try {
          // const response = await fetch(`/api/books/${bookId}`);
          // const data = await response.json();
          // setFormData(data);
          
          // Mock data for now
          console.log('Fetching book with id:', bookId);
        } catch (error) {
          console.error('Error fetching book:', error);
        }
      };
      fetchBook();
    }
  }, [bookId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle BookType change - show/hide otherBookType input
    if (name === 'BookType') {
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
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      // Optionally preview the image
      // const reader = new FileReader();
      // reader.onloadend = () => {
      //   setFormData(prev => ({ ...prev, CoverImageUrl: reader.result }));
      // };
      // reader.readAsDataURL(file);
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
    
    if (formData.DiscountPrice) {
      const discountPrice = parseFloat(formData.DiscountPrice);
      if (isNaN(discountPrice) || discountPrice < 0 || discountPrice > 99999) {
        newErrors.DiscountPrice = 'Discount price must be between 0 and 99999.';
      }
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
    
    if (!formData.CategoryId) {
      newErrors.CategoryId = 'Category ID is required.';
    }
    
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
      // Prepare form data for multipart/form-data
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'otherBookType') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Handle BookType - if OTHER, use otherBookType value
      if (formData.BookType === 'OTHER') {
        submitData.set('BookType', formData.otherBookType);
      }
      
      // Add file if selected
      if (coverImageFile) {
        submitData.append('file', coverImageFile);
      }
      
      // TODO: Call API to save book
      // const response = await fetch('/api/books', {
      //   method: bookId ? 'PUT' : 'POST',
      //   body: submitData,
      // });
      
      // if (response.ok) {
      //   navigate('/get-all-books');
      // }
      
      // Mock success for now
      console.log('Saving book:', Object.fromEntries(submitData));
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/get-all-books');
      }, 1000);
    } catch (error) {
      console.error('Error saving book:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <span>{bookId ? 'Edit Book' : 'Add New Book'}</span>
          <button
            type="button"
            className="btn btn-sm btn-light"
            onClick={() => navigate('/get-all-books')}
          >
            Back
          </button>
        </div>
        <div className="card-body">
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

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="Price">
                      Price <span className="text-danger">*</span>
                    </label>
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label" htmlFor="DiscountPrice">
                      DiscountPrice
                    </label>
                    <input
                      className={`form-control ${errors.DiscountPrice ? 'is-invalid' : ''}`}
                      type="text"
                      id="DiscountPrice"
                      name="DiscountPrice"
                      value={formData.DiscountPrice}
                      onChange={handleChange}
                    />
                    {errors.DiscountPrice && (
                      <span className="text-danger">{errors.DiscountPrice}</span>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label" htmlFor="StockQuantity">
                      StockQuantity <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${errors.StockQuantity ? 'is-invalid' : ''}`}
                      type="number"
                      id="StockQuantity"
                      name="StockQuantity"
                      min="0"
                      value={formData.StockQuantity}
                      onChange={handleChange}
                      required
                    />
                    {errors.StockQuantity && (
                      <span className="text-danger">{errors.StockQuantity}</span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="BookType">
                    BookType <span className="text-danger">*</span>
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
                  <label className="form-label" htmlFor="CategoryId">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-control ${errors.CategoryId ? 'is-invalid' : ''}`}
                    id="CategoryId"
                    name="CategoryId"
                    value={formData.CategoryId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.CategoryId && (
                    <span className="text-danger">{errors.CategoryId}</span>
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
                  />
                  {coverImageFile && (
                    <small className="form-text text-muted">
                      Selected: {coverImageFile.name}
                    </small>
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

