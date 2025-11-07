import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import './Categories.css';

const Categories = () => {
  // Mock data - replace with API call later
  const [categories, setCategories] = useState([
    { id: 3, name: 'PARAMITA CBSE CLASS 1', description: 'PARAMITA  CBSE CLASS 1  ', grade: 'CLASS 1' },
    { id: 4, name: 'PARAMITA CBSE CLASS 2', description: 'PARAMITA CBSE CLASS 2', grade: 'CLASS 2' },
    { id: 5, name: 'PARAMITA CBSE CLASS 3', description: 'PARAMITA CBSE CLASS 3', grade: 'CLASS 3' },
    { id: 6, name: 'PARAMITA CBSE CLASS 4', description: 'PARAMITA CBSE CLASS 4', grade: 'CLASS 4' },
    { id: 7, name: 'PARAMITA CBSE CLASS 5', description: 'PARAMITA CBSE CLASS 5', grade: 'CLASS 5' },
    { id: 8, name: 'PARAMITA CBSE CLASS 6', description: 'PARAMITA CBSE CLASS 6', grade: 'CLASS 6' },
    { id: 9, name: 'PARAMITA CBSE CLASS 7', description: 'PARAMITA CBSE CLASS 7', grade: 'CLASS 7' },
    { id: 10, name: 'PARAMITA CBSE CLASS 8', description: 'PARAMITA CBSE CLASS 8', grade: 'CLASS 8' },
    { id: 11, name: 'PARAMITA IIT CLASS 6', description: 'PARAMITA IIT CLASS 6', grade: 'CLASS 6' },
    { id: 12, name: 'PARAMITA IIT CLASS 7', description: 'PARAMITA IIT CLASS 7', grade: 'CLASS 7' },
  ]);

  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      // TODO: Call API to delete
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return categories;
    return categories.filter(item =>
      item.name.toLowerCase().includes(filterText.toLowerCase()) ||
      item.description.toLowerCase().includes(filterText.toLowerCase()) ||
      item.grade.toLowerCase().includes(filterText.toLowerCase())
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;

