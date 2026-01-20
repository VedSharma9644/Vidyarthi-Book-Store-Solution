import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, customersAPI, booksAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    revenueFromCompleted: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalBooks: 0,
    totalCustomers: 0,
    newCustomersToday: 0,
    newBooksThisMonth: 0,
    statusBreakdown: {}, // To show all statuses
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
      let date;
      if (dateValue?.toDate) {
        date = dateValue.toDate();
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        date = dateValue;
      }

      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return '-';
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [ordersResponse, customersResponse, booksResponse] = await Promise.all([
        ordersAPI.getAll(),
        customersAPI.getAll(),
        booksAPI.getAll(),
      ]);

      const orders = ordersResponse.data.data || [];
      const customers = customersResponse.data.data || [];
      const books = booksResponse.data.data || [];

      // Calculate statistics
      const totalOrders = orders.length;
      
      // Calculate total revenue from all orders (sum of orderTotal)
      const totalRevenue = orders.reduce((sum, order) => {
        const orderTotal = order.orderTotal || 0;
        return sum + (typeof orderTotal === 'number' ? orderTotal : parseFloat(orderTotal) || 0);
      }, 0);

      // Helper function to normalize status for comparison
      const normalizeStatus = (status) => {
        if (!status) return '';
        return status.toString().trim().toLowerCase();
      };

      // Build status breakdown for debugging
      const statusBreakdown = {};
      orders.forEach(order => {
        const status = (order.status || 'No Status').toString();
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      // Debug: Log order statuses to see what we're getting
      if (orders.length > 0) {
        console.log('Order status breakdown:', statusBreakdown);
        console.log('Sample order:', {
          id: orders[0].id,
          status: orders[0].status,
          orderTotal: orders[0].orderTotal,
          paymentStatus: orders[0].paymentStatus,
        });
      }

      // Count completed orders first (more specific)
      // Check for various completed status values
      const completedOrdersList = orders.filter(order => {
        const status = normalizeStatus(order.status);
        return status === 'completed' || 
               status === 'delivered' || 
               status === 'fulfilled' ||
               status === 'shipped';
      });
      const completedOrders = completedOrdersList.length;
      
      // Everything else is considered pending/processing
      // This ensures all orders are categorized
      const pendingOrders = totalOrders - completedOrders;
      
      // Calculate revenue from completed orders only
      const revenueFromCompleted = completedOrdersList.reduce((sum, order) => {
        const orderTotal = order.orderTotal || 0;
        return sum + (typeof orderTotal === 'number' ? orderTotal : parseFloat(orderTotal) || 0);
      }, 0);

      // Total books
      const totalBooks = books.length;

      // Total customers
      const totalCustomers = customers.length;

      // Count new customers today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newCustomersToday = customers.filter(customer => {
        if (!customer.createdAt) return false;
        const customerDate = customer.createdAt?.toDate 
          ? customer.createdAt.toDate() 
          : new Date(customer.createdAt);
        customerDate.setHours(0, 0, 0, 0);
        return customerDate.getTime() === today.getTime();
      }).length;

      // Count new books this month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const newBooksThisMonth = books.filter(book => {
        if (!book.createdAt) return false;
        const bookDate = book.createdAt?.toDate 
          ? book.createdAt.toDate() 
          : new Date(book.createdAt);
        return bookDate >= firstDayOfMonth;
      }).length;

      // Get recent orders (last 10, already sorted by date desc from API)
      const recent = orders.slice(0, 10).map(order => ({
        id: order.id || order.orderId,
        orderNumber: order.orderNumber || `#${order.id || order.orderId}`,
        customer: order.customerName || 'Unknown Customer',
        date: formatDate(order.dateCreated || order.createdAt),
        amount: formatCurrency(order.orderTotal || 0),
        status: order.status || 'Pending',
        paymentStatus: order.paymentStatus || 'Pending',
      }));

      setStats({
        totalOrders,
        totalRevenue,
        revenueFromCompleted,
        pendingOrders,
        completedOrders,
        totalBooks,
        totalCustomers,
        newCustomersToday,
        newBooksThisMonth,
        statusBreakdown,
      });
      setRecentOrders(recent);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed') return 'bg-success';
    if (statusLower === 'pending') return 'bg-warning';
    if (statusLower === 'cancelled') return 'bg-danger';
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

      {/* Top Summary Cards */}
      <div className="row">
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Orders</h6>
                  <h3 className="mb-0">{stats.totalOrders}</h3>
                  <small className="text-info">
                    {stats.completedOrders} completed, {stats.pendingOrders} pending
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-shopping-cart text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Revenue</h6>
                  <h3 className="mb-0">{formatCurrency(stats.totalRevenue)}</h3>
                  <small className="text-success">
                    From {stats.completedOrders} completed orders
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-rupee-sign text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Pending Orders</h6>
                  <h3 className="mb-0">{stats.pendingOrders}</h3>
                  <small className="text-warning">
                    {stats.pendingOrders > 0 ? 'Requires attention' : 'All clear'}
                  </small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-clock text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Books</h6>
                  <h3 className="mb-0">{stats.totalBooks}</h3>
                  <small className="text-info">
                    {stats.newBooksThisMonth} new this month
                  </small>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-book text-info"></i>
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
                <div>
                  <h6 className="text-muted mb-1">Total Customers</h6>
                  <h3 className="mb-0">{stats.totalCustomers}</h3>
                  <small className="text-success">
                    {stats.newCustomersToday} new today
                  </small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-users text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Completed Orders</h6>
                  <h3 className="mb-0">{stats.completedOrders}</h3>
                  <small className="text-success">
                    {stats.totalOrders > 0 
                      ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}% completion rate`
                      : 'No orders yet'
                    }
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-check-circle text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Average Order Value</h6>
                  <h3 className="mb-0">
                    {stats.totalOrders > 0 
                      ? formatCurrency(stats.totalRevenue / stats.totalOrders)
                      : formatCurrency(0)
                    }
                  </h3>
                  <small className="text-info">
                    Per order
                  </small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="fas fa-chart-line text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Revenue from Completed</h6>
                  <h3 className="mb-0">
                    {formatCurrency(stats.revenueFromCompleted)}
                  </h3>
                  <small className="text-success">
                    From {stats.completedOrders} completed orders
                  </small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="fas fa-money-bill-wave text-success"></i>
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
