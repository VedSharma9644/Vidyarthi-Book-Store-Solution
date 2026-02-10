import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { booksAPI } from '../services/api';
import './Books.css';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [threshold] = useState(5);

  useEffect(() => {
    loadLowInventory();
  }, [threshold]);

  const loadLowInventory = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getLowInventory(threshold);
      if (response.data.success && response.data.data) {
        setItems(response.data.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading low inventory:', error);
      alert('Failed to load inventory. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return items;
    const searchLower = filterText.toLowerCase().trim();
    return items.filter(
      (row) =>
        (row.title && row.title.toLowerCase().includes(searchLower)) ||
        (row.gradeName && row.gradeName.toLowerCase().includes(searchLower)) ||
        (row.schoolName && row.schoolName.toLowerCase().includes(searchLower)) ||
        (row.bookType && row.bookType.toLowerCase().includes(searchLower)) ||
        String(row.ordersLeft).includes(filterText.trim()) ||
        String(row.stockQuantity).includes(filterText.trim())
    );
  }, [items, filterText]);

  const subHeaderComponentMemo = useMemo(
    () => (
      <div className="dataTables_filter">
        <label>
          Search:
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder=""
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ marginLeft: '0.5rem', display: 'inline-block', width: 'auto' }}
          />
        </label>
      </div>
    ),
    [filterText, resetPaginationToggle]
  );

  const columns = [
    {
      name: 'Product / Bundle',
      selector: (row) => row.title,
      sortable: true,
      wrap: true,
      cell: (row) => (
        <div>
          <div className="fw-semibold">{row.title || 'N/A'}</div>
          {row.author && <small className="text-muted">{row.author}</small>}
        </div>
      ),
    },
    {
      name: 'Book Type',
      selector: (row) => row.bookType,
      sortable: true,
      width: '110px',
    },
    {
      name: 'Grade',
      selector: (row) => row.gradeName,
      sortable: true,
      width: '120px',
    },
    {
      name: 'School',
      selector: (row) => row.schoolName,
      sortable: true,
      wrap: true,
      width: '180px',
    },
    {
      name: 'Stock (units)',
      selector: (row) => row.stockQuantity,
      sortable: true,
      width: '110px',
      cell: (row) => (
        <span className={row.stockQuantity === 0 ? 'text-danger fw-bold' : ''}>
          {row.stockQuantity}
        </span>
      ),
    },
    {
      name: 'Units per bundle',
      selector: (row) => row.productQuantity,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Orders left',
      selector: (row) => row.ordersLeft,
      sortable: true,
      width: '110px',
      cell: (row) => (
        <span
          className={
            row.ordersLeft === 0
              ? 'text-danger fw-bold'
              : row.ordersLeft < 3
                ? 'text-warning fw-semibold'
                : ''
          }
        >
          {row.ordersLeft}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Link to={`/upsert-book?id=${row.id}`} className="btn btn-sm btn-primary">
          <i className="bi bi-pencil-square"></i> Edit
        </Link>
      ),
      ignoreRowClick: true,
      width: '100px',
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
        <h1 className="header-title">Inventory (Low Stock)</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <span>Bundles with less than {threshold} orders left</span>
              <button type="button" className="btn btn-light btn-sm" onClick={loadLowInventory}>
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                <strong>Orders left</strong> = how many full bundles can still be ordered (
                floor(stock ÷ units per bundle). Only products from all schools and grades with
                fewer than {threshold} orders left are listed here.
              </p>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading inventory...</p>
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
                  noDataComponent="No low-inventory items found"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
