import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, customersAPI, booksAPI } from '../services/api';
import './Dashboard.css';

function normStatus(value) {
  if (value == null || value === '') return '';
  return String(value).trim().toLowerCase();
}

/** Parse Firestore Timestamp, ISO string, or { _seconds } from JSON */
function parseFlexibleDate(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value === 'object' && value._seconds != null) {
      return new Date(value._seconds * 1000);
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function orderTotalNumber(order) {
  const v = order.orderTotal ?? order.total;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    cancelledOrders: 0,
    completedCount: 0,
    openPipelineCount: 0,
    paidOrderCount: 0,
    totalRevenue: 0,
    revenueFromCompleted: 0,
    deliveredPaidCount: 0,
    totalBooks: 0,
    totalCustomers: 0,
    newCustomersToday: 0,
    newBooksThisMonth: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  // Helper functions
  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';

    try {
      const parsed = parseFlexibleDate(dateValue);
      if (!parsed) return '-';
      return parsed.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [ordersResponse, customersResponse, booksResponse] = await Promise.all([
        ordersAPI.getAll({ lite: 1 }),
        customersAPI.getAll({ lite: 1 }),
        booksAPI.getAll({ lite: 1 }),
      ]);

      if (!ordersResponse.data?.success) {
        throw new Error(ordersResponse.data?.message || 'Failed to load orders');
      }
      if (!customersResponse.data?.success) {
        throw new Error(customersResponse.data?.message || 'Failed to load customers');
      }
      if (!booksResponse.data?.success) {
        throw new Error(booksResponse.data?.message || 'Failed to load books');
      }

      const orders = ordersResponse.data.data || [];
      const customers = customersResponse.data.data || [];
      const books = booksResponse.data.data || [];

      const isCancelled = (o) => {
        const s = normStatus(o.status);
        return s === 'cancelled' || s === 'canceled';
      };

      const isPaid = (o) => normStatus(o.paymentStatus) === 'paid';

      const isDeliveredOrComplete = (o) => {
        const s = normStatus(o.status);
        return s === 'delivered' || s === 'completed';
      };

      const totalOrders = orders.length;
      const cancelledOrders = orders.filter(isCancelled).length;

      const fulfilledOrders = orders.filter((o) => isDeliveredOrComplete(o) && !isCancelled(o));
      const completedCount = fulfilledOrders.length;

      const openPipelineOrders = orders.filter((o) => !isCancelled(o) && !isDeliveredOrComplete(o));
      const openPipelineCount = openPipelineOrders.length;

      const paidNonCancelled = orders.filter((o) => isPaid(o) && !isCancelled(o));
      const paidOrderCount = paidNonCancelled.length;

      const totalRevenue = paidNonCancelled.reduce((sum, o) => sum + orderTotalNumber(o), 0);

      const revenueFromCompleted = fulfilledOrders
        .filter(isPaid)
        .reduce((sum, o) => sum + orderTotalNumber(o), 0);

      const deliveredPaidCount = fulfilledOrders.filter(isPaid).length;

      const totalBooks = books.length;

      const totalCustomers = customers.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newCustomersToday = customers.filter((customer) => {
        const customerDate = parseFlexibleDate(customer.createdAt);
        if (!customerDate) return false;
        customerDate.setHours(0, 0, 0, 0);
        return customerDate.getTime() === today.getTime();
      }).length;

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const newBooksThisMonth = books.filter((book) => {
        const bookDate = parseFlexibleDate(book.createdAt);
        if (!bookDate) return false;
        return bookDate >= firstDayOfMonth;
      }).length;

      const recent = orders.slice(0, 10).map((order) => ({
        id: order.id || order.orderId,
        orderNumber: order.orderNumber || `#${order.id || order.orderId}`,
        customer: order.customerName || 'Unknown Customer',
        date: formatDate(order.dateCreated || order.createdAt),
        amount: formatCurrency(orderTotalNumber(order)),
        status: order.status || 'Pending',
        paymentStatus: order.paymentStatus || 'Pending',
      }));

      setStats({
        totalOrders,
        cancelledOrders,
        completedCount,
        openPipelineCount,
        paidOrderCount,
        totalRevenue,
        revenueFromCompleted,
        deliveredPaidCount,
        totalBooks,
        totalCustomers,
        newCustomersToday,
        newBooksThisMonth,
      });
      setRecentOrders(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Could not load dashboard data.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed' || statusLower === 'delivered') return 'bg-success';
    if (statusLower === 'confirmed' || statusLower === 'processing' || statusLower === 'shipped') {
      return 'bg-info';
    }
    if (statusLower === 'pending') return 'bg-warning';
    if (statusLower === 'cancelled' || statusLower === 'canceled') return 'bg-danger';
    return 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="header">
          <h1 className="header-title text-white">Welcome Back, Admin !</h1>
          <p className="text-white">Bookstore Management Dashboard</p>
        </div>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="header">
        <h1 className="header-title text-white">Welcome Back, Admin !</h1>
        <p className="text-white">Bookstore Management Dashboard</p>
      </div>

      {loadError && (
        <div className="alert alert-danger dashboard-alert mb-3" role="alert">
          {loadError}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="row">
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Orders</h6>
                  <h3 className="mb-0">{stats.totalOrders}</h3>
                  <small className="text-info">
                    {stats.completedCount} delivered · {stats.openPipelineCount} in pipeline
                    {stats.cancelledOrders > 0 ? ` · ${stats.cancelledOrders} cancelled` : ''}
                  </small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--primary">
                  <i className="bi bi-cart3 text-primary" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Revenue</h6>
                  <h3 className="mb-0">{formatCurrency(stats.totalRevenue)}</h3>
                  <small className="text-success">
                    From {stats.paidOrderCount} paid order{stats.paidOrderCount === 1 ? '' : 's'}
                  </small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--success">
                  <i className="bi bi-currency-rupee text-success" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">In pipeline</h6>
                  <h3 className="mb-0">{stats.openPipelineCount}</h3>
                  <small className="text-warning">
                    {stats.openPipelineCount > 0 ? 'Not yet delivered' : 'None waiting'}
                  </small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--warning">
                  <i className="bi bi-inbox text-warning" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Books</h6>
                  <h3 className="mb-0">{stats.totalBooks}</h3>
                  <small className="text-info">
                    {stats.newBooksThisMonth} new this month
                  </small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--info">
                  <i className="bi bi-book text-info" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row of Cards */}
      <div className="row">
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">Total Customers</h6>
                  <h3 className="mb-0">{stats.totalCustomers}</h3>
                  <small className="text-success">
                    {stats.newCustomersToday} new today
                  </small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--danger">
                  <i className="bi bi-people text-danger" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">Delivered / completed</h6>
                  <h3 className="mb-0">{stats.completedCount}</h3>
                  <small className="text-success">
                    {stats.totalOrders > 0
                      ? `${Math.round((stats.completedCount / stats.totalOrders) * 100)}% of all orders`
                      : 'No orders yet'}
                  </small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--success">
                  <i className="bi bi-check2-circle text-success" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">Average order value</h6>
                  <h3 className="mb-0">
                    {stats.paidOrderCount > 0
                      ? formatCurrency(stats.totalRevenue / stats.paidOrderCount)
                      : formatCurrency(0)}
                  </h3>
                  <small className="text-info">Among paid orders</small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--primary">
                  <i className="bi bi-graph-up-arrow text-primary" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-start">
                  <h6 className="text-muted mb-1">Revenue (delivered)</h6>
                  <h3 className="mb-0">{formatCurrency(stats.revenueFromCompleted)}</h3>
                  <small className="text-success">
                    From {stats.deliveredPaidCount} paid delivered order
                    {stats.deliveredPaidCount === 1 ? '' : 's'}
                  </small>
                </div>
                <div className="metric-icon-wrap metric-icon-wrap--success">
                  <i className="bi bi-wallet2 text-success" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Recent Orders</h5>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => navigate('/get-all-orders')}
              >
                View All Orders
              </button>
            </div>
            <div className="card-body">
              {recentOrders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No orders found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.orderNumber}</td>
                          <td>{order.customer}</td>
                          <td>{order.date}</td>
                          <td>{order.amount}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              order.paymentStatus?.toLowerCase() === 'paid' 
                                ? 'bg-success' 
                                : 'bg-warning'
                            }`}>
                              {order.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/get-order-details?orderId=${order.id}`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
