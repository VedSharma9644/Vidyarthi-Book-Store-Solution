import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { booksAPI, categoriesAPI, schoolsAPI, gradesAPI, subgradesAPI } from '../services/api';
import './Books.css';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Fetch all books
      const booksResponse = await booksAPI.getAll();
      
      if (booksResponse.data.success && booksResponse.data.data) {
        // Fetch related data for display
        const [categoriesResponse, schoolsResponse, gradesResponse, subgradesResponse] = await Promise.all([
          categoriesAPI.getAll(),
          schoolsAPI.getAll(),
          gradesAPI.getAll(),
          subgradesAPI.getAll(),
        ]);

        const categoriesMap = {};
        if (categoriesResponse.data.success && categoriesResponse.data.data) {
          categoriesResponse.data.data.forEach(cat => {
            categoriesMap[cat.id] = cat.name;
          });
        }

        const schoolsMap = {};
        if (schoolsResponse.data.success && schoolsResponse.data.data) {
          schoolsResponse.data.data.forEach(school => {
            schoolsMap[school.id] = school.name + (school.branchName ? ` - ${school.branchName}` : '');
          });
        }

        const gradesMap = {};
        if (gradesResponse.data.success && gradesResponse.data.data) {
          gradesResponse.data.data.forEach(grade => {
            gradesMap[grade.id] = grade.name;
          });
        }

        const subgradesMap = {};
        if (subgradesResponse.data.success && subgradesResponse.data.data) {
          subgradesResponse.data.data.forEach(sg => {
            subgradesMap[sg.id] = sg.name;
          });
        }

        const transformedBooks = booksResponse.data.data.map(book => {
          const stock = book.stockQuantity !== undefined && book.stockQuantity !== null ? Number(book.stockQuantity) : 0;
          const unitsPerBundle = book.productQuantity ? Number(book.productQuantity) : 1;
          const availableBundles = unitsPerBundle > 0 ? Math.floor(stock / unitsPerBundle) : 0;
          return {
            id: book.id,
            title: book.title || 'N/A',
            author: book.author || 'N/A',
            isbn: book.isbn || 'N/A',
            price: book.price ? `₹${parseFloat(book.price).toFixed(2)}` : '₹0.00',
            stock,
            unitsPerBundle,
            availableBundles,
            bookType: book.bookType || 'N/A',
            categoryName: book.categoryId ? (categoriesMap[book.categoryId] || 'N/A') : 'N/A',
            gradeName: book.gradeId ? (gradesMap[book.gradeId] || 'N/A') : 'N/A',
            subgradeName: book.subgradeId ? (subgradesMap[book.subgradeId] || '—') : '—',
            schoolName: book.schoolId ? (schoolsMap[book.schoolId] || 'N/A') : 'N/A',
          };
        });

        setBooks(transformedBooks);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error('Error loading books:', error);
      alert('Failed to load books. Please try again.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const response = await booksAPI.delete(id);
        if (response.data && response.data.success) {
          alert('Book deleted successfully');
          // Reload books
          await initializeData();
        } else {
          const errorMsg = response.data?.message || response.data?.error || 'Failed to delete book';
          alert(errorMsg);
          console.error('Delete response:', response.data);
        }
      } catch (error) {
        console.error('Error deleting book:', error);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to delete book. Please try again.';
        alert(errorMsg);
      }
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return books;
    const searchLower = filterText.toLowerCase().trim();
    const searchNum = filterText.trim();
    return books.filter(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.bookType.toLowerCase().includes(searchLower) ||
      item.schoolName.toLowerCase().includes(searchLower) ||
      item.gradeName.toLowerCase().includes(searchLower) ||
      (item.subgradeName || '').toLowerCase().includes(searchLower) ||
      item.categoryName.toLowerCase().includes(searchLower) ||
      String(item.stock).includes(searchNum)
    );
  }, [books, filterText]);

  const handleSelectedRowsChange = ({ selectedRows }) => {
    setSelectedRows(selectedRows);
  };

  const handleApplyBulkAction = async () => {
    if (!bulkAction || selectedRows.length === 0) return;

    if (bulkAction === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${selectedRows.length} selected product(s)?`
      );
      if (!confirmDelete) return;

      try {
        setIsBulkProcessing(true);
        for (const row of selectedRows) {
          await booksAPI.delete(row.id);
        }
        await initializeData();
        setSelectedRows([]);
        setBulkAction('');
        setClearSelectedRows(prev => !prev);
        alert('Selected products deleted successfully.');
      } catch (error) {
        console.error('Error during bulk delete:', error);
        alert('Failed to delete one or more products. Please try again.');
      } finally {
        setIsBulkProcessing(false);
      }
    }
  };

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
      name: 'Title',
      selector: row => row.title,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Price',
      selector: row => row.price,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Available Qty (Inventory)',
      selector: row => row.availableBundles ?? Math.floor(row.stock / (row.unitsPerBundle || 1)),
      sortable: true,
      width: '160px',
      cell: (row) => {
        const stock = row.stock;
        const unitsPerBundle = row.unitsPerBundle || 1;
        const availableBundles = row.availableBundles ?? Math.floor(stock / unitsPerBundle);
        const isOutOfStock = availableBundles === 0;
        const title = isOutOfStock
          ? (stock > 0 && unitsPerBundle > 1
            ? `Out of stock – ${stock} unit(s) left but need ${unitsPerBundle} per bundle`
            : 'Out of stock – users cannot order this item')
          : (unitsPerBundle > 1
            ? `${stock} units = ${availableBundles} bundle(s) (${unitsPerBundle} per bundle)`
            : `Current stock: ${stock} available`);
        return (
          <span
            className={isOutOfStock ? 'text-danger fw-bold' : ''}
            title={title}
          >
            {isOutOfStock
              ? (stock > 0 && unitsPerBundle > 1 ? `${stock} units (need ${unitsPerBundle}) – Out of stock` : '0 (Out of stock)')
              : (unitsPerBundle > 1 ? `${availableBundles} bundle(s)` : stock)}
          </span>
        );
      },
    },
    {
      name: 'BookType',
      selector: row => row.bookType,
      sortable: true,
      wrap: true,
    },
    {
      name: 'School',
      selector: row => row.schoolName,
      sortable: true,
      wrap: true,
      width: '150px',
    },
    {
      name: 'Grade',
      selector: row => row.gradeName,
      sortable: true,
      wrap: true,
      width: '120px',
    },
    {
      name: 'Section',
      selector: row => row.subgradeName,
      sortable: true,
      width: '100px',
    },
    {
      name: 'Category',
      selector: row => row.categoryName,
      sortable: true,
      wrap: true,
      width: '150px',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div>
          <Link
            to={`/upsert-book?id=${row.id}`}
            className="btn btn-sm btn-primary me-1"
          >
            <i className="bi bi-pencil-square"></i> Edit
          </Link>
          <Link
            to={`/upsert-book?duplicateFrom=${row.id}`}
            className="btn btn-sm btn-outline-secondary me-1"
            title="Create a copy of this product to edit and save as new"
          >
            <i className="bi bi-copy"></i> Duplicate
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
      width: '280px',
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
        <h1 className="header-title">Manage Books</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <span>Books</span>
              <Link to="/upsert-book" className="btn btn-dark btn-sm">
                Add Book
              </Link>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                <strong>Available Qty (Inventory):</strong> Total units in stock. If a product has &quot;units per bundle&quot; (e.g. 4 pens per bundle), only full bundles can be ordered—e.g. 99 units with 4 per bundle = 24 bundles max. &quot;Out of stock&quot; when there aren’t enough units for even one bundle.
              </p>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                {selectedRows.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="small text-muted">
                      {selectedRows.length} selected
                    </span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: '180px' }}
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                    >
                      <option value="">-- Bulk actions --</option>
                      <option value="delete">Delete selected</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      disabled={!bulkAction || isBulkProcessing}
                      onClick={handleApplyBulkAction}
                    >
                      {isBulkProcessing ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading books...</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredItems}
                  selectableRows
                  onSelectedRowsChange={handleSelectedRowsChange}
                  clearSelectedRows={clearSelectedRows}
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
                  noDataComponent="No books found"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Books;

