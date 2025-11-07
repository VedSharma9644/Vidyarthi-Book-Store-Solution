import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Pie, Line } from 'react-chartjs-2';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const Dashboard = () => {

  // Sales by Category Chart Data
  const salesByCategoryData = {
    labels: [
      "PARAMITA CBSE CLASS 1",
      "PARAMITA IIT CLASS 7",
      "PARAMITA STATE BOARD CLASS 5",
      "PARAMITA STATE BOARD CLASS 7",
      "PARAMITA WORLD SCHOOL- CBSE CLASS 8-ALUGUNUR"
    ],
    datasets: [{
      data: [15, 8, 6, 5, 5],
      backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
      hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617'],
      borderWidth: 0
    }]
  };

  // Order Status Chart Data
  const orderStatusData = {
    labels: ["Completed", "Pending"],
    datasets: [{
      data: [3, 2],
      backgroundColor: ['#1cc88a', '#36b9cc'],
      hoverBackgroundColor: ['#17a673', '#2c9faf'],
      borderWidth: 0
    }]
  };

  // Monthly Sales Chart Data
  const monthlySalesData = {
    labels: ["May 2025", "Sep 2025", "Nov 2025"],
    datasets: [{
      label: 'Sales (₹)',
      data: [20893.00, 17285.00, 7211.00],
      backgroundColor: 'rgba(78, 115, 223, 0.05)',
      borderColor: 'rgba(78, 115, 223, 1)',
      pointBackgroundColor: 'rgba(78, 115, 223, 1)',
      pointBorderColor: '#fff',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: 'rgba(78, 115, 223, 1)',
      pointHoverBorderColor: '#fff',
      pointHitRadius: 10,
      pointBorderWidth: 2,
      tension: 0.3,
      fill: true
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '65%',
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      }
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return '₹' + context.raw.toLocaleString('en-IN');
          }
        }
      }
    }
  };

  const topSellingBooks = [
    { name: 'PARAMITA CBSE CLASS 1-NOTES PACK OF 9', sales: 1, revenue: '₹540' },
    { name: 'VALUE EDUCATION-1', sales: 1, revenue: '₹500' },
    { name: "WHAT'S WHAT ,NEP/NCF EDITION,BOOK 1", sales: 1, revenue: '₹295' },
    { name: 'HappyCoder Program on Creative Computing Level -1', sales: 1, revenue: '₹299' },
    { name: 'HINDI PRAVESHIKA', sales: 1, revenue: '₹340' }
  ];

  const recentOrders = [
    { id: '#51', customer: '', date: '05 Nov 2025', amount: '₹7,211', status: 'Pending' },
    { id: '#50', customer: '', date: '21 Sep 2025', amount: '₹17,285', status: 'Pending' },
    { id: '#49', customer: '', date: '31 May 2025', amount: '₹7,735', status: 'Completed' },
    { id: '#48', customer: '', date: '29 May 2025', amount: '₹6,463', status: 'Completed' },
    { id: '#47', customer: '', date: '29 May 2025', amount: '₹6,695', status: 'Completed' }
  ];

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
                  <h3 className="mb-0">5</h3>
                  <small className="text-success">0% from last month</small>
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
                  <h3 className="mb-0">₹45,389</h3>
                  <small className="text-success">100% from last month</small>
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
                  <h6 className="text-muted mb-1">Total Books</h6>
                  <h3 className="mb-0">289</h3>
                  <small className="text-info">0 new this month</small>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="fas fa-book text-info"></i>
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
                  <h6 className="text-muted mb-1">Total Customers</h6>
                  <h3 className="mb-0">11</h3>
                  <small className="text-success">0 new today</small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="fas fa-users text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="row">
        <div className="col-12 col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Sales by Book Category</h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '300px' }}>
                <Doughnut data={salesByCategoryData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Order Status</h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '300px' }}>
                <Pie data={orderStatusData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="row">
        <div className="col-12 col-lg-8 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Monthly Sales</h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '300px' }}>
                <Line data={monthlySalesData} options={lineOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Top Selling Books</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Sales</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingBooks.map((book, index) => (
                      <tr key={index}>
                        <td>{book.name}</td>
                        <td>{book.sales}</td>
                        <td>{book.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Orders</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, index) => (
                      <tr key={index}>
                        <td>{order.id}</td>
                        <td>{order.customer || '-'}</td>
                        <td>{order.date}</td>
                        <td>{order.amount}</td>
                        <td>
                          <span className={`badge ${order.status === 'Completed' ? 'bg-success' : 'bg-secondary'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <a href={`/admin/orders/details/${order.id.replace('#', '')}`} className="btn btn-sm btn-outline-primary">
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

