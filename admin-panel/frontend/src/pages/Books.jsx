import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { booksAPI, categoriesAPI, schoolsAPI, gradesAPI } from '../services/api';
import './Books.css';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

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
        const [categoriesResponse, schoolsResponse, gradesResponse] = await Promise.all([
          categoriesAPI.getAll(),
          schoolsAPI.getAll(),
          gradesAPI.getAll(),
        ]);

        // Create lookup maps
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

        // Transform books data for display
        const transformedBooks = booksResponse.data.data.map(book => ({
          id: book.id,
          title: book.title || 'N/A',
          author: book.author || 'N/A',
          isbn: book.isbn || 'N/A',
          price: book.price ? `₹${parseFloat(book.price).toFixed(2)}` : '₹0.00',
          stock: book.stockQuantity || 0,
          bookType: book.bookType || 'N/A',
          categoryName: book.categoryId ? (categoriesMap[book.categoryId] || 'N/A') : 'N/A',
          gradeName: book.gradeId ? (gradesMap[book.gradeId] || 'N/A') : 'N/A',
          schoolName: book.schoolId ? (schoolsMap[book.schoolId] || 'N/A') : 'N/A',
        }));

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
    const searchLower = filterText.toLowerCase();
    return books.filter(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.author.toLowerCase().includes(searchLower) ||
      item.isbn.toLowerCase().includes(searchLower) ||
      item.bookType.toLowerCase().includes(searchLower) ||
      item.schoolName.toLowerCase().includes(searchLower) ||
      item.gradeName.toLowerCase().includes(searchLower) ||
      item.categoryName.toLowerCase().includes(searchLower)
    );
  }, [books, filterText]);

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
      name: 'Author',
      selector: row => row.author,
      sortable: true,
      width: '120px',
    },
    {
      name: 'ISBN',
      selector: row => row.isbn,
      sortable: true,
      width: '150px',
    },
    {
      name: 'Price',
      selector: row => row.price,
      sortable: true,
      width: '120px',
    },
    {
      name: 'Stock',
      selector: row => row.stock,
      sortable: true,
      width: '100px',
      cell: (row) => (
        <span className={row.stock === 0 ? 'text-danger' : ''}>
          {row.stock}
        </span>
      ),
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

