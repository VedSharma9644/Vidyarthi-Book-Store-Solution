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
import BottomNavigation from './BottomNavigation';

const ProfileScreen = ({ onTabPress, onBack, onLogout, onGoToOrderHistory, onGoToPastOrders, onGoToStudents, onGoToManageGrades }) => {
  const handleSettings = () => {
    Alert.alert('Settings', 'Settings functionality will be implemented');
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality will be implemented');
  };

  const handleAccountOption = (option) => {
    if (option === 'Students') {
      if (onGoToStudents) {
        onGoToStudents();
      } else {
        Alert.alert(option, `${option} functionality will be implemented`);
      }
    } else if (option === 'Manage Grades') {
      if (onGoToManageGrades) {
        onGoToManageGrades();
      } else {
        Alert.alert(option, `${option} functionality will be implemented`);
      }
    } else {
      Alert.alert(option, `${option} functionality will be implemented`);
    }
  };

  const handleOrderOption = (option) => {
    if (option === 'Order History') {
      if (onGoToOrderHistory) {
        onGoToOrderHistory();
      }
    } else if (option === 'Past Orders') {
      if (onGoToPastOrders) {
        onGoToPastOrders();
      }
    } else {
      Alert.alert(option, `${option} functionality will be implemented`);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual logout logic
            Alert.alert('Logged Out', 'You have been successfully logged out');
            if (onLogout) {
              onLogout(); // Navigate to login screen
            } else if (onBack) {
              onBack(); // Fallback to back navigation
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileHeaderContent}>
          <View style={styles.profileHeaderSpacer} />
          <Text style={styles.profileHeaderTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.profileMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContent}>
          {/* Profile Summary */}
          <View style={styles.profileSummary}>
            <View style={styles.profilePictureContainer}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpjxEfE7ea34iS2cRGSWsmeaKsAFJRhbMGl69cHfVqKLFhPihowan-DypyvXbvvn0088j2FSLVvnYQccFUXJ73y1eNXuGDz7KAWV5_t5tguQ_78LpNELkmN9zjgxGwv15mYEGnQ2BLbuOaM5v3bB4ZqMjmnvbwFuvNwUatcbej9LbHH92_fwVOMKk2vqSYRmMUXx-d7urQeB4sjVbew1-CARvegFPvB4-ifYUqGvVa0YgVIlUqEF2rkCV3WZX3WmnVstFVlPqbGTI'
                }}
                style={styles.profilePicture}
              />
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>Sophia Carter</Text>
            <Text style={styles.userEmail}>sophia.carter@email.com</Text>
          </View>

          {/* Account Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAccountOption('School')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>🎓</Text>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>School</Text>
                  <Text style={styles.optionSubtitle}>Westwood High School</Text>
                </View>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAccountOption('Students')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>👥</Text>
                </View>
                <Text style={styles.optionTitle}>Students</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAccountOption('Manage Grades')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>📚</Text>
                </View>
                <Text style={styles.optionTitle}>Manage Grades</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAccountOption('Payment Methods')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>💳</Text>
                </View>
                <Text style={styles.optionTitle}>Payment Methods</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAccountOption('Shipping Address')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>🚚</Text>
                </View>
                <Text style={styles.optionTitle}>Shipping Address</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Orders Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Orders</Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOrderOption('Order History')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>🕒</Text>
                </View>
                <Text style={styles.optionTitle}>Order History</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleOrderOption('Past Orders')}
            >
              <View style={styles.optionLeft}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>📋</Text>
                </View>
                <Text style={styles.optionTitle}>Past Orders</Text>
              </View>
              <Text style={styles.chevronIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => handleLogout()}
            >
              <View style={styles.logoutButtonContent}>
                <View style={styles.logoutIconContainer}>
                  <Text style={styles.logoutIcon}>🚪</Text>
                </View>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default ProfileScreen;
