import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { subgradesAPI, gradesAPI } from '../services/api';
import './Grades.css';

const Subgrades = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const gradeId = location.state?.gradeId || new URLSearchParams(location.search).get('gradeId');
  const gradeName = location.state?.gradeName || '';

  const [subgrades, setSubgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubgrade, setEditingSubgrade] = useState(null);
  const [formData, setFormData] = useState({
    Id: '0',
    GradeId: gradeId || '',
    Name: '',
    DisplayOrder: 0,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (gradeId) {
      setFormData(prev => ({ ...prev, GradeId: gradeId }));
      loadSubgrades();
    } else {
      setLoading(false);
    }
  }, [gradeId]);

  const loadSubgrades = async () => {
    if (!gradeId) return;
    try {
      setLoading(true);
      const response = await subgradesAPI.getAll(gradeId);
      if (response.data.success) {
        setSubgrades(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading subgrades:', error);
      alert('Failed to load sections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingSubgrade(null);
    setFormData({
      Id: '0',
      GradeId: gradeId,
      Name: '',
      DisplayOrder: subgrades.length,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (row) => {
    setEditingSubgrade(row);
    setFormData({
      Id: row.id,
      GradeId: row.gradeId || gradeId,
      Name: row.name || '',
      DisplayOrder: row.displayOrder !== undefined ? row.displayOrder : 0,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSubgrade(null);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'DisplayOrder' ? (value === '' ? 0 : parseInt(value, 10) || 0) : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.Name?.trim()) newErrors.Name = 'Section name is required.';
    if (!formData.GradeId) newErrors.GradeId = 'Grade is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        gradeId: formData.GradeId,
        name: formData.Name.trim(),
        displayOrder: formData.DisplayOrder,
        isActive: true,
      };
      if (formData.Id === '0') {
        const response = await subgradesAPI.create(payload);
        if (response.data.success) {
          await loadSubgrades();
          alert('Section created successfully');
          handleCloseModal();
        } else {
          alert(response.data.message || 'Failed to create section');
        }
      } else {
        const response = await subgradesAPI.update(formData.Id, payload);
        if (response.data.success) {
          await loadSubgrades();
          alert('Section updated successfully');
          handleCloseModal();
        } else {
          alert(response.data.message || 'Failed to update section');
        }
      }
    } catch (error) {
      console.error('Error saving subgrade:', error);
      alert('Failed to save section. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      const response = await subgradesAPI.delete(id);
      if (response.data.success) {
        setSubgrades(prev => prev.filter(s => s.id !== id));
        alert('Section deleted successfully');
      } else {
        alert(response.data.message || 'Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting subgrade:', error);
      alert('Failed to delete section. Please try again.');
    }
  };

  const columns = [
    { name: 'Name', selector: row => row.name, sortable: true, wrap: true },
    { name: 'Order', selector: row => row.displayOrder, sortable: true, width: '100px' },
    {
      name: 'Actions',
      cell: (row) => (
        <div>
          <button type="button" className="btn btn-sm btn-primary me-1" onClick={() => handleEdit(row)}>
            <i className="bi bi-pencil-square"></i> Edit
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(row.id)}>
            <i className="bi bi-trash"></i> Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      width: '200px',
    },
  ];

  const customStyles = {
    headRow: { style: { backgroundColor: '#36b9cc', color: '#fff', fontWeight: 600 } },
    headCells: { style: { fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05rem' } },
    cells: { style: { fontSize: '0.875rem' } },
  };

  if (!gradeId) {
    return (
      <div className="container-fluid">
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="mb-3">No grade selected. Please choose a grade to manage its sections.</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/get-all-grades')}>
              Back to Grades
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="header d-flex justify-content-between align-items-center">
        <h1 className="header-title">Sections – {gradeName || 'Grade'}</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <span>Sections (Subgrades)</span>
              <div>
                <button type="button" className="btn btn-sm btn-light me-2" onClick={() => navigate('/get-all-grades')}>
                  Back to Grades
                </button>
                <button type="button" className="btn btn-sm btn-warning" onClick={handleAddNew}>
                  Add Section
                </button>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                  <p className="mt-2">Loading sections...</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={subgrades}
                  pagination
                  persistTableHead
                  highlightOnHover
                  striped
                  customStyles={customStyles}
                  paginationPerPage={10}
                  noDataComponent="No sections found. Add a section for this grade."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop show" onClick={handleCloseModal}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1" onClick={e => e.stopPropagation()}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content">
                <div className="card">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{editingSubgrade ? 'Edit Section' : 'Add Section'}</h5>
                    <button type="button" className="btn btn-light btn-sm" onClick={handleCloseModal}><i className="bi bi-x-lg"></i></button>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit} noValidate>
                      <input type="hidden" name="Id" value={formData.Id} />
                      <input type="hidden" name="GradeId" value={formData.GradeId} />
                      <div className="mb-3">
                        <label className="form-label" htmlFor="Name">Section Name <span className="text-danger">*</span></label>
                        <input
                          className={`form-control ${errors.Name ? 'is-invalid' : ''}`}
                          type="text"
                          id="Name"
                          name="Name"
                          value={formData.Name}
                          onChange={handleChange}
                          placeholder="e.g. English, Hindi"
                        />
                        {errors.Name && <span className="text-danger">{errors.Name}</span>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="DisplayOrder">Display Order</label>
                        <input
                          className="form-control"
                          type="number"
                          id="DisplayOrder"
                          name="DisplayOrder"
                          value={formData.DisplayOrder}
                          onChange={handleChange}
                          min={0}
                        />
                      </div>
                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </form>
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

export default Subgrades;
