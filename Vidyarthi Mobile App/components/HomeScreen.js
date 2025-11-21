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
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

const HomeScreen = ({ onTabPress, onGoToSearch, onGoToOrderHistory }) => {
  const [bannerImage, setBannerImage] = useState(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);

  useEffect(() => {
    loadBannerImage();
  }, []);

  const loadBannerImage = async () => {
    try {
      setIsLoadingBanner(true);
      const result = await ApiService.getBannerImage();
      
      if (result.success && result.data && result.data.imageUrl) {
        setBannerImage(result.data.imageUrl);
      } else {
        // Use fallback placeholder if no banner found
        setBannerImage('https://via.placeholder.com/400x200/06429c/FFFFFF?text=Welcome+to+Vidyatrhi+Book+Bank');
      }
    } catch (error) {
      console.error('Error loading banner image:', error);
      // Use fallback on error
      setBannerImage('https://via.placeholder.com/400x200/06429c/FFFFFF?text=Welcome+to+Vidyatrhi+Book+Bank');
    } finally {
      setIsLoadingBanner(false);
    }
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
              <Text style={styles.homeLogoText}>V</Text>
            </View>
            <View>
              <Text style={styles.homeHeaderTitle}>Vidyatrhi</Text>
              <Text style={styles.homeHeaderSubtitle}>Book Bank</Text>
            </View>
          </View>
          <View style={styles.homeHeaderRight}>
            <TouchableOpacity style={styles.homeHeaderIcon}>
              <Text style={styles.homeHeaderIconText}>🔔</Text>
            </TouchableOpacity>
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
          {isLoadingBanner ? (
            <View style={styles.homeBannerLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : bannerImage ? (
            <Image
              source={{ uri: bannerImage }}
              style={styles.homeBannerImage}
              resizeMode="cover"
              onError={() => {
                // Fallback to placeholder if image fails to load
                setBannerImage('https://via.placeholder.com/400x200/06429c/FFFFFF?text=Welcome+to+Vidyatrhi+Book+Bank');
              }}
            />
          ) : (
            <Image
              source={{
                uri: 'https://via.placeholder.com/400x200/06429c/FFFFFF?text=Welcome+to+Vidyatrhi+Book+Bank'
              }}
              style={styles.homeBannerImage}
              resizeMode="cover"
            />
          )}
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
