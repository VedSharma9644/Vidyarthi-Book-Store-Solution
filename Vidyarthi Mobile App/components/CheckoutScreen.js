import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import ApiService from '../services/apiService';

const CheckoutScreen = ({ onBack, onPlaceOrder }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delivery charge per package (in INR) - same as CartScreen
  const DELIVERY_CHARGE = 300;

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

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before placing an order.');
      return;
    }

    Alert.alert(
      'Order Placed!',
      `Your order total is ₹${calculateTotal().toFixed(2)}. Thank you for your purchase!`,
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
  };

  const handleEditShipping = () => {
    Alert.alert('Edit Shipping', 'Edit shipping address functionality will be implemented');
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
                  <Text style={styles.infoCardTitle}>Sophia Carter</Text>
                  <Text style={styles.infoCardSubtitle}>123 Elm Street, Anytown, USA</Text>
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
    </SafeAreaView>
  );
};

export default CheckoutScreen;
