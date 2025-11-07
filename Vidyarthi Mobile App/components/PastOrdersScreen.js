import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const PastOrdersScreen = ({ onTabPress, onBack }) => {
  const handleOrderPress = (orderNumber) => {
    Alert.alert('Order Details', `Order ${orderNumber} details will be implemented`);
  };

  const orders = [
    {
      id: '123456',
      date: 'July 15, 2024',
      status: 'Completed',
      amount: '$45.00',
      statusColor: 'green',
    },
    {
      id: '789012',
      date: 'June 20, 2024',
      status: 'Failed',
      amount: '$60.00',
      statusColor: 'yellow',
    },
    {
      id: '345678',
      date: 'May 25, 2024',
      status: 'Cancelled',
      amount: '$30.00',
      statusColor: 'red',
    },
    {
      id: '901234',
      date: 'April 30, 2024',
      status: 'Completed',
      amount: '$75.00',
      statusColor: 'green',
    },
    {
      id: '567890',
      date: 'March 5, 2024',
      status: 'Completed',
      amount: '$50.00',
      statusColor: 'green',
    },
  ];

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
      <View style={styles.pastOrdersHeader}>
        <View style={styles.pastOrdersHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.pastOrdersHeaderTitle}>Orders</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.pastOrdersMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pastOrdersContent}>
          <Text style={styles.pastOrdersTitle}>Past Orders</Text>
          
          <View style={styles.ordersList}>
            {orders.map((order, index) => {
              const statusStyle = getStatusStyle(order.statusColor);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.orderItem}
                  onPress={() => handleOrderPress(order.id)}
                >
                  <View style={styles.orderItemContent}>
                    <View style={styles.orderItemLeft}>
                      <Text style={styles.orderNumberText}>Order #{order.id}</Text>
                      <Text style={styles.orderDateText}>{order.date}</Text>
                      <View 
                        style={[
                          styles.orderStatusBadge,
                          { backgroundColor: statusStyle.backgroundColor }
                        ]}
                      >
                        <Text 
                          style={[
                            styles.orderStatusText,
                            { color: statusStyle.color }
                          ]}
                        >
                          {order.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.orderItemRight}>
                      <Text style={styles.orderAmountText}>{order.amount}</Text>
                      <Text style={styles.chevronIcon}>›</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default PastOrdersScreen;
