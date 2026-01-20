import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

const OrderHistoryScreen = ({ onTabPress, onBack, onGoToOrderDetails }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    console.log('Orders state updated:', orders.length, 'orders');
    if (orders.length > 0) {
      console.log('First order:', JSON.stringify(orders[0], null, 2));
    }
  }, [orders]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading orders...');
      const result = await ApiService.getOrders();
      console.log('Orders API Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log('Setting orders:', result.data.length, 'orders found');
        setOrders(Array.isArray(result.data) ? result.data : []);
      } else {
        console.log('API returned error:', result.message);
        setError(result.message || 'Failed to load orders');
        setOrders([]);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (dateValue) => {
    try {
      let date;
      // Handle Firebase Timestamp or Date string
      if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        // Firebase Timestamp
        date = dateValue.toDate();
      } else if (dateValue && typeof dateValue === 'object' && dateValue._seconds) {
        // Firebase Timestamp serialized
        date = new Date(dateValue._seconds * 1000);
      } else if (dateValue) {
        // Regular date string
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
        return '#28a745';
      case 'processing':
      case 'dispatched':
      case 'order_shipped':
        return '#007bff';
      case 'order_confirmed':
        return '#17a2b8';
      case 'cancelled':
      case 'order_cancelled':
        return '#dc3545';
      case 'order_placed':
        return '#ffc107';
      default:
        return '#ffc107';
    }
  };

  const formatShiprocketStatus = (status) => {
    if (!status) return null;
    const statusLower = status.toLowerCase().replace(/_/g, ' ').trim();
    
    // Handle common Shiprocket statuses
    if (statusLower.includes('delivered')) return 'Delivered';
    if (statusLower.includes('shipped')) return 'Shipped';
    if (statusLower.includes('confirmed')) return 'Confirmed';
    if (statusLower.includes('placed')) return 'Placed';
    if (statusLower.includes('cancelled') || statusLower.includes('canceled')) return 'Cancelled';
    if (statusLower.includes('self') && statusLower.includes('fulfilled')) return 'Self Fulfilled';
    if (statusLower.includes('new')) return 'New';
    if (statusLower.includes('processing')) return 'Processing';
    if (statusLower.includes('ready to ship')) return 'Ready to Ship';
    if (statusLower.includes('in transit')) return 'In Transit';
    if (statusLower.includes('out for delivery')) return 'Out for Delivery';
    
    // Format the status nicely (capitalize first letter of each word)
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getShiprocketStatusColor = (status) => {
    if (!status) return '#6c757d';
    const statusLower = status.toLowerCase().replace(/_/g, ' ').trim();
    
    // Handle common Shiprocket statuses with appropriate colors
    if (statusLower.includes('delivered')) return '#28a745'; // Green
    if (statusLower.includes('shipped') || statusLower.includes('in transit') || statusLower.includes('out for delivery')) return '#007bff'; // Blue
    if (statusLower.includes('confirmed') || statusLower.includes('ready to ship')) return '#17a2b8'; // Cyan
    if (statusLower.includes('placed') || statusLower.includes('new')) return '#ffc107'; // Yellow
    if (statusLower.includes('processing')) return '#fd7e14'; // Orange
    if (statusLower.includes('self') && statusLower.includes('fulfilled')) return '#6f42c1'; // Purple
    if (statusLower.includes('cancelled') || statusLower.includes('canceled')) return '#dc3545'; // Red
    return '#6c757d'; // Gray (default)
  };

  const handleViewOrderDetails = (order) => {
    if (onGoToOrderDetails) {
      onGoToOrderDetails(order.id);
    } else {
      Alert.alert('Order Details', `Order ${order.orderNumber} details`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.orderHistoryHeader}>
        <View style={styles.orderHistoryHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.orderHistoryHeaderTitle}>Order History</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.orderHistoryMainContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.orderHistoryContent}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading orders...</Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
              <Text style={{ color: colors.error, fontSize: 16, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={loadOrders}>
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : orders.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '500', marginBottom: 8 }}>
                No orders yet
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>
                Your order history will appear here once you place an order.
              </Text>
            </View>
          ) : (
            <>
              {/* Debug info - remove in production */}
              {__DEV__ && (
                <View style={{ padding: 10, backgroundColor: '#f0f0f0', marginBottom: 10 }}>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    Debug: Showing {orders.length} order(s) from API
                  </Text>
                </View>
              )}
              {orders.map((order) => (
              <View key={order.id || `order-${order.orderNumber}`} style={styles.orderSummaryCard}>
                <View style={styles.orderSummaryHeader}>
                  <View style={styles.orderSummaryTop}>
                    <Text style={styles.orderNumberText}>Order {order.orderNumber || `#${order.id}`}</Text>
                    <Text style={styles.orderDateText}>{formatDate(order.createdAt || order.orderDate)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {/* Order Status */}
                    <View style={{
                      backgroundColor: getStatusColor(order.orderStatus) + '20',
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                      alignSelf: 'flex-start',
                    }}>
                      <Text style={{
                        color: getStatusColor(order.orderStatus),
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        {formatStatus(order.orderStatus)}
                      </Text>
                    </View>
                    
                    {/* Shiprocket Status */}
                    {(order.shiprocketStatus || order.shiprocketOrderId) && (
                      <View style={{
                        backgroundColor: (getShiprocketStatusColor(order.shiprocketStatus) || '#6c757d') + '20',
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Text style={{ fontSize: 10 }}>🚚</Text>
                        <Text style={{
                          color: getShiprocketStatusColor(order.shiprocketStatus) || '#6c757d',
                          fontSize: 12,
                          fontWeight: '600',
                        }}>
                          {formatShiprocketStatus(order.shiprocketStatus) || 'Tracking'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Shiprocket Tracking Info */}
                {(order.shiprocketAWB || order.trackingNumber || order.shiprocketOrderId) && (
                  <View style={{
                    marginTop: 8,
                    padding: 10,
                    backgroundColor: colors.gray50,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.primary,
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: 4,
                    }}>
                      📦 Shipping Information
                    </Text>
                    {order.shiprocketAWB && (
                      <Text style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}>
                        AWB: {order.shiprocketAWB}
                      </Text>
                    )}
                    {order.trackingNumber && !order.shiprocketAWB && (
                      <Text style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}>
                        Tracking: {order.trackingNumber}
                      </Text>
                    )}
                    {order.shiprocketOrderId && (
                      <Text style={{
                        fontSize: 10,
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}>
                        Shiprocket ID: {order.shiprocketOrderId}
                      </Text>
                    )}
                  </View>
                )}

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <View style={{ marginTop: 12, marginBottom: 8 }}>
                    {order.items.slice(0, 2).map((item, index) => (
                      <View key={item.itemId || index} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          backgroundColor: colors.gray100,
                          borderRadius: 4,
                          marginRight: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                        }}>
                          {item.coverImageUrl ? (
                            <Image source={{ uri: item.coverImageUrl }} style={{ width: 40, height: 40, borderRadius: 4 }} />
                          ) : (
                            <Text style={{ fontSize: 20 }}>📚</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: colors.textPrimary,
                          }} numberOfLines={1}>
                            {item.title || item.bookTitle || 'Unknown Book'}
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                          }}>
                            Qty: {item.quantity} × ₹{item.price?.toFixed(2) || item.unitPrice?.toFixed(2) || '0.00'}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {order.items.length > 2 && (
                      <Text style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginTop: 4,
                      }}>
                        +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                )}

                {/* Order Total */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.borderLight,
                }}>
                  <View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.textPrimary,
                    }}>
                      Total: ₹{order.total?.toFixed(2) || order.finalAmount?.toFixed(2) || order.orderTotal?.toFixed(2) || '0.00'}
                    </Text>
                    {order.paymentStatus && (
                      <Text style={{
                        fontSize: 12,
                        color: order.paymentStatus === 'paid' ? '#28a745' : colors.textSecondary,
                        marginTop: 2,
                      }}>
                        Payment: {formatStatus(order.paymentStatus)}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                    }}
                    onPress={() => handleViewOrderDetails(order)}
                  >
                    <Text style={{
                      color: colors.white,
                      fontSize: 14,
                      fontWeight: '600',
                    }}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;
