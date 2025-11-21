import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  Platform,
  ActionSheetIOS,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';
import { API_CONFIG } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ProfileScreen = ({ onTabPress, onBack, onLogout, onGoToOrderHistory, onGoToPastOrders, onGoToStudents, onGoToManageGrades, onGoToShippingAddresses }) => {
  const defaultProfileImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpjxEfE7ea34iS2cRGSWsmeaKsAFJRhbMGl69cHfVqKLFhPihowan-DypyvXbvvn0088j2FSLVvnYQccFUXJ73y1eNXuGDz7KAWV5_t5tguQ_78LpNELkmN9zjgxGwv15mYEGnQ2BLbuOaM5v3bB4ZqMjmnvbwFuvNwUatcbej9LbHH92_fwVOMKk2vqSYRmMUXx-d7urQeB4sjVbew1-CARvegFPvB4-ifYUqGvVa0YgVIlUqEF2rkCV3WZX3WmnVstFVlPqbGTI';
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');

  // Load user data and profile image on mount
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
      
      setUserId(userId);
      
      // Try to fetch fresh user data from API
      let userData = cachedUserData; // Fallback to cached data
      
      try {
        console.log('📱 Fetching fresh user data from API for userId:', userId);
        
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
          console.log('✅ Fresh user data fetched:', {
            id: userData.id,
            hasProfileImage: !!userData.profileImageUrl,
            profileImageUrl: userData.profileImageUrl,
          });
          
          // Update AsyncStorage with fresh data
          await ApiService.storeUserData(userData);
        } else {
          console.warn('⚠️ API response format unexpected, using cached data');
        }
      } catch (apiError) {
        console.warn('⚠️ Failed to fetch fresh user data from API, using cached data:', apiError.message);
        // Continue with cached data if API fails
      }
      
      if (userData) {
        // Load profile image - prioritize fresh data
        if (userData.profileImageUrl) {
          console.log('📷 Setting profile image from userData:', userData.profileImageUrl);
          setProfileImage(userData.profileImageUrl);
        } else if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        } else {
          console.log('📷 No profile image found, using default');
          // Keep default image
        }
        
        // Load user name
        let displayName = 'User';
        if (userData.firstName && userData.lastName) {
          displayName = `${userData.firstName} ${userData.lastName}`;
        } else if (userData.firstName) {
          displayName = userData.firstName;
        } else if (userData.lastName) {
          displayName = userData.lastName;
        } else if (userData.userName) {
          displayName = userData.userName;
        } else if (userData.name) {
          displayName = userData.name;
        } else if (userData.parentFullName) {
          displayName = userData.parentFullName;
        }
        setUserName(displayName);
        
        // Load user email
        if (userData.email) {
          setUserEmail(userData.email);
        } else if (userData.phoneNumber) {
          // If no email, show phone number
          setUserEmail(userData.phoneNumber);
        }
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    }
  };


  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select an image!',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Show preview immediately
        setProfileImage(imageUri);
        setShowImagePickerModal(false);
        
        // Upload image and save to database
        await uploadAndSaveProfileImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadAndSaveProfileImage = async (imageUri) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      return;
    }

    setIsUploading(true);
    try {
      // Upload image to storage
      const uploadResponse = await ApiService.uploadImage(imageUri, {
        category: 'profile-images',
        description: 'User profile image',
        folderPath: 'profile-images',
        uploadedBy: userId,
      });

      if (!uploadResponse.success || !uploadResponse.url) {
        throw new Error(uploadResponse.message || 'Failed to upload image');
      }

      const imageUrl = uploadResponse.url;

      // Update user profile in database
      const updateResponse = await ApiService.updateUserProfile(userId, {
        profileImageUrl: imageUrl,
      });

      if (!updateResponse.success) {
        throw new Error(updateResponse.message || 'Failed to update profile');
      }

      // Update local state
      setProfileImage(imageUrl);

      // Update AsyncStorage with new user data
      const userData = await ApiService.getUserData();
      if (userData) {
        userData.profileImageUrl = imageUrl;
        await ApiService.storeUserData(userData);
      }

      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      // Revert to previous image on error
      await loadUserProfile();
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to upload profile image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProfile = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      setShowImagePickerModal(true);
    }
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
    } else if (option === 'Shipping Address') {
      if (onGoToShippingAddresses) {
        onGoToShippingAddresses();
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
          <View style={styles.profileHeaderSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.profileMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContent}>
          {/* Profile Summary */}
          <View style={styles.profileSummary}>
            <View style={styles.profilePictureContainer}>
              {isUploading ? (
                <View style={[styles.profilePicture, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray200 }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <Image
                  source={{
                    uri: profileImage
                  }}
                  style={styles.profilePicture}
                  onError={() => {
                    // Fallback to default image if URL fails to load
                    setProfileImage(defaultProfileImage);
                  }}
                />
              )}
              <TouchableOpacity 
                style={[styles.editButton, isUploading && { opacity: 0.5 }]} 
                onPress={handleEditProfile}
                disabled={isUploading}
              >
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{userName}</Text>
            {userEmail ? (
              <Text style={styles.userEmail}>{userEmail}</Text>
            ) : null}
          </View>

          {/* Image Picker Modal for Android */}
          <Modal
            visible={showImagePickerModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowImagePickerModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Profile Image</Text>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={pickImageFromGallery}
                >
                  <Text style={styles.modalOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalOption, styles.modalCancel]}
                  onPress={() => setShowImagePickerModal(false)}
                >
                  <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

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
