import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderStyles, colors } from '../css/orderStyles';
import { getProductImageByCategory } from '../config/imagePaths';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    } else {
      setError('Order ID is missing');
      setIsLoading(false);
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) {
      setError('Order ID is missing');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ApiService.getOrderById(orderId);
      
      if (result && result.success !== false) {
        const order = result.data || result;
        
        if (order && (order.id || order.orderNumber)) {
          setOrderData(order);
        } else {
          setError('Invalid order data received');
        }
      } else {
        setError(result?.message || 'Failed to load order details');
      }
    } catch (err) {
      console.error('Error loading order details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load order details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    try {
      let date;
      if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
      } else if (dateValue && typeof dateValue === 'object' && dateValue._seconds) {
        date = new Date(dateValue._seconds * 1000);
      } else if (dateValue) {
        date = new Date(dateValue);
      } else {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'N/A';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'completed':
      case 'delivered':
      case 'order_delivered':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'processing':
      case 'dispatched':
      case 'order_shipped':
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'order_confirmed':
        return { backgroundColor: '#cffafe', color: '#155e75' };
      case 'cancelled':
      case 'canceled':
      case 'order_cancelled':
        return { backgroundColor: '#fecaca', color: '#991b1b' };
      case 'order_placed':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      default:
        return { backgroundColor: '#fef3c7', color: '#92400e' };
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.name) parts.push(address.name);
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !orderData) {
    return (
      <div style={orderStyles.orderPageContainer}>
        <div style={orderStyles.orderHeader}>
          <div style={orderStyles.orderHeaderContent}>
            <h1 style={orderStyles.orderHeaderTitle}>Order Details</h1>
          </div>
        </div>
        <div style={orderStyles.orderContent}>
          <div style={orderStyles.emptyState}>
            <div style={orderStyles.emptyStateIcon}>📦</div>
            <h2 style={orderStyles.emptyStateTitle}>Error Loading Order</h2>
            <p style={orderStyles.emptyStateSubtitle}>{error || 'Order not found'}</p>
            <button
              style={orderStyles.refreshButton}
              onClick={() => navigate('/orders')}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, orderStyles.refreshButtonHover);
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.white;
              }}
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusColor(orderData.orderStatus || orderData.status);

  return (
    <div style={orderStyles.orderPageContainer}>
      {/* Header */}
      <div style={orderStyles.orderHeader}>
        <div style={orderStyles.orderHeaderContent}>
          <h1 style={orderStyles.orderHeaderTitle}>Order Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={orderStyles.orderContent}>
        {/* Order Summary Card */}
        <div style={orderStyles.orderDetailsCard}>
          <h2 style={orderStyles.orderDetailsNumber}>
            Order {orderData.orderNumber || `#${orderData.id}`}
          </h2>
          
          <div style={orderStyles.orderDetailsInfo}>
            <div style={orderStyles.orderDetailsRow}>
              <span style={orderStyles.orderDetailsLabel}>Order Date</span>
              <span style={orderStyles.orderDetailsValue}>
                {formatDate(orderData.createdAt || orderData.orderDate || orderData.dateCreated)}
              </span>
            </div>
            
            <div style={orderStyles.orderDetailsRow}>
              <span style={orderStyles.orderDetailsLabel}>Status</span>
              <span
                style={{
                  ...orderStyles.orderDetailsStatusBadge,
                  backgroundColor: statusStyle.backgroundColor,
                  color: statusStyle.color,
                }}
              >
                {formatStatus(orderData.orderStatus || orderData.status)}
              </span>
            </div>
            
            {orderData.subtotal && (
              <div style={orderStyles.orderDetailsRow}>
                <span style={orderStyles.orderDetailsLabel}>Subtotal</span>
                <span style={orderStyles.orderDetailsValue}>₹{orderData.subtotal.toFixed(2)}</span>
              </div>
            )}
            
            {orderData.deliveryCharge && (
              <div style={orderStyles.orderDetailsRow}>
                <span style={orderStyles.orderDetailsLabel}>Delivery Charge</span>
                <span style={orderStyles.orderDetailsValue}>₹{orderData.deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            
            {orderData.tax && (
              <div style={orderStyles.orderDetailsRow}>
                <span style={orderStyles.orderDetailsLabel}>Tax</span>
                <span style={orderStyles.orderDetailsValue}>₹{orderData.tax.toFixed(2)}</span>
              </div>
            )}
            
            <div style={{
              ...orderStyles.orderDetailsRow,
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: `2px solid ${colors.borderLight}`,
            }}>
              <span style={{ ...orderStyles.orderDetailsLabel, fontSize: '18px', fontWeight: 'bold' }}>Total</span>
              <span style={{ ...orderStyles.orderDetailsValue, fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                ₹{(orderData.total || orderData.orderTotal || orderData.finalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items Card */}
        {orderData.items && orderData.items.length > 0 && (
          <div style={orderStyles.orderDetailsCard}>
            <h2 style={{ ...orderStyles.orderDetailsNumber, marginBottom: '20px' }}>Order Items</h2>
            <div style={orderStyles.orderItemsList}>
              {orderData.items.map((item, index) => {
                const imageUri = item.coverImageUrl || item.imageUrl || item.image;
                const fallbackImage = getProductImageByCategory(item.bookType || item.category);
                return (
                  <div key={item.itemId || index} style={orderStyles.orderItemCard}>
                    {imageUri ? (
                      <img
                        src={imageUri}
                        alt={item.title || item.bookTitle || 'Book'}
                        style={orderStyles.orderItemCardImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'block';
                          }
                        }}
                      />
                    ) : null}
                    <img
                      src={fallbackImage}
                      alt={item.title || item.bookTitle || 'Book'}
                      style={{
                        ...orderStyles.orderItemCardImage,
                        display: imageUri ? 'none' : 'block',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div style={{
                      ...orderStyles.orderItemCardImagePlaceholder,
                      display: 'none',
                    }}>
                      📚
                    </div>
                    <div style={orderStyles.orderItemCardDetails}>
                      <h3 style={orderStyles.orderItemCardTitle}>
                        {item.title || item.bookTitle || 'Unknown Book'}
                      </h3>
                      <p style={orderStyles.orderItemCardInfo}>
                        Quantity: {item.quantity} × ₹{item.price?.toFixed(2) || item.unitPrice?.toFixed(2) || '0.00'}
                      </p>
                      {item.bookType && (
                        <p style={{ ...orderStyles.orderItemCardInfo, marginTop: '4px' }}>
                          Category: {item.bookType}
                        </p>
                      )}
                    </div>
                    <div style={orderStyles.orderItemCardPrice}>
                      ₹{((item.price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shipping Address Card */}
        {orderData.shippingAddress && (
          <div style={orderStyles.orderDetailsCard}>
            <h2 style={{ ...orderStyles.orderDetailsNumber, marginBottom: '20px' }}>Shipping Address</h2>
            <div style={orderStyles.shippingAddressCard}>
              <p style={orderStyles.shippingAddressText}>
                {formatAddress(orderData.shippingAddress)}
              </p>
            </div>
          </div>
        )}

        {/* Payment Info Card */}
        {orderData.paymentData && (
          <div style={orderStyles.orderDetailsCard}>
            <h2 style={{ ...orderStyles.orderDetailsNumber, marginBottom: '20px' }}>Payment Information</h2>
            <div style={orderStyles.paymentInfoCard}>
              {orderData.paymentData.razorpayOrderId && (
                <p style={orderStyles.paymentInfoText}>
                  <strong>Razorpay Order ID:</strong> {orderData.paymentData.razorpayOrderId}
                </p>
              )}
              {orderData.paymentData.razorpayPaymentId && (
                <p style={orderStyles.paymentInfoText}>
                  <strong>Payment ID:</strong> {orderData.paymentData.razorpayPaymentId}
                </p>
              )}
              <p style={orderStyles.paymentInfoText}>
                <strong>Payment Status:</strong> {orderData.paymentData.status || 'Completed'}
              </p>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            style={orderStyles.refreshButton}
            onClick={() => navigate('/orders')}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, orderStyles.refreshButtonHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
            }}
          >
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;

