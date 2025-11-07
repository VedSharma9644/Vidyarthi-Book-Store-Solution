import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const OrderDetailsScreen = ({ onTabPress, onBack }) => {
  const orderData = {
    orderNumber: '#1234567890',
    date: 'May 15, 2024',
    total: '$45.97',
    status: 'Shipped',
    statusColor: 'green',
    items: [
      {
        id: 1,
        title: 'The Great Gatsby',
        quantity: 1,
        price: '$10.99',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDJ5Hcl1DOSf7k69toqbRyrBeTW-ia8q5xg_0zdlnwgQhejHEok1YhIuPMgVCYkgB0uMD_6DiTSwsxzMJ8vqFUzW490HWuNjNE1GqgknQj8aTS1kq9jI4x9GuD133Q301mslv-aKGDcQ6Chyv2ryBBhJzGKNTOXcgrSJ0KpHw6ST8v7QwX8bffVQ6Qde46CaSe1BbI9MXYAprXiX46pkzrStO_vCahWHag-i8rsfPPCDN5fHV2GzcdLz_Zg6f3vzavfVYsR9yOLKs',
      },
      {
        id: 2,
        title: 'To Kill a Mockingbird',
        quantity: 2,
        price: '$21.98',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2BD4-DcwHd3WAPbVIbB2gRwfUDB3BluuOx_f7iKr3sQlzgcTVPz5tWC8taZXCkQBRJ1L9dkslXoPtaJM19wEpTGIT4wmwBVFeNn-FThzt7wdf8ZwdOVkqVa8FQfGzwriSJOvgaXO8CI_uH_sj-xl13Kfb3NJVsDxFxn2kP6FkRSTYS8RlajxkwY2VPWQ6t98xXzmrYEExDi7XhMXEBiCUiTynQkB4Y3mW8p3_o9prbceRdcFBnwcQFWlv8zWRqSx05esO7SJfFrk',
      },
      {
        id: 3,
        title: '1984',
        quantity: 1,
        price: '$12.00',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-naInDsM2Gi8WfjLqyJJl3dGFukFVlcDr5hPQFG92hDoBvSx9HQQsHOLxRBCYuN1yzng_9GLZs__FvxLm4149jyIqmkpQr5f77edJ6c7ZzWOMcmcyP9VTd56pQPlx1fF0xu_xSg32jNvlxA52f0wzcVn4QsBplNl1WtTvX8PvYHmUXmP6kJKXsYGyC7WUJvb9mzFZiGBZfYhehnd7M-T5ooWdkqVuCBND_Nawn2DZj-yVte1He2ErTSHOYJXZFwUnmgHo27k_AYY',
      },
    ],
  };

  const getStatusStyle = (statusColor) => {
    switch (statusColor) {
      case 'green':
        return {
          backgroundColor: '#dcfce7',
          color: '#166534',
        };
      case 'yellow':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
        };
      case 'red':
        return {
          backgroundColor: '#fecaca',
          color: '#991b1b',
        };
      default:
        return {
          backgroundColor: colors.gray200,
          color: colors.gray700,
        };
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
      </View>

      {/* Main Content */}
      <ScrollView style={styles.orderDetailsMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.orderDetailsContent}>
          {/* Order Summary Card */}
          <View style={styles.orderSummaryCard}>
            <Text style={styles.orderDetailsNumber}>Order {orderData.orderNumber}</Text>
            
            <View style={styles.orderDetailsInfo}>
              <View style={styles.orderDetailsRow}>
                <Text style={styles.orderDetailsLabel}>Order Date</Text>
                <Text style={styles.orderDetailsValue}>{orderData.date}</Text>
              </View>
              <View style={styles.orderDetailsRow}>
                <Text style={styles.orderDetailsLabel}>Total</Text>
                <Text style={styles.orderDetailsValue}>{orderData.total}</Text>
              </View>
              <View style={styles.orderDetailsRow}>
                <Text style={styles.orderDetailsLabel}>Status</Text>
                <View 
                  style={[
                    styles.orderDetailsStatusBadge,
                    { backgroundColor: getStatusStyle(orderData.statusColor).backgroundColor }
                  ]}
                >
                  <Text 
                    style={[
                      styles.orderDetailsStatusText,
                      { color: getStatusStyle(orderData.statusColor).color }
                    ]}
                  >
                    {orderData.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Items Section */}
          <Text style={styles.orderDetailsItemsTitle}>Items ({orderData.items.length})</Text>
          
          <View style={styles.orderDetailsItemsList}>
            {orderData.items.map((item, index) => (
              <View key={index} style={styles.orderDetailsItemCard}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.orderDetailsItemImage}
                  resizeMode="cover"
                />
                <View style={styles.orderDetailsItemContent}>
                  <Text style={styles.orderDetailsItemTitle}>{item.title}</Text>
                  <Text style={styles.orderDetailsItemQuantity}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={styles.orderDetailsItemPrice}>{item.price}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;
