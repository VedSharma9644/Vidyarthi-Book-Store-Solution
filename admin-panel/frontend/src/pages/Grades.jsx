import { useState, useMemo, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { schoolsAPI, gradesAPI } from '../services/api';
import './Grades.css';

const Grades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    Id: '0',
    Name: '',
    SchoolId: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      // First load schools, then load grades (grades need schools for display)
      try {
        setLoadingSchools(true);
        const schoolsResponse = await schoolsAPI.getAll();
        if (schoolsResponse.data.success) {
          const schoolsData = schoolsResponse.data.data || [];
          setSchools(schoolsData);
          
          // Now load grades with school data available
          setLoading(true);
          const gradesResponse = await gradesAPI.getAll();
          if (gradesResponse.data.success) {
            const gradesData = gradesResponse.data.data || [];
            
            // Create a map of schools for quick lookup
            const schoolsMap = new Map();
            schoolsData.forEach(school => {
              schoolsMap.set(school.id, school);
            });
            
            // Transform grades to include school name for display
            const transformedGrades = gradesData.map((grade) => {
              let schoolName = 'Unknown School';
              if (grade.schoolId) {
                const school = schoolsMap.get(grade.schoolId);
                if (school) {
                  schoolName = school.branchName 
                    ? `${school.name} - ${school.branchName}`
                    : school.name;
                }
              }
              
              return {
                id: grade.id,
                name: grade.name,
                school: schoolName,
                schoolId: grade.schoolId,
              };
            });
            
            setGrades(transformedGrades);
          } else {
            console.error('Failed to load grades:', gradesResponse.data.message);
            alert('Failed to load grades. Please try again.');
          }
        } else {
          console.error('Failed to load schools:', schoolsResponse.data.message);
          alert('Failed to load schools. Please try again.');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please try again.');
      } finally {
        setLoadingSchools(false);
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        const response = await gradesAPI.delete(id);
        if (response.data.success) {
          // Remove from local state
          setGrades(grades.filter(grade => grade.id !== id));
          alert('Grade deleted successfully');
        } else {
          alert(response.data.message || 'Failed to delete grade');
        }
      } catch (error) {
        console.error('Error deleting grade:', error);
        alert('Failed to delete grade. Please try again.');
      }
    }
  };

  const handleAddNew = () => {
    setEditingGrade(null);
    setFormData({
      Id: '0',
      Name: '',
      SchoolId: '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      Id: grade.id.toString(),
      Name: grade.name,
      SchoolId: grade.schoolId ? grade.schoolId.toString() : '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGrade(null);
    setFormData({
      Id: '0',
      Name: '',
      SchoolId: '',
    });
    setErrors({});
  };

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
      newErrors.SchoolId = 'The SchoolId field is required.';
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
      const gradeData = {
        name: formData.Name.trim(),
        schoolId: formData.SchoolId,
        displayOrder: 0,
        isActive: true,
      };

      let response;
      if (formData.Id === '0') {
        // Create new grade
        response = await gradesAPI.create(gradeData);
      } else {
        // Update existing grade
        response = await gradesAPI.update(formData.Id, gradeData);
      }

      if (response.data.success) {
        // Reload grades to get updated data with school names
        const gradesResponse = await gradesAPI.getAll();
        if (gradesResponse.data.success) {
          const gradesData = gradesResponse.data.data || [];
          
          // Create a map of schools for quick lookup
          const schoolsMap = new Map();
          schools.forEach(school => {
            schoolsMap.set(school.id, school);
          });
          
          // Transform grades to include school name for display
          const transformedGrades = gradesData.map((grade) => {
            let schoolName = 'Unknown School';
            if (grade.schoolId) {
              const school = schoolsMap.get(grade.schoolId);
              if (school) {
                schoolName = school.branchName 
                  ? `${school.name} - ${school.branchName}`
                  : school.name;
              }
            }
            
            return {
              id: grade.id,
              name: grade.name,
              school: schoolName,
              schoolId: grade.schoolId,
            };
          });
          
          setGrades(transformedGrades);
        }
        
        alert(formData.Id === '0' ? 'Grade created successfully' : 'Grade updated successfully');
        handleCloseModal();
      } else {
        alert(response.data.message || 'Failed to save grade');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Failed to save grade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return grades;
    return grades.filter(item =>
      item.name.toLowerCase().includes(filterText.toLowerCase()) ||
      item.school.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [grades, filterText]);

  const subHeaderComponentMemo = useMemo(() => {
    return (
      <div className="dataTables_filter">
        <label>
          Search:
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder=""
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ marginLeft: '0.5rem', display: 'inline-block', width: 'auto' }}
          />
        </label>
      </div>
    );
  }, [filterText, resetPaginationToggle]);

  const columns = [
    {
      name: '#',
      selector: row => row.id,
      sortable: true,
      width: '80px',
    },
    {
      name: 'Grade Name',
      selector: row => row.name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'School',
      selector: row => row.school,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div>
          <button
            type="button"
            className="btn btn-sm btn-primary me-1"
            onClick={() => handleEdit(row)}
          >
            <i className="bi bi-pencil-square"></i> Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => handleDelete(row.id)}
          >
            <i className="bi bi-trash"></i> Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '200px',
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#36b9cc',
        color: '#fff',
        fontWeight: 600,
      },
    },
    headCells: {
      style: {
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05rem',
      },
    },
    cells: {
      style: {
        fontSize: '0.875rem',
      },
    },
  };

  return (
    <div className="container-fluid">
      <div className="header d-flex justify-content-between align-items-center">
        <h1 className="header-title">Manage Grades</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <span>Grades</span>
              <button
                type="button"
                className="btn btn-sm btn-warning"
                onClick={handleAddNew}
              >
                Add New
              </button>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading grades...</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredItems}
                  pagination
                  paginationResetDefaultPage={resetPaginationToggle}
                  subHeader
                  subHeaderComponent={subHeaderComponentMemo}
                  persistTableHead
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[10, 25, 50, 100]}
                  noDataComponent="No grades found"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop show" onClick={handleCloseModal}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="card">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{editingGrade ? 'Edit Grade' : 'Add Grade'}</h5>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={handleCloseModal}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="row justify-content-center">
                      <div className="col-lg-5 border border-2 py-2">
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
                              placeholder="Enter grade name"
                            />
                            {errors.Name && (
                              <span className="text-danger">{errors.Name}</span>
                            )}
                          </div>

                          <div className="mb-3">
                            <label className="form-label" htmlFor="SchoolId">
                              Select School <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-control ${errors.SchoolId ? 'is-invalid' : ''}`}
                              data-val="true"
                              data-val-required="The SchoolId field is required."
                              id="SchoolId"
                              name="SchoolId"
                              value={formData.SchoolId}
                              onChange={handleChange}
                              disabled={loadingSchools}
                              required
                            >
                              <option value="">
                                {loadingSchools ? 'Loading schools...' : '-- Select School --'}
                              </option>
                              {schools.map((school) => (
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

                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleCloseModal}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Grades;

