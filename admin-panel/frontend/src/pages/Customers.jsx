import { useState, useMemo, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import './Customers.css';
import { customersAPI } from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return customers;
    return customers.filter(item =>
      (item.parentFullName && item.parentFullName.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.phoneNumber && item.phoneNumber.toLowerCase().includes(filterText.toLowerCase()))
    );
  }, [customers, filterText]);

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

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';
    try {
      let date;
      
      // Handle Firestore Timestamp object with _seconds property (fallback for old format)
      if (dateValue._seconds) {
        date = new Date(dateValue._seconds * 1000);
      }
      // Handle Firestore Timestamp object with toDate method (fallback for old format)
      else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Handle ISO string (from backend) or other string/number formats
      else {
        date = new Date(dateValue);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateValue);
        return '-';
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours % 12 || 12;
      
      return `${day}-${month}-${year} ${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return '-';
    }
  };

  const columns = [
    {
      name: '#',
      selector: (row, index) => index + 1,
      sortable: true,
      width: '50px',
    },
    {
      name: 'Parent Full Name',
      selector: row => row.parentFullName || '',
      sortable: true,
      wrap: true,
      cell: row => <span>{row.parentFullName || ' '}</span>,
    },
    {
      name: 'Email',
      selector: row => row.email || '',
      sortable: true,
      wrap: true,
      cell: row => <span>{row.email || ' '}</span>,
    },
    {
      name: 'PhoneNumber',
      selector: row => row.phoneNumber || '',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Date Created',
      selector: row => row.createdAt,
      sortable: true,
      wrap: true,
      cell: row => formatDate(row.createdAt),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#17a2b8',
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
        <h1 className="header-title">Customers</h1>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-info"></div>
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
                noDataComponent="No customers found"
                progressPending={loading}
                progressComponent={<div>Loading customers...</div>}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;

