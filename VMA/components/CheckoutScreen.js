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
  
  // State for dropdown expansion (open by default)
  const [expandedCategories, setExpandedCategories] = useState({
    mandatoryTextbooks: true,
    optionalItems: true,
  });
  
  // State for individual optional bundle expansion (open by default)
  const [expandedBundles, setExpandedBundles] = useState({});
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState(null);
  const [showAddressSelectionModal, setShowAddressSelectionModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [pendingAddAddress, setPendingAddAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });
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

  // Handle opening add address modal after selection modal closes
  useEffect(() => {
    if (!showAddressSelectionModal && pendingAddAddress) {
      // Wait for modal close animation to complete (300ms for slide animation)
      const timer = setTimeout(() => {
        setShowAddAddressModal(true);
        setPendingAddAddress(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [showAddressSelectionModal, pendingAddAddress]);

  const loadSavedAddresses = async () => {
    try {
      let addresses = [];
      
      // First, try to load from user data (database)
      try {
        const userData = await ApiService.getUserData();
        if (userData && userData.addresses && Array.isArray(userData.addresses) && userData.addresses.length > 0) {
          addresses = userData.addresses;
          // Sync to AsyncStorage for offline access
          await AsyncStorage.setItem('shippingAddresses', JSON.stringify(addresses));
          console.log('Loaded addresses from database');
        }
      } catch (apiError) {
        console.log('Could not load addresses from database, trying local storage:', apiError);
      }
      
      // If no addresses from database, try AsyncStorage
      if (addresses.length === 0) {
        const addressesJson = await AsyncStorage.getItem('shippingAddresses');
        if (addressesJson) {
          addresses = JSON.parse(addressesJson);
          console.log('Loaded addresses from local storage');
        }
      }
      
      if (addresses.length > 0) {
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

  // Initialize expanded bundles when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      const { optionalByType } = groupItemsByCategory();
      const initialExpandedBundles = {};
      Object.keys(optionalByType).forEach(type => {
        initialExpandedBundles[type] = true;
      });
      setExpandedBundles(initialExpandedBundles);
    }
  }, [cartItems]);

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
          name: item.title || 'Unknown Item',
          title: item.title || 'Unknown Item', // Keep for backward compatibility
          author: item.author || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.coverImageUrl || '',
          subtotal: item.subtotal || (item.price * (item.quantity || 1)),
          bookType: item.bookType || '', // Store bookType to identify textbooks
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

  // Calculate total (subtotal + delivery only, no taxes)
  const calculateTotal = () => {
    return calculateSubtotal() + calculateDelivery();
  };

  // Check if item is a textbook
  const isTextbook = (item) => {
    return item.bookType === 'TEXTBOOK';
  };

  // Group cart items by category
  const groupItemsByCategory = () => {
    const textbooks = [];
    const optionalByType = {};
    
    cartItems.forEach(item => {
      if (isTextbook(item)) {
        textbooks.push(item);
      } else {
        const type = item.bookType || 'OTHER';
        if (!optionalByType[type]) {
          optionalByType[type] = {
            type: type,
            title: type.charAt(0) + type.slice(1).toLowerCase(),
            items: [],
          };
        }
        optionalByType[type].items.push(item);
      }
    });
    
    return { textbooks, optionalByType };
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleBundleExpansion = (type) => {
    setExpandedBundles((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Validate shipping address before proceeding to payment
    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.phone) {
      Alert.alert(
        'Shipping Address Required',
        'Please add a shipping address before placing your order.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Add Address',
            onPress: () => {
              // Open address selection modal to add address
              loadSavedAddresses();
              setShowAddressSelectionModal(true);
            },
          },
        ]
      );
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

  const saveAddresses = async (updatedAddresses) => {
    try {
      // Save to AsyncStorage first
      await AsyncStorage.setItem('shippingAddresses', JSON.stringify(updatedAddresses));
      
      // Save to API/database
      try {
        const userData = await ApiService.getUserData();
        if (userData && (userData.id || user?.id)) {
          const userId = userData.id || user?.id;
          const updateData = {
            ...userData,
            addresses: updatedAddresses,
          };
          
          const updatedUserData = await ApiService.updateUserProfile(userId, updateData);
          
          // Update local storage with the updated user data from server
          if (updatedUserData) {
            await ApiService.storeUserData(updatedUserData);
          } else {
            // If API doesn't return updated data, update local storage manually
            await ApiService.storeUserData(updateData);
          }
          
          console.log('Addresses saved to database successfully');
        } else {
          console.log('User data not available, saved locally only');
        }
      } catch (apiError) {
        console.error('Could not save to API, saved locally only:', apiError);
        // Don't throw here - local save was successful
        // User can still use the address, it just won't sync until next login
      }
    } catch (error) {
      console.error('Error saving addresses:', error);
      throw error;
    }
  };

  const handleAddNewAddress = () => {
    // Close address selection modal first
    setShowAddressSelectionModal(false);
    // Set flag to open add modal after selection modal closes
    setPendingAddAddress(true);
    // Reset form data
    setAddressFormData({
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: savedAddresses.length === 0,
    });
  };

  // Handle opening add address modal after selection modal closes
  useEffect(() => {
    if (!showAddressSelectionModal && pendingAddAddress) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        setShowAddAddressModal(true);
        setPendingAddAddress(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showAddressSelectionModal, pendingAddAddress]);

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
              await saveAddresses(updatedAddresses);
              setSavedAddresses(updatedAddresses);
              
              // If deleted address was selected, clear selection
              if (selectedAddressId === addressId) {
                setSelectedAddressId(null);
                setShippingAddress({
                  name: '',
                  phone: '',
                  address: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  country: 'India',
                });
              }
              
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSaveNewAddress = async () => {
    // Validation
    if (!addressFormData.name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!addressFormData.phone.trim() || addressFormData.phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!addressFormData.address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }
    if (!addressFormData.city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }
    if (!addressFormData.state.trim()) {
      Alert.alert('Error', 'Please enter your state');
      return;
    }
    if (!addressFormData.postalCode.trim()) {
      Alert.alert('Error', 'Please enter your postal code');
      return;
    }

    try {
      setIsSavingAddress(true);
      let updatedAddresses;

      // Add new address
      const newAddress = {
        ...addressFormData,
        id: Date.now().toString(),
      };
      
      // If this is set as default, remove default from others
      if (addressFormData.isDefault) {
        updatedAddresses = savedAddresses.map(addr => ({ ...addr, isDefault: false }));
      } else {
        updatedAddresses = [...savedAddresses];
      }
      updatedAddresses.push(newAddress);

      await saveAddresses(updatedAddresses);
      setSavedAddresses(updatedAddresses);
      
      // Select the newly added address
      setSelectedAddressId(newAddress.id);
      setShippingAddress({
        name: newAddress.name || '',
        phone: newAddress.phone || '',
        address: newAddress.address || '',
        city: newAddress.city || '',
        state: newAddress.state || '',
        postalCode: newAddress.postalCode || '',
        country: newAddress.country || 'India',
      });
      
      setShowAddAddressModal(false);
      setShowAddressSelectionModal(false);
      setPendingAddAddress(false);
      Alert.alert('Success', 'Address added successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
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
      <ScrollView 
        style={styles.checkoutMainContent} 
        contentContainerStyle={{ paddingBottom: cartItems.length > 0 ? 200 : 20 }}
        showsVerticalScrollIndicator={false}
      >
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
                <Text style={styles.cartSectionTitle}>Cart Items</Text>
                
                {/* Cart Items - Grouped by Category */}
                {(() => {
                  const { textbooks, optionalByType } = groupItemsByCategory();
                  return (
                    <>
                      {/* Mandatory Textbooks Section - Bundle Summary Only */}
                      {textbooks.length > 0 && (
                        <View style={{
                          backgroundColor: '#f8f9fa',
                          borderRadius: 8,
                          padding: 16,
                          marginHorizontal: 16,
                          marginTop: 12,
                          marginBottom: 8,
                        }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                color: '#0e1b16',
                                fontSize: 16,
                                fontWeight: '600',
                                marginBottom: 4,
                              }}>
                                Mandatory Textbooks Bundle
                              </Text>
                              <Text style={{
                                color: '#666',
                                fontSize: 14,
                              }}>
                                {textbooks.length} {textbooks.length === 1 ? 'item' : 'items'}
                              </Text>
                            </View>
                            <Text style={{
                              color: '#06412c',
                              fontSize: 18,
                              fontWeight: 'bold',
                            }}>
                              ₹{textbooks.reduce((sum, item) => sum + (item.subtotal || (item.price * item.quantity)), 0).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Optional Items by Type - Bundle Summary Only */}
                      {Object.keys(optionalByType).length > 0 && (
                        <>
                          {Object.values(optionalByType).map((group) => {
                            const bundleTotal = group.items.reduce((sum, item) => sum + (item.subtotal || (item.price * item.quantity)), 0);
                            return (
                              <View 
                                key={group.type} 
                                style={{
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: 8,
                                  padding: 16,
                                  marginHorizontal: 16,
                                  marginTop: textbooks.length > 0 ? 12 : 12,
                                  marginBottom: 8,
                                }}
                              >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{
                                      color: '#0e1b16',
                                      fontSize: 16,
                                      fontWeight: '600',
                                      marginBottom: 4,
                                    }}>
                                      {group.title} Bundle
                                    </Text>
                                    <Text style={{
                                      color: '#666',
                                      fontSize: 14,
                                    }}>
                                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                                    </Text>
                                  </View>
                                  <Text style={{
                                    color: '#06412c',
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                  }}>
                                    ₹{bundleTotal.toFixed(2)}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })()}
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

        </View>
      </ScrollView>

      {/* Sticky Order Summary - Price Breakdown */}
      {!isLoading && !error && cartItems.length > 0 && (
        <View style={{
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charges</Text>
              <Text style={styles.priceValue}>₹{calculateDelivery().toFixed(2)}</Text>
            </View>
            <View style={styles.priceTotalRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>₹{calculateTotal().toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

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
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            <View style={styles.addressSelectionModalContent}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Select Shipping Address</Text>
              <TouchableOpacity onPress={() => setShowAddressSelectionModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addressSelectionModalBody} showsVerticalScrollIndicator={false}>
              {/* Add New Address Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleAddNewAddress}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>+</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Add New Address
                </Text>
              </TouchableOpacity>

              {savedAddresses.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
                  <Text style={{ color: '#666', fontSize: 18, fontWeight: '500', marginBottom: 8 }}>
                    No addresses saved
                  </Text>
                  <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>
                    Tap "Add New Address" above to add your first address
                  </Text>
                </View>
              ) : (
                savedAddresses.map((address) => (
                  <View key={address.id} style={styles.addressSelectionCardWrapper}>
                    <TouchableOpacity
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
                    <TouchableOpacity
                      style={styles.addressDeleteButton}
                      onPress={() => handleDeleteAddress(address.id)}
                    >
                      <Text style={styles.addressDeleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Add New Address Modal */}
      <Modal
        visible={showAddAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddAddressModal(false);
          setPendingAddAddress(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <View style={styles.addressModalContent}>
                <View style={styles.addressModalHeader}>
                  <Text style={styles.addressModalTitle}>Add New Address</Text>
                  <TouchableOpacity onPress={() => {
                    setShowAddAddressModal(false);
                    setPendingAddAddress(false);
                  }}>
                    <Text style={styles.modalCloseButton}>✕</Text>
                  </TouchableOpacity>
                </View>

              <ScrollView 
                style={styles.addressModalBody} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={styles.formFieldContainer}>
                  <Text style={styles.formLabel}>Full Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter your full name"
                    placeholderTextColor={`${colors.textPrimary}60`}
                    value={addressFormData.name}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, name: text })}
                  />
                </View>

                <View style={styles.formFieldContainer}>
                  <Text style={styles.formLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={`${colors.textPrimary}60`}
                    value={addressFormData.phone}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, phone: text.replace(/[^0-9]/g, '').slice(0, 10) })}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>

                <View style={styles.formFieldContainer}>
                  <Text style={styles.formLabel}>Address *</Text>
                  <TextInput
                    style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Street address, apartment, suite, etc."
                    placeholderTextColor={`${colors.textPrimary}60`}
                    value={addressFormData.address}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, address: text })}
                    multiline
                  />
                </View>

                <View style={styles.formFieldContainer}>
                  <Text style={styles.formLabel}>City *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter city"
                    placeholderTextColor={`${colors.textPrimary}60`}
                    value={addressFormData.city}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, city: text })}
                  />
                </View>

                <View style={styles.formFieldContainer}>
                  <Text style={styles.formLabel}>State *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter state"
                    placeholderTextColor={`${colors.textPrimary}60`}
                    value={addressFormData.state}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, state: text })}
                  />
                </View>

                <View style={styles.formFieldContainer}>
                  <Text style={styles.formLabel}>Postal Code *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter postal code"
                    placeholderTextColor={`${colors.textPrimary}60`}
                    value={addressFormData.postalCode}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, postalCode: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formFieldContainer}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter country"
                    placeholderTextColor={`${colors.textPrimary}60`}
                    value={addressFormData.country}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, country: text })}
                  />
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAddressFormData({ ...addressFormData, isDefault: !addressFormData.isDefault })}
                >
                  <View style={[styles.checkbox, addressFormData.isDefault && styles.checkboxChecked]}>
                    {addressFormData.isDefault && <Text style={styles.checkboxCheckmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Set as default address</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveAddressButton, isSavingAddress && { opacity: 0.6 }]}
                  onPress={handleSaveNewAddress}
                  disabled={isSavingAddress}
                >
                  {isSavingAddress ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveAddressButtonText}>Save Address</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckoutScreen;

