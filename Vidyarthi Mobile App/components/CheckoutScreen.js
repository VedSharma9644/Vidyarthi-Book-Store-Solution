import React from 'react';
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

const CheckoutScreen = ({ onBack, onPlaceOrder }) => {
  const orderItems = [
    {
      id: 1,
      title: 'The Great Gatsby',
      quantity: 2,
      price: 20.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpGTgQT7qx370oqlJ6KVjgmic0fo6xtyyCojy2yyHAOXkp0LlK4yaZ7TXHTQxU7RAzIlEEPqRBS4wfcazR3-LPbadHeq0j1Wz4Kl4qRtm8nckLjBtXCUwDuQZ9BzeQhDxjguPWinrpRL3A0cjGTMELbeqV_6LIt1rvZtSFcOOvnq5K5QerlnDBb3x3T2J9HAZFwLCtrLaOxLGN9d9ruXpr7GtQ_LsAgQ_5VXWKm2WeDKV0122oIeSmXb9ySzWn3mvI-1TrWfPYRE',
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      quantity: 1,
      price: 15.00,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNtmZOuut_sY7RFjJXkq6kTTpDstNo2j-SjV0OEPFOoWdZVM_OBicmxx1jdcnCumNkYq1jvJqMIfAGaU0rGpHBR6d0-t8jpmJOvghk-s6JjiiIkRRKp3u7cBgP7VPshMCB5owu0WLjj3HsCnVrtJO4kJIr4cN8qS3YY11eLPSkS0X7Ub_Rig7bnLq7KPi2PGNYD0_219QH2R4fJ3J1rKWiyGwIaabLWGZ8NjfngMnf5_1cGmZcsCNU__GTMi3Db9vtVNwiQdjb7go',
    },
  ];

  const calculateSubtotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    return 5.00;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handlePlaceOrder = () => {
    Alert.alert(
      'Order Placed!',
      `Your order total is $${calculateTotal().toFixed(2)}. Thank you for your purchase!`,
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
          {/* Order Summary Section */}
          <View style={styles.checkoutSection}>
            <Text style={styles.checkoutSectionTitle}>Order Summary</Text>
            
            <View style={styles.orderItemsContainer}>
              {orderItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                  <View style={styles.orderItemDetails}>
                    <Text style={styles.orderItemTitle}>{item.title}</Text>
                    <Text style={styles.orderItemQuantity}>Quantity: {item.quantity}</Text>
                  </View>
                  <Text style={styles.orderItemPrice}>${item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {/* Price Breakdown */}
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>${calculateSubtotal().toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Shipping</Text>
                <Text style={styles.priceValue}>${calculateShipping().toFixed(2)}</Text>
              </View>
              <View style={styles.priceTotalRow}>
                <Text style={styles.priceTotalLabel}>Total</Text>
                <Text style={styles.priceTotalValue}>${calculateTotal().toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Shipping Address Section */}
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

          {/* Payment Method Section */}
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
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.placeOrderContainer}>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
