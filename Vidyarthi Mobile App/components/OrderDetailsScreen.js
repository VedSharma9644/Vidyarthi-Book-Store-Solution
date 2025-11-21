import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

const OrderDetailsScreen = ({ onTabPress, onBack, orderId }) => {
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('📦 OrderDetailsScreen - orderId prop:', orderId);
    // Reset state when orderId changes
    setOrderData(null);
    setError(null);
    
    if (orderId) {
      loadOrderDetails();
    } else {
      console.warn('⚠️ OrderDetailsScreen - No orderId provided');
      setError('Order ID is missing');
      setIsLoading(false);
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) {
      console.error('❌ Cannot load order: orderId is missing');
      setError('Order ID is missing');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('📦 Loading order details for ID:', orderId);
      
      const result = await ApiService.getOrderById(orderId);
      console.log('📦 Order details API response:', JSON.stringify(result, null, 2));
      
      if (result && result.success !== false) {
        // Handle both {success: true, data: {...}} and direct data response
        const orderData = result.data || result;
        
        if (orderData && (orderData.id || orderData.orderNumber)) {
          console.log('✅ Order data loaded successfully');
          console.log('📦 Order ID:', orderData.id);
          console.log('📦 Order Number:', orderData.orderNumber);
          console.log('📦 Order items count:', orderData.items?.length || 0);
          console.log('📦 Order items:', JSON.stringify(orderData.items, null, 2));
          setOrderData(orderData);
        } else {
          console.error('❌ Invalid order data structure:', orderData);
          setError('Invalid order data received');
        }
      } else {
        console.error('❌ Failed to load order:', result?.message || 'Unknown error');
        setError(result?.message || 'Failed to load order details');
      }
    } catch (err) {
      console.error('❌ Error loading order details:', err);
      console.error('Error details:', err.response?.data || err.message);
      console.error('Error stack:', err.stack);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.orderDetailsHeader}>
        <View style={styles.orderDetailsHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.orderDetailsHeaderTitle}>Order Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        {/* Debug: Show orderId in header if in development */}
        {__DEV__ && orderId && (
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, paddingHorizontal: 16, paddingBottom: 4 }}>
            Order ID: {orderId}
          </Text>
        )}
      </View>

      {/* Main Content */}
      <ScrollView style={styles.orderDetailsMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.orderDetailsContent}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading order details...</Text>
            </View>
          ) : error ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
              <Text style={{ color: colors.error, fontSize: 16, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={loadOrderDetails}>
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : orderData ? (
            <>
              {/* Debug info in development */}
              {__DEV__ && (
                <View style={{ padding: 10, backgroundColor: '#f0f0f0', marginBottom: 10 }}>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    Debug: Order ID: {orderId}, Items: {orderData.items?.length || 0}
                  </Text>
                </View>
              )}
              
              {/* Order Summary Card */}
              <View style={styles.orderSummaryCard}>
                <Text style={styles.orderDetailsNumber}>Order {orderData.orderNumber || `#${orderData.id}`}</Text>
                
                <View style={styles.orderDetailsInfo}>
                  <View style={styles.orderDetailsRow}>
                    <Text style={styles.orderDetailsLabel}>Order Date</Text>
                    <Text style={styles.orderDetailsValue}>
                      {formatDate(orderData.createdAt || orderData.orderDate || orderData.dateCreated)}
                    </Text>
                  </View>
                  
                  <View style={styles.orderDetailsRow}>
                    <Text style={styles.orderDetailsLabel}>Total</Text>
                    <Text style={[styles.orderDetailsValue, { fontSize: 18, fontWeight: 'bold', color: colors.primary }]}>
                      ₹{(orderData.total || orderData.orderTotal || orderData.finalAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                  
                  {/* Subtotal, Delivery, Tax breakdown */}
                  {(orderData.subtotal || orderData.deliveryCharge || orderData.tax) && (
                    <>
                      {orderData.subtotal && (
                        <View style={styles.orderDetailsRow}>
                          <Text style={styles.orderDetailsLabel}>Subtotal</Text>
                          <Text style={styles.orderDetailsValue}>₹{(orderData.subtotal || 0).toFixed(2)}</Text>
                        </View>
                      )}
                      {orderData.deliveryCharge && (
                        <View style={styles.orderDetailsRow}>
                          <Text style={styles.orderDetailsLabel}>Delivery Charge</Text>
                          <Text style={styles.orderDetailsValue}>₹{(orderData.deliveryCharge || 0).toFixed(2)}</Text>
                        </View>
                      )}
                      {orderData.tax && (
                        <View style={styles.orderDetailsRow}>
                          <Text style={styles.orderDetailsLabel}>Tax</Text>
                          <Text style={styles.orderDetailsValue}>₹{(orderData.tax || 0).toFixed(2)}</Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  <View style={styles.orderDetailsRow}>
                    <Text style={styles.orderDetailsLabel}>Status</Text>
                    <View 
                      style={[
                        styles.orderDetailsStatusBadge,
                        { backgroundColor: getStatusColor(orderData.orderStatus || orderData.status).backgroundColor }
                      ]}
                    >
                      <Text 
                        style={[
                          styles.orderDetailsStatusText,
                          { color: getStatusColor(orderData.orderStatus || orderData.status).color }
                        ]}
                      >
                        {formatStatus(orderData.orderStatus || orderData.status)}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Payment Status */}
                  {orderData.paymentStatus && (
                    <View style={styles.orderDetailsRow}>
                      <Text style={styles.orderDetailsLabel}>Payment</Text>
                      <View 
                        style={[
                          styles.orderDetailsStatusBadge,
                          { 
                            backgroundColor: orderData.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                          }
                        ]}
                      >
                        <Text 
                          style={[
                            styles.orderDetailsStatusText,
                            { color: orderData.paymentStatus === 'paid' ? '#166534' : '#92400e' }
                          ]}
                        >
                          {formatStatus(orderData.paymentStatus)}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Shiprocket Status */}
                  {(orderData.shiprocketStatus || orderData.shiprocketOrderId) && (
                    <View style={styles.orderDetailsRow}>
                      <Text style={styles.orderDetailsLabel}>Shipping Status</Text>
                      <View 
                        style={[
                          styles.orderDetailsStatusBadge,
                          { 
                            backgroundColor: getShiprocketStatusColor(orderData.shiprocketStatus) + '20',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }
                        ]}
                      >
                        <Text style={{ fontSize: 10 }}>🚚</Text>
                        <Text 
                          style={[
                            styles.orderDetailsStatusText,
                            { color: getShiprocketStatusColor(orderData.shiprocketStatus) }
                          ]}
                        >
                          {formatShiprocketStatus(orderData.shiprocketStatus) || 'Tracking'}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Shiprocket Tracking Info */}
                  {(orderData.shiprocketAWB || orderData.trackingNumber) && (
                    <View style={styles.orderDetailsRow}>
                      <Text style={styles.orderDetailsLabel}>Tracking Number</Text>
                      <Text style={[styles.orderDetailsValue, { fontSize: 12, fontWeight: '600' }]}>
                        {orderData.shiprocketAWB || orderData.trackingNumber}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Shipping Address */}
              {orderData.shippingAddress && (
                <View style={[styles.orderSummaryCard, { marginTop: 16 }]}>
                  <Text style={[styles.orderDetailsItemsTitle, { marginBottom: 12 }]}>Shipping Address</Text>
                  <View style={styles.orderDetailsInfo}>
                    {orderData.shippingAddress.name && (
                      <Text style={[styles.orderDetailsValue, { marginBottom: 4 }]}>
                        {orderData.shippingAddress.name}
                      </Text>
                    )}
                    {orderData.shippingAddress.phone && (
                      <Text style={[styles.orderDetailsValue, { marginBottom: 4, color: colors.textSecondary }]}>
                        {orderData.shippingAddress.phone}
                      </Text>
                    )}
                    {orderData.shippingAddress.address && (
                      <Text style={[styles.orderDetailsValue, { marginBottom: 4 }]}>
                        {orderData.shippingAddress.address}
                      </Text>
                    )}
                    <Text style={[styles.orderDetailsValue, { color: colors.textSecondary }]}>
                      {[
                        orderData.shippingAddress.city,
                        orderData.shippingAddress.state,
                        orderData.shippingAddress.postalCode,
                      ].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Items Section */}
              {orderData.items && orderData.items.length > 0 && (
                <>
                  <Text style={styles.orderDetailsItemsTitle}>Items ({orderData.items.length})</Text>
                  
                  <View style={styles.orderDetailsItemsList}>
                    {orderData.items.map((item, index) => {
                      const itemPrice = item.price || item.unitPrice || 0;
                      const itemQuantity = item.quantity || 1;
                      const itemTotal = itemPrice * itemQuantity;
                      
                      return (
                        <View key={item.itemId || item.id || index} style={styles.orderDetailsItemCard}>
                          <View style={{
                            width: 60,
                            height: 60,
                            backgroundColor: colors.gray100,
                            borderRadius: 8,
                            marginRight: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}>
                            {item.coverImageUrl || item.image ? (
                              <Image 
                                source={{ uri: item.coverImageUrl || item.image }} 
                                style={{ width: 60, height: 60, borderRadius: 8 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={{ fontSize: 24 }}>📚</Text>
                            )}
                          </View>
                          <View style={[styles.orderDetailsItemContent, { flex: 1 }]}>
                            <Text style={styles.orderDetailsItemTitle} numberOfLines={2}>
                              {item.title || item.bookTitle || item.name || 'Unknown Product'}
                            </Text>
                            <Text style={styles.orderDetailsItemQuantity}>
                              Quantity: {itemQuantity} × ₹{itemPrice.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={[styles.orderDetailsItemPrice, { fontWeight: '600' }]}>
                            ₹{itemTotal.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
                No order data available
              </Text>
              {orderId && (
                <TouchableOpacity style={styles.primaryButton} onPress={loadOrderDetails}>
                  <Text style={styles.primaryButtonText}>Load Order</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;
