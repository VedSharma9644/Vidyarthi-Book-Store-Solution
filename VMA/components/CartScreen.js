import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

const CartScreen = ({ onTabPress, onBack, onGoToCheckout }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State for dropdown expansion (open by default)
  const [expandedCategories, setExpandedCategories] = useState({
    mandatoryTextbooks: true,
    optionalItems: true,
  });
  
  // State for individual optional bundle expansion (open by default)
  const [expandedBundles, setExpandedBundles] = useState({});

  // Load cart data from API
  const loadCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiService.getCart();
      
      if (result.success && result.data) {
        // Transform cart items to match component structure
        const items = (result.data.items || []).map(item => {
          // Filter out "N/A" values and treat them as empty
          
          return {
            id: item.itemId,
            itemId: item.itemId,
            name: item.title || 'Unknown Item',
            price: item.price || 0,
            quantity: item.quantity || 1,
            image: item.coverImageUrl || '',
            subtotal: (item.price || 0) * (item.quantity || 1),
            bookType: item.bookType || '', // Store bookType to identify textbooks
          };
        });
        
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
      setIsRefreshing(false);
    }
  };

  // Load cart on mount
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

  // Check if item is a textbook (mandatory/bundled item)
  // Note: All items are stored in the "books" collection in Firebase.
  // We distinguish textbooks from optional items (stationery, uniforms, etc.) 
  // by checking the bookType field: 'TEXTBOOK' = mandatory, others = optional
  const isTextbook = (item) => {
    // If bookType is missing, we can't determine if it's a textbook
    // In this case, we'll default to NOT being a textbook (show delete button)
    // The backend should populate bookType automatically, but this is a safety check
    if (!item.bookType) {
      console.warn('Item missing bookType:', item.itemId, item.name);
      return false; // Default to optional if bookType is missing
    }
    return item.bookType === 'TEXTBOOK';
  };

  // Update quantity using API
  const updateQuantity = async (itemId, change) => {
    try {
      const item = cartItems.find(i => i.itemId === itemId);
      if (!item) return;

      // For textbooks, prevent quantity from going below 1
      const minQuantity = isTextbook(item) ? 1 : 0;
      const newQuantity = Math.max(minQuantity, item.quantity + change);
      
      // For textbooks, don't allow removing by decreasing quantity
      if (isTextbook(item) && newQuantity < 1) {
        Alert.alert('Cannot Remove', 'Textbooks are mandatory items and cannot be removed from the cart.');
        return;
      }
      
      if (newQuantity === 0) {
        // Remove item if quantity becomes 0 (only for non-textbooks)
        await removeItem(itemId);
        return;
      }

      setIsUpdating(true);
      const result = await ApiService.updateCartItem(itemId, newQuantity);
      
      if (result.success) {
        // Reload cart to get updated data
        await loadCart();
      } else {
        Alert.alert('Error', result.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove item using API
  const removeItem = async (itemId) => {
    // Find the item to check if it's a textbook
    const item = cartItems.find(i => i.itemId === itemId);
    
    // Prevent removing textbooks
    if (item && isTextbook(item)) {
      Alert.alert('Cannot Remove', 'Textbooks are mandatory items and cannot be removed from the cart.');
      return;
    }

    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              const result = await ApiService.removeCartItem(itemId);
              
              if (result.success) {
                // Reload cart to get updated data
                await loadCart();
              } else {
                Alert.alert('Error', result.message || 'Failed to remove item');
              }
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  // Delivery charge per package (in INR)
  const DELIVERY_CHARGE = 300;

  // Calculate subtotal from cart items
  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
  };
  

  // Calculate delivery charge (300 INR per package/order)
  const calculateDelivery = () => {
    // One delivery charge per order/package
    return cartItems.length > 0 ? DELIVERY_CHARGE : 0;
  };

  // Calculate total (subtotal + delivery only, no taxes)
  const calculateTotal = () => {
    return calculateSubtotal() + calculateDelivery();
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

  // Handle place order
  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Please add items before placing an order.');
      return;
    }

    if (onGoToCheckout) {
      onGoToCheckout();
    } else {
      Alert.alert('Order Placed', `Your order total is ₹${calculateTotal().toFixed(2)}`);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'This will remove all items from your cart. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              const result = await ApiService.clearCart();
  
              if (result.success) {
                await loadCart();
              } else {
                Alert.alert('Error', result.message || 'Failed to clear cart');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cart. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };
  

  // Handle pull to refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    loadCart();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.cartHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.cartHeaderTitle}>Review Order</Text>
        <TouchableOpacity
          onPress={handleClearCart}
          style={{
            borderWidth: 1,
            borderColor: '#e74c3c',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 14, marginRight: 4 }}>🗑️</Text>
          <Text
            style={{
              color: '#ffffff',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            Clear
          </Text>
        </TouchableOpacity>


      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.cartMainContent} 
        contentContainerStyle={{ paddingBottom: cartItems.length > 0 ? 200 : 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.cartContent}>
          {/* Loading State */}
          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>
                Loading cart...
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
                Add items to your cart to see them here
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.cartSectionTitle}>Cart Items</Text>
              
              {/* Cart Items - Grouped by Category */}
              {(() => {
                const { textbooks, optionalByType } = groupItemsByCategory();
                return (
                  <>
                    {/* Mandatory Textbooks Section */}
                    {textbooks.length > 0 && (
                      <>
                        <TouchableOpacity
                          onPress={() => toggleCategory('mandatoryTextbooks')}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingTop: 12,
                            paddingBottom: 8,
                          }}
                        >
                          <Text style={{
                            color: '#0e1b16',
                            fontSize: 18,
                            fontWeight: 'bold',
                          }}>
                            Mandatory Textbooks ({textbooks.length})
                          </Text>
                          <Text style={{
                            fontSize: 16,
                            color: '#06412c',
                          }}>
                            {expandedCategories.mandatoryTextbooks ? '▼' : '▶'}
                          </Text>
                        </TouchableOpacity>
                        
                        {expandedCategories.mandatoryTextbooks && (
                          <View style={styles.cartItemsContainer}>
                            {textbooks.map((item) => {
                  const imageUri = item.image && item.image.trim() !== '' ? item.image : null;
                  
                  return (
                    <View key={item.itemId || item.id} style={styles.cartItem}>
                      <View style={{
                        width: 80,
                        height: 80,
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
                            style={{ width: 80, height: 80 }}
                            resizeMode="cover"
                            onError={() => console.log('Image load error for:', item.name)}
                          />
                        ) : (
                          <Text style={{ color: '#4d997e', fontSize: 32 }}>📚</Text>
                        )}
                      </View>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>

                        <Text style={styles.itemPrice}>
                          ₹{(item.price || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.quantityControls}>
                        {/* Show quantity as read-only for all items */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ 
                            color: '#666', 
                            fontSize: 14,
                            fontWeight: '500',
                            marginRight: 8,
                          }}>
                            Qty: {item.quantity}
                          </Text>
                          {isTextbook(item) && (
                            <Text style={{ 
                              color: '#4d997e', 
                              fontSize: 12,
                              backgroundColor: '#e7f3ef',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 4,
                            }}>
                              Bundled
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
                          </View>
                        )}
                      </>
                    )}

                    {/* Optional Items by Type */}
                    {Object.keys(optionalByType).length > 0 && (
                      <>
                        <TouchableOpacity
                          onPress={() => toggleCategory('optionalItems')}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingTop: textbooks.length > 0 ? 16 : 12,
                            paddingBottom: 8,
                          }}
                        >
                          <Text style={{
                            color: '#0e1b16',
                            fontSize: 18,
                            fontWeight: 'bold',
                          }}>
                            Optional Items ({Object.values(optionalByType).reduce((sum, group) => sum + group.items.length, 0)})
                          </Text>
                          <Text style={{
                            fontSize: 16,
                            color: '#06412c',
                          }}>
                            {expandedCategories.optionalItems ? '▼' : '▶'}
                          </Text>
                        </TouchableOpacity>
                        
                        {expandedCategories.optionalItems && (
                          <>
                            {Object.values(optionalByType).map((group) => (
                              <View key={group.type} style={{ marginBottom: 8 }}>
                                <TouchableOpacity
                                  onPress={() => toggleBundleExpansion(group.type)}
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingHorizontal: 16,
                                    paddingTop: 8,
                                    paddingBottom: 4,
                                  }}
                                >
                                  <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#06412c',
                                  }}>
                                    {group.title} ({group.items.length})
                                  </Text>
                                  <Text style={{
                                    fontSize: 14,
                                    color: '#06412c',
                                  }}>
                                    {expandedBundles[group.type] ? '▼' : '▶'}
                                  </Text>
                                </TouchableOpacity>
                                
                                {expandedBundles[group.type] && (
                                  <View style={styles.cartItemsContainer}>
                                    {group.items.map((item) => {
                                    const imageUri = item.image && item.image.trim() !== '' ? item.image : null;
                                    
                                    return (
                                      <View key={item.itemId || item.id} style={styles.cartItem}>
                                        <View style={{
                                          width: 80,
                                          height: 80,
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
                                              style={{ width: 80, height: 80 }}
                                              resizeMode="cover"
                                              onError={() => console.log('Image load error for:', item.name)}
                                            />
                                          ) : (
                                            <Text style={{ color: '#4d997e', fontSize: 32 }}>📚</Text>
                                          )}
                                        </View>
                                        <View style={styles.itemDetails}>
                                          <Text style={styles.itemName} numberOfLines={2}>
                                            {item.name}
                                          </Text>
                                          <Text style={styles.itemPrice}>
                                            ₹{(item.price || 0).toFixed(2)}
                                          </Text>
                                        </View>
                                        <View style={styles.quantityControls}>
                                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ 
                                              color: '#666', 
                                              fontSize: 14,
                                              fontWeight: '500',
                                              marginRight: 8,
                                            }}>
                                              Qty: {item.quantity}
                                            </Text>
                                          </View>
                                        </View>
                                      </View>
                                    );
                                  })}
                                  </View>
                                )}
                              </View>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </>
          )}

        </View>
      </ScrollView>

      {/* Sticky Order Summary - Only show if cart has items */}
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
          <Text style={styles.orderSummaryTitle}>Order Summary</Text>
          <View style={styles.orderSummaryDetails}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charges</Text>
              <Text style={styles.summaryValue}>₹{calculateDelivery().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>₹{calculateTotal().toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Place Order Button - Only show if cart has items */}
      {!isLoading && !error && cartItems.length > 0 && (
        <View style={styles.placeOrderContainer}>
          <TouchableOpacity 
            style={[
              styles.placeOrderButton,
              isUpdating && { opacity: 0.6 }
            ]} 
            onPress={handlePlaceOrder}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="cart" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default CartScreen;
