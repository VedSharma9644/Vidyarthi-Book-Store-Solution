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

const OrderHistoryScreen = ({ onTabPress, onBack, onGoToOrderDetails }) => {
  const handleViewOrderDetails = () => {
    if (onGoToOrderDetails) {
      onGoToOrderDetails();
    } else {
      Alert.alert('Order Details', 'Order details functionality will be implemented');
    }
  };

  const orderData = {
    orderNumber: '#123456',
    date: '01/01/2024',
    status: 'Arriving today',
    progress: 87.5, // Percentage of progress
    stages: [
      { name: 'Placed', completed: true },
      { name: 'Dispatched', completed: true },
      { name: 'In Transit', completed: true },
      { name: 'Out for Delivery', completed: true },
      { name: 'Delivered', completed: false },
    ],
    timeline: [
      {
        title: 'Out for Delivery',
        time: '10:35 AM',
        description: 'Your order is out for delivery',
        completed: true,
      },
      {
        title: 'In Transit',
        time: '08:15 AM',
        description: 'Package arrived at your nearest hub',
        completed: true,
      },
      {
        title: 'Dispatched',
        time: 'Yesterday, 9:00 PM',
        description: 'Seller has dispatched your order',
        completed: true,
      },
      {
        title: 'Order Placed',
        time: 'Yesterday, 3:30 PM',
        description: 'We have received your order',
        completed: true,
      },
    ],
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
      <ScrollView style={styles.orderHistoryMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.orderHistoryContent}>
          {/* Order Summary Card */}
          <View style={styles.orderSummaryCard}>
            <View style={styles.orderSummaryHeader}>
              <View style={styles.orderSummaryTop}>
                <Text style={styles.orderNumberText}>Order {orderData.orderNumber}</Text>
                <Text style={styles.orderDateText}>{orderData.date}</Text>
              </View>
              <Text style={styles.orderStatusText}>{orderData.status}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${orderData.progress}%` }
                ]} 
              />
              <View style={styles.progressStages}>
                {orderData.stages.map((stage, index) => (
                  <View key={index} style={styles.progressStage}>
                    <View 
                      style={[
                        styles.progressDot,
                        stage.completed ? styles.progressDotActive : styles.progressDotInactive
                      ]} 
                    />
                    <Text 
                      style={[
                        styles.progressStageText,
                        stage.completed ? styles.progressStageTextActive : styles.progressStageTextInactive
                      ]}
                    >
                      {stage.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.timelineContainer}>
              <Text style={styles.timelineSectionTitle}>Order Timeline</Text>
              <View style={styles.timelineLine} />
              {orderData.timeline.map((event, index) => (
                <View key={index} style={styles.timelineEvent}>
                  <View 
                    style={[
                      styles.timelineDot,
                      event.completed ? styles.timelineDotActive : styles.timelineDotInactive
                    ]} 
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{event.title}</Text>
                    <Text style={styles.timelineTime}>{event.time}</Text>
                    <Text style={styles.timelineDescription}>{event.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* View Order Details Button */}
            <TouchableOpacity 
              style={styles.viewOrderDetailsButton} 
              onPress={handleViewOrderDetails}
            >
              <Text style={styles.viewOrderDetailsButtonText}>View Order Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;
