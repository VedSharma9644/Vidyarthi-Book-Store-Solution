import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './UpsertCategory.css';

const UpsertCategory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('id');

  const [formData, setFormData] = useState({
    Id: categoryId || '0',
    Name: '',
    Description: '',
    GradeId: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grade options - in production, fetch from API
  const gradeOptions = [
    { value: '3', label: 'CLASS 1 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '4', label: 'CLASS 2 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '5', label: 'CLASS 3 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '6', label: 'CLASS 4 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '7', label: 'CLASS 5 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '8', label: 'CLASS 6 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '9', label: 'CLASS 7 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '10', label: 'CLASS 8 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '11', label: 'CLASS 9 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '12', label: 'CLASS 10 - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '13', label: 'CLASS 6 -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '14', label: 'CLASS 7 -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '15', label: 'CLASS 8 -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '31', label: 'NURSERY - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '32', label: 'LKG - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '33', label: 'UKG - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '34', label: 'CLASS 1 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '36', label: 'CLASS 2 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '37', label: 'CLASS 3 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '38', label: 'CLASS 4 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '39', label: 'CLASS 5 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '40', label: 'CLASS 6 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '41', label: 'CLASS 7 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '42', label: 'CLASS 8 - PARAMITA HIGH SCHOOL-MANKAMMA THOTA' },
    { value: '51', label: 'CLASS 6 - PARAMITA HERITAGE CAMPUS-ALUGUNUR-CBSE' },
    { value: '52', label: 'CLASS 7 - PARAMITA HERITAGE CAMPUS-ALUGUNUR-CBSE' },
    { value: '53', label: 'CLASS 8 - PARAMITA HERITAGE CAMPUS-ALUGUNUR-CBSE' },
    { value: '54', label: 'CLASS 9 - PARAMITA HERITAGE CAMPUS-ALUGUNUR-CBSE' },
    { value: '55', label: 'CLASS 10 - PARAMITA HERITAGE CAMPUS-ALUGUNUR-CBSE' },
    { value: '58', label: 'CLASS 9 Bi P C -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '60', label: 'CLASS 10 Bi P C -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '61', label: 'GRADE 9 CBSE LANGUAGE HINDI - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '62', label: 'GRADE 10 CBSE LANGUAGE HINDI - PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { value: '63', label: 'PARAMITA IIT CLASS 9 M.P.C -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '67', label: 'CLASS 6-IIT CAMPUS - PARAMITA HIGH SCHOOL-MANKAMMA THOTA- IIT CAMPUS' },
    { value: '68', label: 'CLASS 7-IIT CAMPUS - PARAMITA HIGH SCHOOL-MANKAMMA THOTA- IIT CAMPUS' },
    { value: '69', label: 'CLASS 8-IIT CAMPUS - PARAMITA HIGH SCHOOL-MANKAMMA THOTA- IIT CAMPUS' },
    { value: '70', label: 'PARAMITA IIT CLASS 10 M.P.C -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '80', label: 'NURSERY - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '81', label: 'LKG -PP1 - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '82', label: 'UKG -PP2 - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '83', label: 'CLASS 1 - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '84', label: 'CLASS 2 - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '85', label: 'CLASS 3 - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '86', label: 'CLASS 4 - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '87', label: 'CLASS 5 - SIDDARTHA HIGH SCHOOL-MANKAMMA THOTA & VIDYANAGAR & BHAGATHNAGAR (KARIMNAGAR)' },
    { value: '92', label: 'CLASS 9 Bi P C -HINDI LANGUAGE -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '93', label: 'CLASS 10 Bi P C -HINDI LANGUAGE -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '94', label: 'CLASS 9 M P C -HINDI LANGUAGE -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '95', label: 'CLASS 10 M P C -HINDI LANGUAGE -  PARAMITA PINNACLE CAMPUS-PADMANAGAR-IIT' },
    { value: '96', label: 'GRADE 9 CBSE LANGUAGE HINDI - PARAMITA HERITAGE CAMPUS-ALUGUNUR-CBSE' },
    { value: '97', label: 'GRADE 10 CBSE LANGUAGE HINDI - PARAMITA HERITAGE CAMPUS-ALUGUNUR-CBSE' },
  ];

  useEffect(() => {
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

  const validate = () => {
    const newErrors = {};
    
    if (!formData.Name.trim()) {
      newErrors.Name = 'Category Name is Required';
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
      // TODO: Call API to save category
      // const response = await fetch('/api/categories', {
      //   method: categoryId ? 'PUT' : 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });
      
      // if (response.ok) {
      //   navigate('/get-all-categories');
      // }
      
      // Mock success for now
      console.log('Saving category:', formData);
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/get-all-categories');
      }, 1000);
    } catch (error) {
      console.error('Error saving category:', error);
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
                  >
                    <option value="">-- Select Grade --</option>
                    {gradeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.GradeId && (
                    <span className="text-danger">{errors.GradeId}</span>
                  )}
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

