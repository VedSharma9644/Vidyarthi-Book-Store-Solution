import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import './OrderDetails.css';

const OrderDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('Pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [shiprocketStatus, setShiprocketStatus] = useState(null);
  const [isFetchingShiprocketStatus, setIsFetchingShiprocketStatus] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await ordersAPI.getById(orderId);
        
        if (response.data.success && response.data.data) {
          const orderData = response.data.data;
          
          // Format shipping address
          const formatAddress = (shippingAddress) => {
            if (!shippingAddress) return 'N/A';
            const parts = [];
            if (shippingAddress.address) parts.push(shippingAddress.address);
            if (shippingAddress.city) parts.push(shippingAddress.city);
            if (shippingAddress.state) parts.push(shippingAddress.state);
            if (shippingAddress.postalCode) parts.push(shippingAddress.postalCode);
            if (shippingAddress.country) parts.push(shippingAddress.country);
            return parts.join(', ') || 'N/A';
          };

          // Transform API data to match component format
          const transformedOrder = {
            id: orderData.id,
            orderNumber: orderData.orderNumber || `ORD-${orderData.id}`,
            customerName: orderData.customerName || 'Unknown Customer',
            phone: orderData.shippingAddress?.phone || 
                   orderData.customerInfo?.phoneNumber || 
                   'N/A',
            address: formatAddress(orderData.shippingAddress),
            orderDate: orderData.dateCreated || 'N/A',
            totalAmount: orderData.orderTotal || 0,
            status: orderData.status || 'Pending',
            paymentStatus: orderData.paymentStatus || 'Pending',
            items: (orderData.items || []).map((item, index) => ({
              id: item.itemId || index + 1,
              product: item.title || 'Unknown Product',
              quantity: item.quantity || 1,
              price: item.price || 0,
              total: item.subtotal || (item.price * (item.quantity || 1)),
            })),
            // Additional fields for reference
            subtotal: orderData.subtotal || 0,
            deliveryCharge: orderData.deliveryCharge || 0,
            tax: orderData.tax || 0,
            razorpayOrderId: orderData.razorpayOrderId || '',
            razorpayPaymentId: orderData.razorpayPaymentId || '',
            deliveryStatus: orderData.deliveryStatus || 'pending',
            trackingNumber: orderData.trackingNumber || null,
            shiprocketOrderId: orderData.shiprocketOrderId || null,
            shiprocketShipmentId: orderData.shiprocketShipmentId || null,
            shiprocketAWB: orderData.shiprocketAWB || null,
            shiprocketStatus: orderData.shiprocketStatus || null,
          };
          
          setOrder(transformedOrder);
          // Set initial status, converting to lowercase to match dropdown values
          const initialStatus = (transformedOrder.status || 'pending').toLowerCase();
          setNewStatus(initialStatus);
        } else {
          setError(response.data.message || 'Order not found');
        }
      } catch (error) {
        console.error('Error loading order:', error);
        setError('Failed to load order. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const fetchShiprocketStatus = async () => {
    if (!orderId) return;
    
    setIsFetchingShiprocketStatus(true);
    try {
      const response = await ordersAPI.getShiprocketStatus(orderId);
      console.log('📦 Shiprocket status response:', response.data);
      if (response.data.success) {
        const statusData = response.data.data;
        console.log('📦 Shiprocket status data:', statusData);
        setShiprocketStatus(statusData);
      }
    } catch (error) {
      console.error('Error fetching Shiprocket status:', error);
      console.error('Error details:', error.response?.data);
      // Don't show error if order doesn't have Shiprocket ID yet
      if (error.response?.status !== 400) {
        console.warn('Could not fetch Shiprocket status:', error.response?.data?.message || error.message);
      }
    } finally {
      setIsFetchingShiprocketStatus(false);
    }
  };

  // Fetch Shiprocket status when order is loaded and has Shiprocket ID
  useEffect(() => {
    if (order && (order.shiprocketOrderId || order.shiprocketShipmentId)) {
      fetchShiprocketStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.shiprocketOrderId, order?.shiprocketShipmentId]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (!orderId) {
      alert('Order ID is missing');
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await ordersAPI.updateStatus(orderId, {
        orderStatus: newStatus,
      });
      
      if (response.data.success) {
        setOrder({ ...order, status: newStatus });
        alert('Order status updated successfully!');
      } else {
        alert(response.data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const [isCreatingShiprocket, setIsCreatingShiprocket] = useState(false);

  const handleCreateShiprocketOrder = async (e) => {
    e.preventDefault();
    
    if (!orderId) {
      alert('Order ID is missing');
      return;
    }

    if (!confirm('Are you sure you want to create a Shiprocket order for this order?')) {
      return;
    }

    setIsCreatingShiprocket(true);
    try {
      const response = await ordersAPI.createShiprocketOrder(orderId);
      
      if (response.data.success) {
        const data = response.data.data || {};
        let message = 'Shiprocket order created successfully!';
        if (data.shiprocketOrderId) {
          message += `\nOrder ID: ${data.shiprocketOrderId}`;
        }
        if (data.awb) {
          message += `\nAWB Code: ${data.awb}`;
        }
        alert(message);
        
        // Reload order to get updated tracking info
        const orderResponse = await ordersAPI.getById(orderId);
        if (orderResponse.data.success && orderResponse.data.data) {
          const orderData = orderResponse.data.data;
          setOrder({ ...order, trackingNumber: data.awb || order.trackingNumber });
          
          // Fetch Shiprocket status after creating order
          if (orderId) {
            fetchShiprocketStatus();
          }
        }
      } else {
        alert(response.data.message || 'Failed to create Shiprocket order');
      }
    } catch (error) {
      console.error('Error creating Shiprocket order:', error);
      alert(error.response?.data?.message || 'Failed to create Shiprocket order. Please check your Shiprocket credentials.');
    } finally {
      setIsCreatingShiprocket(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    
    // Handle ORDER_* prefixed statuses and standard statuses
    if (statusLower.includes('delivered') || statusLower === 'completed' || statusLower === 'order_delivered') {
      return <span className="badge bg-success">{status || 'N/A'}</span>;
    } else if (statusLower.includes('confirmed') || statusLower === 'order_confirmed') {
      return <span className="badge bg-success">{status || 'N/A'}</span>;
    } else if (statusLower.includes('shipped') || statusLower === 'order_shipped') {
      return <span className="badge bg-primary">{status || 'N/A'}</span>;
    } else if (statusLower.includes('placed') || statusLower === 'pending' || statusLower === 'order_placed') {
      return <span className="badge bg-warning">{status || 'N/A'}</span>;
    } else if (statusLower === 'processing') {
      return <span className="badge bg-info">{status || 'N/A'}</span>;
    } else if (statusLower.includes('cancelled') || statusLower.includes('canceled')) {
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

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="ms-3">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          {error || 'Order not found'}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={() => navigate('/get-all-orders')}
          >
            Back to Orders
          </button>
        </div>
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
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
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
                <button 
                  type="submit" 
                  className="btn btn-sm btn-primary"
                  disabled={isCreatingShiprocket}
                >
                  {isCreatingShiprocket ? 'Creating...' : 'Create Shiprocket Order'}
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
              {(order.shiprocketOrderId || order.shiprocketShipmentId) && (
                <p>
                  <strong>Shiprocket Status:</strong> {getStatusBadge(
                    shiprocketStatus?.status 
                    || shiprocketStatus?.orderStatus 
                    || shiprocketStatus?.shipment_status
                    || shiprocketStatus?.current_status
                    || order.shiprocketStatus // Fallback to stored status from Firebase
                    || 'Not Available'
                  )}
                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    onClick={fetchShiprocketStatus}
                    disabled={isFetchingShiprocketStatus}
                    title="Refresh Shiprocket status"
                  >
                    {isFetchingShiprocketStatus ? '...' : '🔄'}
                  </button>
                </p>
              )}
              <p>
                <strong>Payment:</strong> {getPaymentStatusBadge(order.paymentStatus)}
              </p>
              <p>
                <strong>Order Date:</strong> {order.orderDate}
              </p>
              <p>
                <strong>Subtotal:</strong> {formatCurrency(order.subtotal || 0)}
              </p>
              <p>
                <strong>Delivery Charge:</strong> {formatCurrency(order.deliveryCharge || 0)}
              </p>
              <p>
                <strong>Tax:</strong> {formatCurrency(order.tax || 0)}
              </p>
              <p>
                <strong>Total Amount:</strong> {formatCurrency(order.totalAmount)}
              </p>
              {order.razorpayOrderId && (
                <p>
                  <strong>Razorpay Order ID:</strong> <small>{order.razorpayOrderId}</small>
                </p>
              )}
              {(order.trackingNumber || shiprocketStatus?.awb) && (
                <p>
                  <strong>Tracking Number (AWB):</strong> {shiprocketStatus?.awb || order.trackingNumber}
                </p>
              )}
              {shiprocketStatus?.trackingUrl && (
                <p>
                  <strong>Tracking URL:</strong>{' '}
                  <a href={shiprocketStatus.trackingUrl} target="_blank" rel="noopener noreferrer">
                    View Tracking
                  </a>
                </p>
              )}
              {shiprocketStatus?.shipmentId && (
                <p>
                  <strong>Shiprocket Shipment ID:</strong> <small>{shiprocketStatus.shipmentId}</small>
                </p>
              )}
              {shiprocketStatus?.orderId && (
                <p>
                  <strong>Shiprocket Order ID:</strong> <small>{shiprocketStatus.orderId}</small>
                </p>
              )}
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

