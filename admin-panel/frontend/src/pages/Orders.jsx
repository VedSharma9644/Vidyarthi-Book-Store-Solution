import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import './Orders.css';

const Orders = () => {
  // Mock data - replace with API call later
  const [orders, setOrders] = useState([
    {
      id: 1,
      orderNumber: 'ORD-20251105-5D73',
      customerName: 'Eshwari Nilayam POLU',
      orderTotal: 7211.00,
      status: 'Pending',
      paymentStatus: 'Pending',
      dateCreated: '05-11-2025 01:49 pm',
      orderId: 51,
    },
    {
      id: 2,
      orderNumber: 'ORD-20250921-F13D',
      customerName: 'Chaitanya S',
      orderTotal: 17285.00,
      status: 'Pending',
      paymentStatus: 'Pending',
      dateCreated: '21-09-2025 03:04 pm',
      orderId: 50,
    },
    {
      id: 3,
      orderNumber: 'ORD-20250531-329E',
      customerName: 'Srinivas Machidi',
      orderTotal: 7735.00,
      status: 'Completed',
      paymentStatus: 'Paid',
      dateCreated: '31-05-2025 05:33 pm',
      orderId: 49,
    },
    {
      id: 4,
      orderNumber: 'ORD-20250528-3AE3',
      customerName: ' Satyanarayana adapa',
      orderTotal: 6463.00,
      status: 'Completed',
      paymentStatus: 'Paid',
      dateCreated: '29-05-2025 06:58 am',
      orderId: 48,
    },
    {
      id: 5,
      orderNumber: 'ORD-20250528-BDE0',
      customerName: ' Satyanarayana adapa',
      orderTotal: 6695.00,
      status: 'Completed',
      paymentStatus: 'Paid',
      dateCreated: '29-05-2025 06:53 am',
      orderId: 47,
    },
  ]);

  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

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
    if (status === 'Completed') {
      return <span className="badge bg-success">{status}</span>;
    } else if (status === 'Pending') {
      return <span className="badge bg-warning">{status}</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    if (status === 'Paid') {
      return <span className="badge bg-success">{status}</span>;
    } else if (status === 'Pending') {
      return <span className="badge bg-danger">{status}</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
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
      allowOverflow: true,
      button: true,
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;

