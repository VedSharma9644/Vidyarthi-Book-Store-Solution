import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { schoolsAPI } from '../services/api';
import './Schools.css';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await schoolsAPI.getAll();
      if (response.data.success) {
        // Transform data to match frontend format
        const transformedSchools = response.data.data.map(school => ({
          id: school.id,
          schoolName: school.name,
          branch: school.branchName,
          code: school.code,
          email: school.email,
          city: school.city,
        }));
        setSchools(transformedSchools);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      alert('Failed to load schools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        const response = await schoolsAPI.delete(id);
        if (response.data.success) {
          setSchools(schools.filter(school => school.id !== id));
          alert('School deleted successfully');
        } else {
          alert(response.data.message || 'Failed to delete school');
        }
      } catch (error) {
        console.error('Error deleting school:', error);
        alert('Failed to delete school. Please try again.');
      }
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return schools;
    return schools.filter(item =>
      item.schoolName.toLowerCase().includes(filterText.toLowerCase()) ||
      item.branch.toLowerCase().includes(filterText.toLowerCase()) ||
      item.code.toLowerCase().includes(filterText.toLowerCase()) ||
      item.email.toLowerCase().includes(filterText.toLowerCase()) ||
      item.city.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [schools, filterText]);

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
      name: 'School Name',
      selector: row => row.schoolName,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Branch',
      selector: row => row.branch,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Code',
      selector: row => row.code,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      wrap: true,
    },
    {
      name: 'City',
      selector: row => row.city,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div>
          <Link
            to={`/upsert-school?id=${row.id}`}
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
        <h1 className="header-title">Manage Schools</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <span>Schools</span>
              <Link to="/upsert-school" className="btn btn-primary btn-sm">
                Add New
              </Link>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
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
                  noDataComponent="No schools found"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schools;

