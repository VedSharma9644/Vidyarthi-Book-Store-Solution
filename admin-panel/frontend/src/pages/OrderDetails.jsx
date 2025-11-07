import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './OrderDetails.css';

const OrderDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('Pending');
  const [isUpdating, setIsUpdating] = useState(false);

  // Mock order data - replace with API call later
  const mockOrder = {
    id: 51,
    orderNumber: 'ORD-20251105-5D73',
    customerName: 'Eshwari Nilayam POLU',
    phone: '9052226252',
    address: 'C/o,P.Sathyanarayana,H.No.7-1-72(New),Mankammathota karimnagar, Kakinada, Andhra Pradesh - 505001',
    orderDate: '05-11-2025 01:49 pm',
    totalAmount: 7211.00,
    status: 'Pending',
    paymentStatus: 'Pending',
    items: [
      { id: 1, product: 'THOLI KIRANALUC-1', quantity: 1, price: 162.00, total: 162.00 },
      { id: 2, product: 'HINDI PRAVESHIKA', quantity: 1, price: 340.00, total: 340.00 },
      { id: 3, product: 'HappyCoder Program on Creative Computing Level -1', quantity: 1, price: 299.00, total: 299.00 },
      { id: 4, product: "WHAT'S WHAT ,NEP/NCF EDITION,BOOK 1", quantity: 1, price: 295.00, total: 295.00 },
      { id: 5, product: 'XSEED CBSE C-1 with Learnometer', quantity: 1, price: 4725.00, total: 4725.00 },
      { id: 6, product: 'VALUE EDUCATION-1', quantity: 1, price: 500.00, total: 500.00 },
      { id: 7, product: 'PARAMITA CBSE CLASS 1-NOTES PACK OF 9', quantity: 1, price: 540.00, total: 540.00 },
      { id: 8, product: 'Stationary', quantity: 1, price: 100.00, total: 100.00 },
    ],
  };

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        // TODO: Fetch order from API
        // const response = await fetch(`/api/orders/${orderId}`);
        // const data = await response.json();
        // setOrder(data);
        // setNewStatus(data.status);
        
        // Using mock data for now
        setOrder(mockOrder);
        setNewStatus(mockOrder.status);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    setIsUpdating(true);
    try {
      // TODO: Call API to update status
      // const response = await fetch('/update-order-status', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     orderId: parseInt(orderId),
      //     newStatus: newStatus,
      //   }),
      // });
      
      // if (response.ok) {
      //   setOrder({ ...order, status: newStatus });
      //   // Show success message
      // }
      
      // Mock success
      setOrder({ ...order, status: newStatus });
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateShiprocketOrder = async (e) => {
    e.preventDefault();
    
    try {
      // TODO: Call API to create Shiprocket order
      // const response = await fetch(`/create-shiprocket-order?orderId=${orderId}`, {
      //   method: 'POST',
      // });
      
      // if (response.ok) {
      //   alert('Shiprocket order created successfully!');
      // }
      
      // Mock success
      alert('Shiprocket order created successfully!');
    } catch (error) {
      console.error('Error creating Shiprocket order:', error);
      alert('Failed to create Shiprocket order');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    if (status === 'Completed') {
      return <span className="badge bg-success">{status}</span>;
    } else if (status === 'Pending') {
      return <span className="badge bg-warning">{status}</span>;
    } else if (status === 'Processing') {
      return <span className="badge bg-info">{status}</span>;
    } else if (status === 'Shipped') {
      return <span className="badge bg-primary">{status}</span>;
    } else if (status === 'Cancelled') {
      return <span className="badge bg-danger">{status}</span>;
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

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">Order not found</div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="header d-flex justify-content-between align-items-center">
        <h1 className="header-title">Order details #{order.orderNumber}</h1>
      </div>

      {/* Status Update Section */}
      <div className="row mb-2">
        <div className="col-lg-12">
          <div className="card p-3">
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-2">
              {/* Left: Update Status Form */}
              <form id="updateStatusForm" onSubmit={handleStatusUpdate} className="d-flex align-items-end gap-2 flex-wrap">
                <input type="hidden" name="orderId" value={orderId} />
                <div>
                  <label className="form-label">Change Order Status</label>
                  <select
                    className="form-control"
                    name="newStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <button type="submit" className="btn btn-success" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>

              {/* Middle: Create Shiprocket Order */}
              <form className="submit-form" onSubmit={handleCreateShiprocketOrder}>
                <button type="submit" className="btn btn-sm btn-primary">
                  Create Shiprockt Order
                </button>
              </form>

              {/* Right: Generate Invoice */}
              <div>
                <label className="form-label d-block invisible">Generate</label>
                <a
                  href={`/orders/generate-invoice?orderId=${orderId}`}
                  className="btn btn-outline-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Generate Invoice
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Order Summary */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-secondary text-white">Order Summary</div>
            <div className="card-body">
              <p>
                <strong>Status:</strong> {getStatusBadge(order.status)}
              </p>
              <p>
                <strong>Payment:</strong> {getPaymentStatusBadge(order.paymentStatus)}
              </p>
              <p>
                <strong>Order Date:</strong> {order.orderDate}
              </p>
              <p>
                <strong>Total Amount:</strong> {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Details */}
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-secondary text-white">Shipping Details</div>
            <div className="card-body">
              <p>
                <strong>Name:</strong> {order.customerName}
              </p>
              <p>
                <strong>Phone:</strong> {order.phone}
              </p>
              <p>
                <strong>Address:</strong> {order.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card mt-2">
        <div className="card-header bg-info text-white">Order Items</div>
        <div className="card-body p-0">
          <table className="table table-bordered table-striped mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.product}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

