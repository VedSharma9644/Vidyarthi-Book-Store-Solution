import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { ordersAPI } from '../services/api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  // Fetch orders from API
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ordersAPI.getAll();
      
      if (response.data.success) {
        // Transform data to match table format
        const transformedOrders = response.data.data.map((order, index) => ({
          id: index + 1, // Sequential number for display
          orderId: order.id, // Firestore document ID
          orderNumber: order.orderNumber || `ORD-${order.id}`,
          customerName: order.customerName || 'Unknown Customer',
          orderTotal: order.orderTotal || 0,
          status: order.status || 'Pending',
          paymentStatus: order.paymentStatus || 'Pending',
          dateCreated: order.dateCreated || 'N/A',
        }));
        setOrders(transformedOrders);
      } else {
        setError(response.data.message || 'Failed to load orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!filterText) return orders;
    return orders.filter(item =>
      item.orderNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      item.customerName.toLowerCase().includes(filterText.toLowerCase()) ||
      item.status.toLowerCase().includes(filterText.toLowerCase()) ||
      item.paymentStatus.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [orders, filterText]);

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

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed' || statusLower === 'confirmed' || statusLower === 'delivered') {
      return <span className="badge bg-success">{status || 'N/A'}</span>;
    } else if (statusLower === 'pending' || statusLower === 'processing') {
      return <span className="badge bg-warning">{status || 'N/A'}</span>;
    } else if (statusLower === 'cancelled' || statusLower === 'cancelled') {
      return <span className="badge bg-danger">{status || 'N/A'}</span>;
    }
    return <span className="badge bg-secondary">{status || 'N/A'}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'paid') {
      return <span className="badge bg-success">{status || 'N/A'}</span>;
    } else if (statusLower === 'pending') {
      return <span className="badge bg-danger">{status || 'N/A'}</span>;
    } else if (statusLower === 'failed' || statusLower === 'refunded') {
      return <span className="badge bg-danger">{status || 'N/A'}</span>;
    }
    return <span className="badge bg-secondary">{status || 'N/A'}</span>;
  };

  const columns = [
    {
      name: '#',
      selector: row => row.id,
      sortable: true,
      width: '80px',
    },
    {
      name: 'Order Number',
      selector: row => row.orderNumber,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Customer Name',
      selector: row => row.customerName,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Order Total',
      selector: row => row.orderTotal,
      sortable: true,
      cell: row => formatCurrency(row.orderTotal),
      wrap: true,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => getStatusBadge(row.status),
      wrap: true,
    },
    {
      name: 'Payment Status',
      selector: row => row.paymentStatus,
      sortable: true,
      cell: row => getPaymentStatusBadge(row.paymentStatus),
      wrap: true,
    },
    {
      name: 'Date Created',
      selector: row => row.dateCreated,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Link
          to={`/get-order-details?orderId=${row.orderId}`}
          className="btn btn-sm btn-primary"
        >
          View
        </Link>
      ),
      ignoreRowClick: true,
      width: '100px',
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
        <h1 className="header-title">Customer Orders</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-info">
              <h5 className="card-title mb-0 text-white">Order List</h5>
            </div>
            <div className="card-body">
              {isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading orders...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                  <button 
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={loadOrders}
                  >
                    Retry
                  </button>
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
                  noDataComponent="No orders found"
                  progressPending={isLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;

