import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { ordersAPI } from '../services/api';
import './Orders.css';

const DEFAULT_PER_PAGE = 25;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filterText.trim()), 400);
    return () => clearTimeout(t);
  }, [filterText]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, perPage]);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = { page, limit: perPage };
      if (debouncedSearch) {
        params.q = debouncedSearch;
      }

      const response = await ordersAPI.getAll(params);

      if (response.data.success) {
        const baseSerial = (page - 1) * perPage;
        const transformedOrders = response.data.data.map((order, index) => ({
          serialNo: baseSerial + index + 1,
          orderId: order.id,
          orderNumber: order.orderNumber || `ORD-${order.id}`,
          className: order.className || '—',
          sectionName: order.sectionName || '—',
          amount: order.orderTotal || 0,
          studentName: order.studentName || '—',
          customerContact: order.customerContact || '—',
          dateCreated: order.dateCreated || '—',
        }));
        setOrders(transformedOrders);
        setTotalRows(response.data.total ?? transformedOrders.length);
      } else {
        setError(response.data.message || 'Failed to load orders');
        setOrders([]);
        setTotalRows(0);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, debouncedSearch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePerRowsChange = (newPerPage, newPage) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  const subHeaderComponentMemo = useMemo(
    () => (
      <OrderSearchBar
        filterText={filterText}
        setFilterText={setFilterText}
        debouncedSearch={debouncedSearch}
      />
    ),
    [filterText, debouncedSearch]
  );

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const columns = [
    {
      name: 'S no#',
      selector: (row) => row.serialNo,
      width: '72px',
      center: true,
    },
    {
      name: 'Order ID',
      selector: (row) => row.orderNumber,
      minWidth: '130px',
      wrap: true,
    },
    {
      name: 'Class',
      selector: (row) => row.className,
      minWidth: '90px',
      wrap: true,
    },
    {
      name: 'Section',
      selector: (row) => row.sectionName,
      minWidth: '90px',
      wrap: true,
    },
    {
      name: 'Amount',
      selector: (row) => row.amount,
      minWidth: '110px',
      cell: (row) => formatCurrency(row.amount),
    },
    {
      name: 'Student Name',
      selector: (row) => row.studentName,
      minWidth: '130px',
      wrap: true,
    },
    {
      name: 'Customer Contact',
      selector: (row) => row.customerContact,
      minWidth: '140px',
      wrap: true,
    },
    {
      name: 'Date',
      selector: (row) => row.dateCreated,
      minWidth: '150px',
      wrap: true,
    },
    {
      name: 'Action',
      cell: (row) => (
        <Link
          to={`/get-order-details?orderId=${row.orderId}`}
          className="btn btn-sm btn-primary"
        >
          View
        </Link>
      ),
      ignoreRowClick: true,
      width: '90px',
      center: true,
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
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04rem',
        whiteSpace: 'nowrap',
      },
    },
    cells: {
      style: {
        fontSize: '0.875rem',
      },
    },
    table: {
      style: {
        minWidth: '960px',
      },
    },
  };

  return (
    <div className="container-fluid orders-page">
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
              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={loadOrders}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={orders}
                  pagination
                  paginationServer
                  paginationTotalRows={totalRows}
                  paginationDefaultPage={page}
                  paginationPerPage={perPage}
                  onChangePage={handlePageChange}
                  onChangeRowsPerPage={handlePerRowsChange}
                  subHeader
                  subHeaderComponent={subHeaderComponentMemo}
                  persistTableHead
                  highlightOnHover
                  striped
                  customStyles={customStyles}
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

function OrderSearchBar({ filterText, setFilterText, debouncedSearch }) {
  return (
    <div className="dataTables_filter d-flex flex-wrap align-items-center gap-2">
      <label className="mb-0">
        Search:
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Order ID, student, contact…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            marginLeft: '0.5rem',
            display: 'inline-block',
            width: 'auto',
            minWidth: '220px',
          }}
        />
      </label>
      {debouncedSearch ? (
        <span className="text-muted small">Searching all orders…</span>
      ) : null}
    </div>
  );
}

export default Orders;
