import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { categoriesAPI, gradesAPI, subgradesAPI } from '../services/api';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await categoriesAPI.getAll();
        if (response.data.success) {
          const categoriesData = response.data.data || [];
          
          const [gradesResponse, subgradesResponse] = await Promise.all([
            gradesAPI.getAll(),
            subgradesAPI.getAll(),
          ]);
          const gradesMap = new Map();
          if (gradesResponse.data.success) {
            gradesResponse.data.data.forEach(grade => {
              gradesMap.set(grade.id, grade.name);
            });
          }
          const subgradesMap = new Map();
          if (subgradesResponse.data.success) {
            subgradesResponse.data.data.forEach(sg => {
              subgradesMap.set(sg.id, sg.name);
            });
          }
          
          const transformedCategories = categoriesData.map((category) => {
            const gradeName = category.gradeId ? (gradesMap.get(category.gradeId) || 'Unknown Grade') : 'No Grade';
            const subgradeName = category.subgradeId ? (subgradesMap.get(category.subgradeId) || '—') : '—';
            return {
              id: category.id,
              name: category.name,
              description: category.description || '',
              grade: gradeName,
              gradeId: category.gradeId,
              subgrade: subgradeName,
              subgradeId: category.subgradeId,
            };
          });
          
          setCategories(transformedCategories);
        } else {
          console.error('Failed to load categories:', response.data.message);
          alert('Failed to load categories. Please try again.');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        alert('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await categoriesAPI.delete(id);
        if (response.data.success) {
          // Remove from local state
          setCategories(categories.filter(cat => cat.id !== id));
          alert('Category deleted successfully');
        } else {
          alert(response.data.message || 'Failed to delete category');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return categories;
    return categories.filter(item =>
      item.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(filterText.toLowerCase()) ||
      item.grade.toLowerCase().includes(filterText.toLowerCase()) ||
      (item.subgrade || '').toLowerCase().includes(filterText.toLowerCase())
    );
  }, [categories, filterText]);

  const subHeaderComponentMemo = useMemo(() => {
    const handleClear = () => {
      if (filterText) {
        setResetPaginationToggle(!resetPaginationToggle);
        setFilterText('');
      }
    };

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
      name: 'Category Name',
      selector: row => row.name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Description',
      selector: row => row.description,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Grade',
      selector: row => row.grade,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Section',
      selector: row => row.subgrade,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div>
          <Link
            to={`/upsert-category?id=${row.id}`}
            className="btn btn-sm btn-primary me-1"
          >
            <i className="bi bi-pencil-square"></i> Edit
          </Link>
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
        backgroundColor: '#4e73df',
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
        <h1 className="header-title">Manage Languages</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <span>Categories</span>
              <Link to="/upsert-category" className="btn btn-dark btn-sm">
                Add New
              </Link>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading categories...</p>
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
                  noDataComponent="No categories found"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;

