import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { schoolsAPI, gradesAPI, subgradesAPI, categoriesAPI } from '../services/api';
import './UpsertCategory.css';

const UpsertCategory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('id');

  const [formData, setFormData] = useState({
    Id: categoryId || '0',
    Name: '',
    Description: '',
    SchoolId: '',
    GradeId: '',
    SubgradeId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [subgrades, setSubgrades] = useState([]);
  const [loadingSubgrades, setLoadingSubgrades] = useState(false);

  useEffect(() => {
    // Fetch schools on component mount
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

    // If editing, fetch category data
    if (categoryId) {
      // TODO: Fetch category data from API
      // For now, using mock data
      const fetchCategory = async () => {
        try {
          // const response = await fetch(`/api/categories/${categoryId}`);
          // const data = await response.json();
          // setFormData(data);
          
          // Mock data for now
          console.log('Fetching category with id:', categoryId);
        } catch (error) {
          console.error('Error fetching category:', error);
        }
      };
      fetchCategory();
    }
  }, [categoryId]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'SchoolId') {
      setFormData(prev => ({ ...prev, SchoolId: value, GradeId: '', SubgradeId: '' }));
      setGrades([]);
      setSubgrades([]);
      if (value) await loadGradesForSchool(value);
    } else if (name === 'GradeId') {
      setFormData(prev => ({ ...prev, GradeId: value, SubgradeId: '' }));
      setSubgrades([]);
      if (value) await loadSubgradesForGrade(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const loadGradesForSchool = async (schoolId) => {
    try {
      setLoadingGrades(true);
      const response = await gradesAPI.getAll(schoolId);
      if (response.data.success) {
        setGrades(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      alert('Failed to load grades. Please try again.');
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

  const validate = () => {
    const newErrors = {};
    
    if (!formData.Name.trim()) {
      newErrors.Name = 'Category Name is Required';
    }
    
    if (!formData.SchoolId) {
      newErrors.SchoolId = 'School is Required';
    }
    
    if (!formData.GradeId) {
      newErrors.GradeId = 'Grade is Required';
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
      // Prepare data for API (convert field names to match backend expectations)
      const categoryData = {
        name: formData.Name,
        description: formData.Description || '',
        gradeId: formData.GradeId,
        subgradeId: formData.SubgradeId || undefined,
      };

      let response;
      if (categoryId && categoryId !== '0') {
        // Update existing category
        response = await categoriesAPI.update(categoryId, categoryData);
      } else {
        // Create new category
        response = await categoriesAPI.create(categoryData);
      }

      if (response.data && response.data.success) {
        alert(categoryId && categoryId !== '0' ? 'Category updated successfully' : 'Category created successfully');
        navigate('/get-all-categories');
      } else {
        const errorMsg = response.data?.message || response.data?.error || 'Failed to save category';
        alert(errorMsg);
        if (response.data?.errors) {
          console.error('Validation errors:', response.data.errors);
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save category. Please try again.';
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <span>{categoryId ? 'Edit Category' : 'Add New Category'}</span>
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => navigate('/get-all-categories')}
          >
            Back
          </button>
        </div>
        <div className="card-body">
          <div className="row justify-content-center">
            <div className="col-lg-6 border border-2 py-4 px-4">
              <form id="submit-form" onSubmit={handleSubmit} noValidate>
                <input
                  type="hidden"
                  id="Id"
                  name="Id"
                  value={formData.Id}
                />

                <div className="mb-3">
                  <label className="form-label" htmlFor="Name">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Name ? 'is-invalid' : ''}`}
                    type="text"
                    id="Name"
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
                  <label className="form-label" htmlFor="Description">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    id="Description"
                    name="Description"
                    value={formData.Description}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="SchoolId">
                    School <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.SchoolId ? 'is-invalid' : ''}`}
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
                        {school.name} {school.branchName ? `- ${school.branchName}` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingSchools && (
                    <small className="text-muted">Loading schools...</small>
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
                    className={`form-select ${errors.GradeId ? 'is-invalid' : ''}`}
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
                        : '-- Select Grade --'}
                    </option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                  {loadingGrades && (
                    <small className="text-muted">Loading grades...</small>
                  )}
                  {!formData.SchoolId && (
                    <small className="text-muted">Please select a school first</small>
                  )}
                  {formData.SchoolId && grades.length === 0 && !loadingGrades && (
                    <small className="text-warning">No grades found for this school</small>
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
                    className="form-select"
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

                <button
                  type="submit"
                  className="btn btn-primary"
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

export default UpsertCategory;

