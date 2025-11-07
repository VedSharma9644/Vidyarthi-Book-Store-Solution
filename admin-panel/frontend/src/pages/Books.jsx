import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import './Books.css';

const Books = () => {
  // Mock data - replace with API call later
  const [books, setBooks] = useState([
    { id: 1, title: 'THOLI KIRANALUC-1', author: 'NA', isbn: 'SRTHOKIRC1', price: '₹162.00', stock: 32, bookType: 'TEXTBOOK' },
    { id: 2, title: 'HINDI PRAVESHIKA', author: 'NA', isbn: '9789352719587', price: '₹340.00', stock: 32, bookType: 'TEXTBOOK' },
    { id: 3, title: 'HappyCoder Program on Creative Computing Level -1', author: 'NA', isbn: '9788196319991', price: '₹299.00', stock: 32, bookType: 'TEXTBOOK' },
    { id: 4, title: "WHAT'S WHAT ,NEP/NCF EDITION,BOOK 1", author: 'NA', isbn: '9788119894192', price: '₹295.00', stock: 32, bookType: 'TEXTBOOK' },
    { id: 5, title: 'VALUE EDUCATION-1', author: 'NA', isbn: 'SCHOOLCINEMA1', price: '₹500.00', stock: 32, bookType: 'NOTEBOOK' },
    { id: 6, title: 'PARAMITA CBSE CLASS 1-NOTES PACK OF 9', author: 'NA', isbn: 'CBSENBC1&2', price: '₹540.00', stock: 0, bookType: 'NOTEBOOK' },
    { id: 7, title: 'THOLI KIRANALUC-2', author: 'NA', isbn: 'SRTHOKIRC2', price: '₹162.00', stock: 30, bookType: 'PARAMITA CBSE CLASS 2' },
    { id: 8, title: 'Madhubun Saral Pathmala - 2', author: 'NA', isbn: '9789356740938', price: '₹430.00', stock: 30, bookType: 'PARAMITA CBSE CLASS 2' },
    { id: 9, title: 'XSEED CBSE C-2 with Learnometer', author: 'NA', isbn: 'XSEEDCBSEC2', price: '₹4820.00', stock: 30, bookType: 'PARAMITA CBSE CLASS 2' },
    { id: 10, title: 'HappyCoder Program on Creative Computing Level -2', author: 'NA', isbn: '9788196319977', price: '₹339.00', stock: 30, bookType: 'PARAMITA CBSE CLASS 2' },
  ]);

  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      // TODO: Call API to delete
      setBooks(books.filter(book => book.id !== id));
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return books;
    return books.filter(item =>
      item.title.toLowerCase().includes(filterText.toLowerCase()) ||
      item.author.toLowerCase().includes(filterText.toLowerCase()) ||
      item.isbn.toLowerCase().includes(filterText.toLowerCase()) ||
      item.bookType.toLowerCase().includes(filterText.toLowerCase())
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Books;

