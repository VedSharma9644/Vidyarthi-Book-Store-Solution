import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderStyles, colors } from '../css/orderStyles';
import { getProductImageByCategory } from '../config/imagePaths';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ApiService.getOrders();
      
      if (result.success && result.data) {
        setOrders(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.message || 'Failed to load orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    try {
      let date;
      // Handle Firebase Timestamp or Date string
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

  const handleViewOrderDetails = (order) => {
    navigate(`/orders/${order.id}`);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div style={orderStyles.orderPageContainer}>
      {/* Header */}
      <div style={orderStyles.orderHeader}>
        <div style={orderStyles.orderHeaderContent}>
          <h1 style={orderStyles.orderHeaderTitle}>Order History</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={orderStyles.orderContent}>
        {error ? (
          <div style={orderStyles.emptyState}>
            <div style={orderStyles.emptyStateIcon}>📦</div>
            <h2 style={orderStyles.emptyStateTitle}>Error Loading Orders</h2>
            <p style={orderStyles.emptyStateSubtitle}>{error}</p>
            <button
              style={orderStyles.refreshButton}
              onClick={loadOrders}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, orderStyles.refreshButtonHover);
                e.currentTarget.style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.white;
              }}
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div style={orderStyles.emptyState}>
            <div style={orderStyles.emptyStateIcon}>📦</div>
            <h2 style={orderStyles.emptyStateTitle}>No orders yet</h2>
            <p style={orderStyles.emptyStateSubtitle}>
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const statusStyle = getStatusColor(order.orderStatus || order.status);
            return (
              <div
                key={order.id || `order-${order.orderNumber}`}
                style={orderStyles.orderCard}
                onClick={() => handleViewOrderDetails(order)}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, orderStyles.orderCardHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = colors.borderLight;
                }}
              >
                {/* Order Header */}
                <div style={orderStyles.orderCardHeader}>
                  <div>
                    <h3 style={orderStyles.orderNumber}>
                      Order {order.orderNumber || `#${order.id}`}
                    </h3>
                    <p style={orderStyles.orderDate}>
                      {formatDate(order.createdAt || order.orderDate || order.dateCreated)}
                    </p>
                  </div>
                  <span
                    style={{
                      ...orderStyles.orderStatusBadge,
                      backgroundColor: statusStyle.backgroundColor,
                      color: statusStyle.color,
                    }}
                  >
                    {formatStatus(order.orderStatus || order.status)}
                  </span>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div style={orderStyles.orderItemsPreview}>
                    {order.items.slice(0, 2).map((item, index) => {
                      const imageUri = item.coverImageUrl || item.imageUrl || item.image;
                      const fallbackImage = getProductImageByCategory(item.bookType || item.category);
                      return (
                        <div key={item.itemId || index} style={orderStyles.orderItemPreview}>
                          {imageUri ? (
                            <img
                              src={imageUri}
                              alt={item.title || item.bookTitle || 'Book'}
                              style={orderStyles.orderItemImage}
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
                              ...orderStyles.orderItemImage,
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
                            ...orderStyles.orderItemImagePlaceholder,
                            display: 'none',
                          }}>
                            📚
                          </div>
                          <div style={orderStyles.orderItemDetails}>
                            <h4 style={orderStyles.orderItemTitle}>
                              {item.title || item.bookTitle || 'Unknown Book'}
                            </h4>
                            <p style={orderStyles.orderItemQuantity}>
                              Qty: {item.quantity} × ₹{item.price?.toFixed(2) || item.unitPrice?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {order.items.length > 2 && (
                      <p style={{
                        fontSize: '14px',
                        color: colors.textSecondary,
                        margin: '8px 0 0 0',
                        fontStyle: 'italic',
                      }}>
                        +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* Order Footer */}
                <div style={orderStyles.orderCardFooter}>
                  <div>
                    <p style={orderStyles.orderTotal}>
                      ₹{(order.total || order.orderTotal || order.finalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <button
                    style={orderStyles.viewDetailsButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewOrderDetails(order);
                    }}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, orderStyles.viewDetailsButtonHover);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;

