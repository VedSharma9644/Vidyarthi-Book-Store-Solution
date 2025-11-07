import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './UpsertGrade.css';

const UpsertGrade = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gradeId = searchParams.get('id');

  const [formData, setFormData] = useState({
    Id: gradeId || '0',
    Name: '',
    SchoolId: '',
  });

  const [schools, setSchools] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock schools data - replace with API call later
  const mockSchools = [
    { id: 1, name: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 2, name: 'BLOOMING MINDS-KORUTLA-CBSE' },
    { id: 3, name: 'SRI CHAITANYA-JAGTIAL-STATE' },
  ];

  useEffect(() => {
    // Load schools
    const loadSchools = async () => {
      try {
        setLoading(true);
        // TODO: Fetch schools from API
        // const response = await fetch('/api/schools');
        // const data = await response.json();
        // setSchools(data);
        
        // Using mock data for now
        setSchools(mockSchools);
      } catch (error) {
        console.error('Error loading schools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSchools();

    // If editing, fetch grade data
    if (gradeId) {
      const fetchGrade = async () => {
        try {
          // TODO: Fetch grade data from API
          // const response = await fetch(`/api/grades/${gradeId}`);
          // const data = await response.json();
          // setFormData({
          //   Id: data.id.toString(),
          //   Name: data.name,
          //   SchoolId: data.schoolId.toString(),
          // });
          
          // Mock data for now
          const mockGrade = {
            id: gradeId,
            name: `CLASS ${gradeId}`,
            schoolId: 1,
          };
          setFormData({
            Id: mockGrade.id.toString(),
            Name: mockGrade.name,
            SchoolId: mockGrade.schoolId.toString(),
          });
        } catch (error) {
          console.error('Error fetching grade:', error);
        }
      };
      fetchGrade();
    }
  }, [gradeId]);

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
      newErrors.Name = 'Grade Name is required.';
    }
    
    if (!formData.SchoolId) {
      newErrors.SchoolId = 'Please select a school.';
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
      // TODO: Call API to save grade
      // const response = await fetch('/api/grades', {
      //   method: gradeId ? 'PUT' : 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     Id: parseInt(formData.Id),
      //     Name: formData.Name,
      //     SchoolId: parseInt(formData.SchoolId),
      //   }),
      // });
      
      // if (response.ok) {
      //   navigate('/get-all-grades');
      // }
      
      // Mock success for now
      console.log('Saving grade:', formData);
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/get-all-grades');
      }, 1000);
    } catch (error) {
      console.error('Error saving grade:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">{gradeId ? 'Edit Grade' : 'Add Grade'}</h5>
        </div>
        <div className="card-body">
          <div className="row justify-content-center">
            <div className="col-lg-6 border border-2 py-4 px-4">
              <form id="submit-form" onSubmit={handleSubmit} noValidate>
                <input
                  type="hidden"
                  data-val="true"
                  data-val-required="The Id field is required."
                  id="Id"
                  name="Id"
                  value={formData.Id}
                />

                <div className="mb-3">
                  <label className="form-label" htmlFor="Name">
                    Grade Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${errors.Name ? 'is-invalid' : ''}`}
                    type="text"
                    data-val="true"
                    data-val-required="Grade Name is required"
                    id="Name"
                    name="Name"
                    value={formData.Name}
                    onChange={handleChange}
                    placeholder="Enter grade name (e.g., CLASS 1, Grade 1)"
                    required
                  />
                  {errors.Name && (
                    <span className="text-danger">{errors.Name}</span>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="SchoolId">
                    School <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-control ${errors.SchoolId ? 'is-invalid' : ''}`}
                    data-val="true"
                    data-val-required="Please select a school."
                    id="SchoolId"
                    name="SchoolId"
                    value={formData.SchoolId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select School --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  {errors.SchoolId && (
                    <span className="text-danger">{errors.SchoolId}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? 'Saving...' : gradeId ? 'Update' : 'Create'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsertGrade;

