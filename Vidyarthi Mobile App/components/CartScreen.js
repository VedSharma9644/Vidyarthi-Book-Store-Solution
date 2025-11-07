import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const CartScreen = ({ onTabPress, onBack, onGoToCheckout }) => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Mathematics Textbook',
      price: 25.00,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9yVc1bCQF4zVs4Ue_7PhT387awABIWW9WP6f4RrQ8kXFP1nF42HzCJpKMRqIYJn95aS5-bg_Hi2KlI_5l3x0PYBMOS5PWdr0oHCkXzivd3YOfiwVLS20Z55otAd3opOErlMAoPEAIYNsV25L4W4FM_dbtPGg7u48idRRPpe9L89mXb3zf9zfzjErk9Yor0IKFD65oOWPnzIABd6HVIAbvYWOArEWQPtVHT89Gbc-5P2qQewash02GfHzxyH6t0gi43pLrHYr9vJw',
    },
    {
      id: 2,
      name: 'English Literature Anthology',
      price: 30.00,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4i6jk1Ic2KqxDR7IF85TbylMvg6SOOJbFcgKRljMgt-kMfQO-KNzB6KpxV7QVjnhG_9c4GGEgDxkevgDQJ-obErDV_WBUmAzLeJBoAlmA3nQu9i79MEHIsanq9qT6kmCWvaJDTeNF0c5KY5BdZMDWystjZbq16160MRFJfqTVmm_m5mN_WyRXlK1beFDoTKCJ7xiLZZ-_NH1GB5BRyHLBnoZgOO1qhw43IysGbMXqqxU4XV1VJi-KVWCrsRcfvuHD7dZrXIAfqvA',
    },
    {
      id: 3,
      name: 'Science Lab Manual',
      price: 20.00,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZAtkILFk4myMehCZlAjpR104EbhLarGjSXoR8CjdVNqVmaFZ8Q47jAH5_SLqM14K2xF9RvTGNE-XzbEuAJFA8tryeJ93CbnP-bRJ4LYSyp2BJeU2ImcdQCl3TxKRKsH0JAEVJzi2C4eqvOuvhYaj4gazkFP_dnAGYPCXF6w7M8PfR4wFVJ1Jdgmn-rpYZX5WMEXwQY86ImLZXZzBCKyWqxt2cNdDfVeOLhmTZugayZhp1w1awfqitZAeir-bkLz4cPKRQk0oJAdc',
    },
    {
      id: 4,
      name: 'History Workbook',
      price: 22.00,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHo-GQL78V8rnYhpnlBgRHds7kxCbWwmEfaL6DsLW63mdoKyl8pc3pwcMJpvdaIKOcn1HqXnlq7fSIpKpLboOd0PEvIeqVdsyKnFsqG68FSKVBGO6rwxvj8rgMqWqUmSH-PgH8sO7bbpK-3Ojj5nruaQDToOy2eMxnKn4OmLDBZqPpVpFzz0Ydx0dCEtEhGaCxzHPGCYw8TcIh2kruGT7YT4nKeRyW1Nnef4yGF0YnB8-WlRR9YxTAM-p2ocdkMNhinvK-78K9jtA',
    },
    {
      id: 5,
      name: 'Foreign Language Dictionary',
      price: 28.00,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4YqwcmQfm1rXag-rzvp_z_xTPT2UPqlSqN2D93I8mVGcTSntjOE6R8_wc7s0GzdjzsUtfMKphRHgIwPK0CPTSG84teHbvPDCSEuONZBP_x28feIsXenoWbqc9Kq_UdmD2N9iwQNezxXxkv5VBiYtmJG8NPMOFp3r1XkrJjDkttmzeTCiiZwaKn_mUzA_8IwhTMhRO30jZtsG9wifzrz70a1fyKBIPoCK0j74XJgj1k2QuwstAPBtj_ooEtKdoeLR_YAS4i3fxzgA',
    },
  ]);

  const updateQuantity = (id, change) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handlePlaceOrder = () => {
    if (onGoToCheckout) {
      onGoToCheckout();
    } else {
      Alert.alert('Order Placed', `Your order total is $${calculateTotal().toFixed(2)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.cartHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.cartHeaderTitle}>Review Order</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.cartMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cartContent}>
          <Text style={styles.cartSectionTitle}>Items for Grade 10</Text>
          
          {/* Cart Items */}
          <View style={styles.cartItemsContainer}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.bookImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, -1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummaryContainer}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            <View style={styles.orderSummaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${calculateSubtotal().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>Free</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxes</Text>
                <Text style={styles.summaryValue}>${calculateTax().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>${calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.placeOrderContainer}>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="cart" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default CartScreen;
