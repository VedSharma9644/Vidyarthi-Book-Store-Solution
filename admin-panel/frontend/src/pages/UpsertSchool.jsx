import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { schoolsAPI } from '../services/api';
import './UpsertSchool.css';

const UpsertSchool = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('id');

  const [formData, setFormData] = useState({
    Id: schoolId || '0',
    SchoolLogo: '',
    Name: '',
    BranchName: '',
    Code: '',
    Board: '',
    Address: '',
    City: '',
    State: '',
    PhoneNumber: '',
    Email: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    // If editing, fetch school data
    if (schoolId) {
      const fetchSchool = async () => {
        try {
          const response = await schoolsAPI.getById(schoolId);
          if (response.data.success) {
            const school = response.data.data;
            setFormData({
              Id: school.id,
              SchoolLogo: school.schoolLogo || '',
              Name: school.name || '',
              BranchName: school.branchName || '',
              Code: school.code || '',
              Board: school.board || '',
              Address: school.address || '',
              City: school.city || '',
              State: school.state || '',
              PhoneNumber: school.phoneNumber || '',
              Email: school.email || '',
            });
          }
        } catch (error) {
          console.error('Error fetching school:', error);
          alert('Failed to load school data. Please try again.');
        }
      };
      fetchSchool();
    }
  }, [schoolId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      setLogoFile(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.Name.trim()) {
      newErrors.Name = 'School name is required.';
    } else if (formData.Name.length > 200) {
      newErrors.Name = 'School name cannot exceed 200 characters.';
    }
    
    if (!formData.BranchName.trim()) {
      newErrors.BranchName = 'Branch name is required.';
    } else if (formData.BranchName.length > 100) {
      newErrors.BranchName = 'Branch name cannot exceed 100 characters.';
    }
    
    if (!formData.Code.trim()) {
      newErrors.Code = 'School code is required.';
    } else if (formData.Code.length > 20) {
      newErrors.Code = 'Code cannot exceed 20 characters.';
    }
    
    if (!formData.Board.trim()) {
      newErrors.Board = 'Board is required.';
    } else if (formData.Board.length > 50) {
      newErrors.Board = 'Board cannot exceed 50 characters.';
    }
    
    if (!formData.Address.trim()) {
      newErrors.Address = 'Address is required.';
    } else if (formData.Address.length > 300) {
      newErrors.Address = 'Address cannot exceed 300 characters.';
    }
    
    if (!formData.City.trim()) {
      newErrors.City = 'City is required.';
    } else if (formData.City.length > 100) {
      newErrors.City = 'City cannot exceed 100 characters.';
    }
    
    if (!formData.State.trim()) {
      newErrors.State = 'State is required.';
    } else if (formData.State.length > 100) {
      newErrors.State = 'State cannot exceed 100 characters.';
    }
    
    if (!formData.PhoneNumber.trim()) {
      newErrors.PhoneNumber = 'The PhoneNumber field is required.';
    } else {
      // Basic phone validation
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(formData.PhoneNumber.replace(/\s/g, ''))) {
        newErrors.PhoneNumber = 'Phone number is not valid.';
      }
    }
    
    if (!formData.Email.trim()) {
      newErrors.Email = 'The Email field is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email)) {
        newErrors.Email = 'Email address is not valid.';
      }
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
      // Prepare data for API
      const submitData = {
        name: formData.Name,
        branchName: formData.BranchName,
        code: formData.Code,
        board: formData.Board,
        address: formData.Address,
        city: formData.City,
        state: formData.State,
        phoneNumber: formData.PhoneNumber,
        email: formData.Email,
        schoolLogo: formData.SchoolLogo,
      };

      let response;
      if (schoolId) {
        // Update existing school
        response = await schoolsAPI.update(schoolId, submitData);
      } else {
        // Create new school
        response = await schoolsAPI.create(submitData);
      }

      if (response.data.success) {
        alert(schoolId ? 'School updated successfully!' : 'School created successfully!');
        navigate('/get-all-schools');
      } else {
        alert(response.data.message || 'Failed to save school');
        if (response.data.errors && Array.isArray(response.data.errors)) {
          const apiErrors = {};
          response.data.errors.forEach(err => {
            // Parse error messages and set to appropriate field
            if (err.toLowerCase().includes('name')) apiErrors.Name = err;
            else if (err.toLowerCase().includes('branch')) apiErrors.BranchName = err;
            else if (err.toLowerCase().includes('code')) apiErrors.Code = err;
            else if (err.toLowerCase().includes('board')) apiErrors.Board = err;
            else if (err.toLowerCase().includes('address')) apiErrors.Address = err;
            else if (err.toLowerCase().includes('city')) apiErrors.City = err;
            else if (err.toLowerCase().includes('state')) apiErrors.State = err;
            else if (err.toLowerCase().includes('phone')) apiErrors.PhoneNumber = err;
            else if (err.toLowerCase().includes('email')) apiErrors.Email = err;
          });
          setErrors(apiErrors);
        }
      }
    } catch (error) {
      console.error('Error saving school:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          // Parse error messages and set to appropriate field
          if (err.toLowerCase().includes('name')) apiErrors.Name = err;
          else if (err.toLowerCase().includes('branch')) apiErrors.BranchName = err;
          else if (err.toLowerCase().includes('code')) apiErrors.Code = err;
          else if (err.toLowerCase().includes('board')) apiErrors.Board = err;
          else if (err.toLowerCase().includes('address')) apiErrors.Address = err;
          else if (err.toLowerCase().includes('city')) apiErrors.City = err;
          else if (err.toLowerCase().includes('state')) apiErrors.State = err;
          else if (err.toLowerCase().includes('phone')) apiErrors.PhoneNumber = err;
          else if (err.toLowerCase().includes('email')) apiErrors.Email = err;
        });
        setErrors(apiErrors);
      }
      alert(error.response?.data?.message || 'Failed to save school. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">School Details</h5>
        </div>
        <div className="card-body">
          <div className="row justify-content-center">
            <div className="col-lg-6 border border-2 py-4 px-4">
              <form id="submit-form" onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
                <input
                  type="hidden"
                  data-val="true"
                  data-val-required="The Id field is required."
                  id="Id"
                  name="Id"
                  value={formData.Id}
                />
                <input
                  type="hidden"
                  className="form-control"
                  data-val="true"
                  data-val-url="School logo URL is not valid."
                  id="SchoolLogo"
                  name="SchoolLogo"
                  value={formData.SchoolLogo}
                />

                <div className="mb-3">
                  <label className="form-label" htmlFor="Name">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Name ? 'is-invalid' : ''}`}
                    type="text"
                    data-val="true"
                    data-val-length="School name cannot exceed 200 characters."
                    data-val-length-max="200"
                    data-val-required="School name is required."
                    id="Name"
                    maxLength="200"
                    name="Name"
                    value={formData.Name}
                    onChange={handleChange}
                    required
                  />
                  {errors.Name && (
                    <span className="text-danger">{errors.Name}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="BranchName">
                    BranchName <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.BranchName ? 'is-invalid' : ''}`}
                    type="text"
                    data-val="true"
                    data-val-length="Branch name cannot exceed 100 characters."
                    data-val-length-max="100"
                    data-val-required="Branch name is required."
                    id="BranchName"
                    maxLength="100"
                    name="BranchName"
                    value={formData.BranchName}
                    onChange={handleChange}
                    required
                  />
                  {errors.BranchName && (
                    <span className="text-danger">{errors.BranchName}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="Code">
                    Code <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Code ? 'is-invalid' : ''}`}
                    type="text"
                    data-val="true"
                    data-val-length="Code cannot exceed 20 characters."
                    data-val-length-max="20"
                    data-val-required="School code is required."
                    id="Code"
                    maxLength="20"
                    name="Code"
                    value={formData.Code}
                    onChange={handleChange}
                    required
                  />
                  {errors.Code && (
                    <span className="text-danger">{errors.Code}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="Board">
                    Board <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Board ? 'is-invalid' : ''}`}
                    type="text"
                    data-val="true"
                    data-val-length="Board cannot exceed 50 characters."
                    data-val-length-max="50"
                    data-val-required="Board is required."
                    id="Board"
                    maxLength="50"
                    name="Board"
                    value={formData.Board}
                    onChange={handleChange}
                    required
                  />
                  {errors.Board && (
                    <span className="text-danger">{errors.Board}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="Address">
                    Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.Address ? 'is-invalid' : ''}`}
                    rows="2"
                    data-val="true"
                    data-val-length="Address cannot exceed 300 characters."
                    data-val-length-max="300"
                    data-val-required="Address is required."
                    id="Address"
                    maxLength="300"
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                    required
                  />
                  {errors.Address && (
                    <span className="text-danger">{errors.Address}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="City">
                    City <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.City ? 'is-invalid' : ''}`}
                    type="text"
                    data-val="true"
                    data-val-length="City cannot exceed 100 characters."
                    data-val-length-max="100"
                    data-val-required="City is required."
                    id="City"
                    maxLength="100"
                    name="City"
                    value={formData.City}
                    onChange={handleChange}
                    required
                  />
                  {errors.City && (
                    <span className="text-danger">{errors.City}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="State">
                    State <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.State ? 'is-invalid' : ''}`}
                    type="text"
                    data-val="true"
                    data-val-length="State cannot exceed 100 characters."
                    data-val-length-max="100"
                    data-val-required="State is required."
                    id="State"
                    maxLength="100"
                    name="State"
                    value={formData.State}
                    onChange={handleChange}
                    required
                  />
                  {errors.State && (
                    <span className="text-danger">{errors.State}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="PhoneNumber">
                    PhoneNumber <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.PhoneNumber ? 'is-invalid' : ''}`}
                    type="tel"
                    data-val="true"
                    data-val-phone="Phone number is not valid."
                    data-val-required="The PhoneNumber field is required."
                    id="PhoneNumber"
                    name="PhoneNumber"
                    value={formData.PhoneNumber}
                    onChange={handleChange}
                    required
                  />
                  {errors.PhoneNumber && (
                    <span className="text-danger">{errors.PhoneNumber}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="Email">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Email ? 'is-invalid' : ''}`}
                    type="email"
                    data-val="true"
                    data-val-email="Email address is not valid."
                    data-val-required="The Email field is required."
                    id="Email"
                    name="Email"
                    value={formData.Email}
                    onChange={handleChange}
                    required
                  />
                  {errors.Email && (
                    <span className="text-danger">{errors.Email}</span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="row">
                    <div className="col-lg-6">
                      <label className="form-label" htmlFor="SchoolLogo">
                        Logo URL
                      </label>
                      <input
                        type="file"
                        name="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {logoFile && (
                        <small className="form-text text-muted">
                          Selected: {logoFile.name}
                        </small>
                      )}
                    </div>
                    <div className="col-lg-6">
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : schoolId ? 'Update' : 'Create'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsertSchool;


