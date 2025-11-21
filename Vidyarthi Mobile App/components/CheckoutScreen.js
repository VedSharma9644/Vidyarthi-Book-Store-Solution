import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import Razorpay with error handling
let RazorpayCheckout = null;
let razorpayImportError = null;
try {
  const RazorpayModule = require('react-native-razorpay');
  RazorpayCheckout = RazorpayModule.default || RazorpayModule;
  console.log('Razorpay module import attempt:', {
    moduleExists: !!RazorpayModule,
    defaultExists: !!RazorpayModule?.default,
    checkoutExists: !!RazorpayCheckout,
    hasOpenMethod: !!(RazorpayCheckout?.open),
  });
} catch (error) {
  razorpayImportError = error;
  console.error('Failed to import Razorpay module:', error);
}

// Check if Razorpay is available
const isRazorpayAvailable = () => {
  try {
    if (!RazorpayCheckout) {
      console.error('RazorpayCheckout is null - native module not linked');
      return false;
    }
    if (typeof RazorpayCheckout.open !== 'function') {
      console.error('RazorpayCheckout.open is not a function');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Razorpay module not available:', error);
    return false;
  }
};
import { styles, colors } from '../css/styles';
import ApiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const CheckoutScreen = ({ onBack, onPlaceOrder }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [showAddressSelectionModal, setShowAddressSelectionModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const webViewRef = useRef(null);

  // Delivery charge per package (in INR) - same as CartScreen
  const DELIVERY_CHARGE = 300;

  // Load saved addresses and set default
  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const addressesJson = await AsyncStorage.getItem('shippingAddresses');
      if (addressesJson) {
        const addresses = JSON.parse(addressesJson);
        setSavedAddresses(addresses);
        
        // Auto-select default address if available
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setShippingAddress({
            name: defaultAddress.name || '',
            phone: defaultAddress.phone || '',
            address: defaultAddress.address || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
            postalCode: defaultAddress.postalCode || '',
            country: defaultAddress.country || 'India',
          });
        } else if (addresses.length > 0) {
          // If no default, select first address
          const firstAddress = addresses[0];
          setSelectedAddressId(firstAddress.id);
          setShippingAddress({
            name: firstAddress.name || '',
            phone: firstAddress.phone || '',
            address: firstAddress.address || '',
            city: firstAddress.city || '',
            state: firstAddress.state || '',
            postalCode: firstAddress.postalCode || '',
            country: firstAddress.country || 'India',
          });
        } else if (user) {
          // Fallback to user data if no saved addresses
          const userAddress = user.address || {};
          setShippingAddress({
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.trim()
              : user.firstName || user.userName || '',
            phone: user.phoneNumber || '',
            address: userAddress.address || '',
            city: userAddress.city || '',
            state: userAddress.state || '',
            postalCode: userAddress.postalCode || '',
            country: userAddress.country || 'India',
          });
        }
      } else if (user) {
        // Fallback to user data if no saved addresses
        const userAddress = user.address || {};
        setShippingAddress({
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`.trim()
            : user.firstName || user.userName || '',
          phone: user.phoneNumber || '',
          address: userAddress.address || '',
          city: userAddress.city || '',
          state: userAddress.state || '',
          postalCode: userAddress.postalCode || '',
          country: userAddress.country || 'India',
        });
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  // Load cart data from API
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiService.getCart();
      
      if (result.success && result.data) {
        // Transform cart items to match component structure
        const items = (result.data.items || []).map(item => ({
          id: item.itemId,
          itemId: item.itemId,
          title: item.title || 'Unknown Item',
          author: item.author || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.coverImageUrl || '',
          subtotal: item.subtotal || (item.price * (item.quantity || 1)),
        }));
        
        setCartItems(items);
      } else {
        setCartItems([]);
        if (result.message) {
          setError(result.message);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart. Please try again.');
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate subtotal from cart items
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.subtotal || (item.price * item.quantity)), 0);
  };

  // Calculate delivery charge (300 INR per package/order)
  const calculateDelivery = () => {
    return cartItems.length > 0 ? DELIVERY_CHARGE : 0;
  };

  // Calculate tax (10% on subtotal only, not including delivery)
  const calculateTax = () => {
    return calculateSubtotal() * 0.1;
  };

  // Calculate total (subtotal + tax + delivery)
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateDelivery();
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before placing an order.');
      return;
    }

    try {
      const totalAmount = calculateTotal();
      const receipt = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('Creating payment order:', { totalAmount, receipt });

      // Create Razorpay order
      const orderResult = await ApiService.createPaymentOrder(totalAmount, receipt);

      console.log('Payment order result:', orderResult);

      if (!orderResult.success || !orderResult.data) {
        console.error('Failed to create payment order:', orderResult.message);
        Alert.alert('Error', orderResult.message || 'Failed to create payment order');
        return;
      }

      const orderData = orderResult.data;

      // Validate order data
      if (!orderData.keyId || !orderData.orderId || !orderData.amount) {
        console.error('Invalid order data:', orderData);
        Alert.alert('Error', 'Invalid payment order data. Please try again.');
        return;
      }

      // Log order details for debugging
      console.log('Opening Razorpay WebView checkout:', {
        key: orderData.keyId,
        amount: orderData.amount,
        order_id: orderData.orderId,
        currency: orderData.currency || 'INR',
      });

      // Use WebView-based Razorpay checkout (works without native modules)
      setRazorpayOrderData(orderData);
      setShowRazorpayWebView(true);
    } catch (error) {
      console.error('Error initiating payment:', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    }
  };

  const handleEditShipping = () => {
    // Reload addresses in case new ones were added
    loadSavedAddresses();
    setShowAddressSelectionModal(true);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    setShippingAddress({
      name: address.name || '',
      phone: address.phone || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
    });
    setShowAddressSelectionModal(false);
  };

  const formatAddressDisplay = (address) => {
    const parts = [];
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    return parts.join(', ');
  };


  const handleEditPayment = () => {
    Alert.alert('Edit Payment', 'Edit payment method functionality will be implemented');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.checkoutHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.checkoutHeaderTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.checkoutMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.checkoutContent}>
          {/* Loading State */}
          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>
                Loading order...
              </Text>
            </View>
          ) : error ? (
            <View style={{ paddingVertical: 40, paddingHorizontal: 16, alignItems: 'center' }}>
              <Text style={{ color: '#e74c3c', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
                {error}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
                onPress={loadCart}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : cartItems.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
              <Text style={{ color: '#666', fontSize: 18, fontWeight: '500', marginBottom: 8 }}>
                Your cart is empty
              </Text>
              <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>
                Please add items to your cart before checkout
              </Text>
            </View>
          ) : (
            <>
              {/* Order Summary Section */}
              <View style={styles.checkoutSection}>
                <Text style={styles.checkoutSectionTitle}>Order Summary</Text>
                
                <View style={styles.orderItemsContainer}>
                  {cartItems.map((item) => {
                    const imageUri = item.image && item.image.trim() !== '' ? item.image : null;
                    
                    return (
                      <View key={item.itemId || item.id} style={styles.orderItem}>
                        <View style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          backgroundColor: '#e7f3ef',
                          justifyContent: 'center',
                          alignItems: 'center',
                          overflow: 'hidden',
                          marginRight: 12,
                        }}>
                          {imageUri ? (
                            <Image 
                              source={{ uri: imageUri }} 
                              style={{ width: 60, height: 60 }}
                              resizeMode="cover"
                              onError={() => console.log('Image load error for:', item.title)}
                            />
                          ) : (
                            <Text style={{ color: '#4d997e', fontSize: 24 }}>📚</Text>
                          )}
                        </View>
                        <View style={styles.orderItemDetails}>
                          <Text style={styles.orderItemTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          {item.author ? (
                            <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                              by {item.author}
                            </Text>
                          ) : null}
                          <Text style={styles.orderItemQuantity}>
                            Quantity: {item.quantity}
                          </Text>
                        </View>
                        <Text style={styles.orderItemPrice}>
                          ₹{(item.price || 0).toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Price Breakdown */}
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceValue}>₹{calculateSubtotal().toFixed(2)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Delivery Charges</Text>
                    <Text style={styles.priceValue}>₹{calculateDelivery().toFixed(2)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Taxes (10%)</Text>
                    <Text style={styles.priceValue}>₹{calculateTax().toFixed(2)}</Text>
                  </View>
                  <View style={styles.priceTotalRow}>
                    <Text style={styles.priceTotalLabel}>Total</Text>
                    <Text style={styles.priceTotalValue}>₹{calculateTotal().toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Shipping Address Section - Always show if not loading and no error */}
          {!isLoading && !error && (
            <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Shipping Address</Text>
            <TouchableOpacity style={styles.infoCard} onPress={handleEditShipping}>
              <View style={styles.infoCardLeft}>
                <View style={styles.infoCardIcon}>
                  <Text style={styles.infoCardIconText}>📍</Text>
                </View>
                <View style={styles.infoCardDetails}>
                  <Text style={styles.infoCardTitle}>
                    {shippingAddress.name || 'Add Shipping Address'}
                  </Text>
                  <Text style={styles.infoCardSubtitle} numberOfLines={2}>
                    {shippingAddress.address && shippingAddress.city && shippingAddress.state
                      ? `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`
                      : 'Tap to add shipping address'}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
          </View>
          )}

          {/* Payment Method Section - Always show if not loading and no error */}
          {!isLoading && !error && (
            <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Payment Method</Text>
            <TouchableOpacity style={styles.infoCard} onPress={handleEditPayment}>
              <View style={styles.infoCardLeft}>
                <View style={styles.infoCardIcon}>
                  <Text style={styles.infoCardIconText}>💳</Text>
                </View>
                <View style={styles.infoCardDetails}>
                  <Text style={styles.infoCardTitle}>Mastercard</Text>
                  <Text style={styles.infoCardSubtitle}>**** **** **** 1234</Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
          </View>
          )}
        </View>
      </ScrollView>

      {/* Place Order Button - Only show if cart has items */}
      {!isLoading && !error && cartItems.length > 0 && (
        <View style={styles.placeOrderContainer}>
          <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Razorpay WebView Modal */}
      <Modal
        visible={showRazorpayWebView}
        animationType="slide"
        onRequestClose={() => setShowRazorpayWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <TouchableOpacity
              onPress={() => {
                setShowRazorpayWebView(false);
                setRazorpayOrderData(null);
              }}
              style={{ padding: 8 }}
            >
              <Text style={{ fontSize: 24 }}>←</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginRight: 40 }}>
              Payment
            </Text>
          </View>
          {razorpayOrderData && (
            <WebView
              ref={webViewRef}
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
                    <style>
                      body {
                        margin: 0;
                        padding: 20px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: #f5f5f5;
                      }
                      .container {
                        text-align: center;
                      }
                      .loading {
                        color: #666;
                        font-size: 16px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="loading">Loading payment gateway...</div>
                    </div>
                    <script>
                      var options = {
                        "key": "${razorpayOrderData.keyId}",
                        "amount": ${razorpayOrderData.amount},
                        "currency": "${razorpayOrderData.currency || 'INR'}",
                        "order_id": "${razorpayOrderData.orderId}",
                        "name": "Vidyarthi Books",
                        "description": "Order Payment",
                        "image": "https://vidyarthibooksonline.com/images/logo.png",
                        "handler": function (response) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'payment_success',
                            data: {
                              razorpay_payment_id: response.razorpay_payment_id,
                              razorpay_order_id: response.razorpay_order_id,
                              razorpay_signature: response.razorpay_signature
                            }
                          }));
                        },
                        "prefill": {
                          "email": "",
                          "contact": ""
                        },
                        "theme": {
                          "color": "#3399cc"
                        },
                        "modal": {
                          "ondismiss": function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'payment_cancelled'
                            }));
                          }
                        }
                      };
                      var rzp = new Razorpay(options);
                      rzp.open();
                    </script>
                  </body>
                  </html>
                `,
              }}
              onMessage={async (event) => {
                try {
                  const message = JSON.parse(event.nativeEvent.data);
                  
                  if (message.type === 'payment_success') {
                    setShowRazorpayWebView(false);
                    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = message.data;
                    
                    // Verify payment
                    const verifyResult = await ApiService.verifyPayment(
                      razorpay_order_id,
                      razorpay_payment_id,
                      razorpay_signature
                    );

                    if (verifyResult.success) {
                      // Create order in database
                      const userId = user?.id || await AsyncStorage.getItem('userId');
                      console.log('📦 Creating order - User ID:', userId);
                      if (!userId) {
                        Alert.alert('Error', 'User not found. Please login again.');
                        return;
                      }

                      console.log('📦 Calling createOrder API with:', {
                        userId,
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                      });

                      const orderResult = await ApiService.createOrder(
                        {
                          razorpayOrderId: razorpay_order_id,
                          razorpayPaymentId: razorpay_payment_id,
                          razorpaySignature: razorpay_signature,
                        },
                        shippingAddress // Pass the shipping address
                      );

                      console.log('📦 Order creation result:', {
                        success: orderResult.success,
                        hasData: !!orderResult.data,
                        orderNumber: orderResult.data?.orderNumber,
                        orderId: orderResult.data?.id,
                        message: orderResult.message,
                      });

                      if (orderResult.success) {
                        Alert.alert(
                          'Payment Successful!',
                          `Your order has been placed successfully!\n\nOrder Number: ${orderResult.data?.orderNumber || razorpay_order_id}`,
                          [
                            {
                              text: 'OK',
                              onPress: () => {
                                if (onPlaceOrder) {
                                  onPlaceOrder();
                                }
                              },
                            },
                          ]
                        );
                      } else {
                        // Payment verified but order creation failed
                        Alert.alert(
                          'Payment Verified',
                          'Your payment was successful, but there was an issue saving your order. Please contact support with Order ID: ' + razorpay_order_id,
                          [
                            {
                              text: 'OK',
                              onPress: () => {
                                if (onPlaceOrder) {
                                  onPlaceOrder();
                                }
                              },
                            },
                          ]
                        );
                      }
                    } else {
                      Alert.alert('Payment Verification Failed', verifyResult.message || 'Please contact support.');
                    }
                  } else if (message.type === 'payment_cancelled') {
                    setShowRazorpayWebView(false);
                    console.log('Payment cancelled by user');
                  }
                } catch (error) {
                  console.error('Error processing payment message:', error);
                }
              }}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressSelectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addressSelectionModalContent}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Select Shipping Address</Text>
              <TouchableOpacity onPress={() => setShowAddressSelectionModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addressSelectionModalBody} showsVerticalScrollIndicator={false}>
              {savedAddresses.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
                  <Text style={{ color: '#666', fontSize: 18, fontWeight: '500', marginBottom: 8 }}>
                    No addresses saved
                  </Text>
                  <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>
                    Please add an address from your profile first
                  </Text>
                </View>
              ) : (
                savedAddresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressSelectionCard,
                      selectedAddressId === address.id && styles.addressSelectionCardSelected,
                    ]}
                    onPress={() => handleSelectAddress(address)}
                  >
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                    <View style={styles.addressSelectionCardContent}>
                      <Text style={styles.addressSelectionCardName}>{address.name}</Text>
                      <Text style={styles.addressSelectionCardPhone}>{address.phone}</Text>
                      <Text style={styles.addressSelectionCardAddress}>{formatAddressDisplay(address)}</Text>
                      {address.country && (
                        <Text style={styles.addressSelectionCardCountry}>{address.country}</Text>
                      )}
                    </View>
                    {selectedAddressId === address.id && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
