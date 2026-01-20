import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';
import { API_CONFIG } from '../config/apiConfig';
import { useAuth } from '../contexts/AuthContext';


const HomeScreen = ({ onTabPress, onGoToSearch, onGoToOrderHistory }) => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      // First, get userId from AsyncStorage
      const cachedUserData = await ApiService.getUserData();
      const userId = cachedUserData?.id || await AsyncStorage.getItem('userId');
      
      if (!userId) {
        console.warn('No user ID found, cannot load profile');
        return;
      }
      
      // Try to fetch fresh user data from API
      let userData = cachedUserData; // Fallback to cached data
      
      try {
        // Get auth token and user ID for headers
        const authToken = await AsyncStorage.getItem('authToken');
        const headers = {
          'Content-Type': 'application/json',
        };
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }
        headers['user-id'] = userId;
        
        const response = await axios.get(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.GET_BY_ID}/${userId}`,
          { headers }
        );
        
        if (response.data && response.data.success && response.data.data) {
          userData = response.data.data;
          console.log('✅ Fresh user data fetched for HomeScreen');
          
          // Update AsyncStorage with fresh data
          await ApiService.storeUserData(userData);
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to fetch fresh user data from API, using cached data:', apiError.message);
        // Continue with cached data if API fails
      }
      
      if (userData) {
        // Get user name - prioritize userName field (set in profile page)
        let displayName = 'User';
        
        // First priority: userName (the name user sets in profile page)
        if (userData.userName && userData.userName.trim() !== '') {
          displayName = userData.userName.trim();
        } 
        // Second priority: firstName + lastName
        else if (userData.firstName && userData.lastName) {
          displayName = `${userData.firstName.trim()} ${userData.lastName.trim()}`.trim();
        } 
        // Third priority: firstName only
        else if (userData.firstName && userData.firstName.trim() !== '') {
          displayName = userData.firstName.trim();
        } 
        // Fourth priority: lastName only
        else if (userData.lastName && userData.lastName.trim() !== '') {
          displayName = userData.lastName.trim();
        } 
        // Fifth priority: name field
        else if (userData.name && userData.name.trim() !== '') {
          displayName = userData.name.trim();
        } 
        // Sixth priority: parentFullName
        else if (userData.parentFullName && userData.parentFullName.trim() !== '') {
          displayName = userData.parentFullName.trim();
        }
        // Never use email as display name
        
        console.log('📝 Setting display name:', displayName, 'from userName:', userData.userName);
        setUserName(displayName);

        // Get profile image
        if (userData.profileImageUrl) {
          setProfileImage(userData.profileImageUrl);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Get first letter of name for fallback
  const getInitial = () => {
    if (userName && userName !== 'User') {
      return userName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleBrowseBooks = () => {
    if (onGoToSearch) {
      onGoToSearch();
    }
  };

  const handleShopStationery = () => {
    // Navigate to stationery shop
    Alert.alert('Shop Stationery', 'Stationery shop functionality will be implemented');
  };

  const handleReorderPrevious = () => {
    // Navigate to reorder previous orders
    Alert.alert('Re-order Previous', 'Re-order functionality will be implemented');
  };

  const handleTrackOrder = () => {
    // Navigate to order tracking/order history
    if (onGoToOrderHistory) {
      onGoToOrderHistory();
    } else if (onTabPress) {
      onTabPress('profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderContent}>
          <View style={styles.homeHeaderLeft}>
            <View style={styles.homeLogoContainer}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                  }}
                  resizeMode="cover"
                  onError={() => {
                    // If image fails to load, fallback to initial
                    setProfileImage(null);
                  }}
                />
              ) : (
                <Text style={styles.homeLogoText}>{getInitial()}</Text>
              )}
            </View>
            <View>
              <Text style={styles.homeHeaderTitle}>Welcome,</Text>
              <Text style={styles.homeHeaderSubtitle}>{userName}</Text>
            </View>
          </View>
          <View style={styles.homeHeaderRight}>
            <TouchableOpacity 
              style={styles.homeHeaderIcon}
              onPress={() => onTabPress && onTabPress('cart')}
            >
              <Text style={styles.homeHeaderIconText}>🛒</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.homeMainContent} showsVerticalScrollIndicator={false}>
        {/* Image Banner */}
        <View style={styles.homeBannerContainer}>
          <Image
            source={require('../assets/images/DELIVERY IMG.png')}
            style={styles.homeBannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Text Banner */}
        <View style={styles.homeTextBanner}>
          <Text style={styles.homeTextBannerText}>
            Back to School Sale! Get 10% Off all Stationery until Friday.
          </Text>
        </View>

        {/* Explore & Shop Section */}
        <View style={styles.homeSection}>
          <Text style={styles.homeSectionTitle}>Explore & Shop</Text>
          <View style={styles.homeCardsRow}>
            <TouchableOpacity 
              style={styles.homeCard}
              onPress={handleBrowseBooks}
            >
              <View style={styles.homeCardIconContainer}>
                <Text style={styles.homeCardIcon}>📚</Text>
              </View>
              <Text style={styles.homeCardText}>Browse Books</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.homeCard}
              onPress={handleShopStationery}
            >
              <View style={styles.homeCardIconContainer}>
                <Text style={styles.homeCardIcon}>✏️</Text>
              </View>
              <Text style={styles.homeCardText}>Shop Stationery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links Section */}
        <View style={styles.homeSection}>
          <Text style={styles.homeSectionTitle}>Quick Links</Text>
          <View style={styles.homeCardsRow}>
            <TouchableOpacity 
              style={styles.homeCard}
              onPress={handleReorderPrevious}
            >
              <View style={styles.homeCardIconContainer}>
                <Text style={styles.homeCardIcon}>📋</Text>
              </View>
              <Text style={styles.homeCardText}>Re-order Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.homeCard}
              onPress={handleTrackOrder}
            >
              <View style={styles.homeCardIconContainer}>
                <Text style={styles.homeCardIcon}>📦</Text>
              </View>
              <Text style={styles.homeCardText}>Track My Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default HomeScreen;
