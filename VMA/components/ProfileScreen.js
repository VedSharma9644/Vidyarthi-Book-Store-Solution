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
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';
import { API_CONFIG } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ onTabPress, onBack, onLogout, onGoToOrderHistory, onGoToShippingAddresses }) => {
  const { logout } = useAuth();
  const defaultProfileImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpjxEfE7ea34iS2cRGSWsmeaKsAFJRhbMGl69cHfVqKLFhPihowan-DypyvXbvvn0088j2FSLVvnYQccFUXJ73y1eNXuGDz7KAWV5_t5tguQ_78LpNELkmN9zjgxGwv15mYEGnQ2BLbuOaM5v3bB4ZqMjmnvbwFuvNwUatcbej9LbHH92_fwVOMKk2vqSYRmMUXx-d7urQeB4sjVbew1-CARvegFPvB4-ifYUqGvVa0YgVIlUqEF2rkCV3WZX3WmnVstFVlPqbGTI';
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [userData, setUserData] = useState(null);

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
        setUserData(userData); // Store full user data for updates
        
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

  const handleEditName = () => {
    setEditedName(userName);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      setIsSavingName(true);
      
      // Split name into first and last name (simple split on space)
      const nameParts = editedName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update user profile
      const updateData = {
        firstName: firstName,
        lastName: lastName,
        userName: editedName.trim(),
      };

      const result = await ApiService.updateUserProfile(userId, updateData);
      
      if (result.success) {
        setUserName(editedName.trim());
        setIsEditingName(false);
        
        // Update local user data
        if (userData) {
          const updatedUserData = {
            ...userData,
            firstName: firstName,
            lastName: lastName,
            userName: editedName.trim(),
          };
          setUserData(updatedUserData);
          await ApiService.storeUserData(updatedUserData);
        }
        
        Alert.alert('Success', 'Name updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const requestPermission = async () => {
    // Only request permission on iOS - Android uses Photo Picker without permission
    if (Platform.OS === 'ios') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to select an image!',
            [{ text: 'OK' }]
          );
          return false;
        }
      } catch (error) {
        console.log('Permission request failed:', error);
        return false;
      }
    }
    // Android doesn't need permission - Photo Picker works without it
    return true;
  };

  const pickImageFromGallery = async () => {
    // Only request permission on iOS
    if (Platform.OS === 'ios') {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return;
      }
    }
    // On Android, use Photo Picker directly without requesting permission

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
      // Upload profile image using dedicated profile image endpoint (not admin panel)
      const uploadResponse = await ApiService.uploadProfileImage(userId, imageUri);

      if (!uploadResponse.success || !uploadResponse.url) {
        throw new Error(uploadResponse.message || 'Failed to upload profile image');
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
    if (option === 'Shipping Address') {
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
    } else {
      Alert.alert(option, `${option} functionality will be implemented`);
    }
  };

  const handleLogout = async () => {
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
          onPress: async () => {
            try {
              // Call logout from AuthContext to clear all stored data
              await logout();
              Alert.alert('Logged Out', 'You have been successfully logged out', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to login screen
                    if (onLogout) {
                      onLogout();
                    } else if (onBack) {
                      onBack();
                    }
                  },
                },
              ]);
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.profileMainContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            
            {/* Name Display/Edit */}
            {isEditingName ? (
              <View style={{ width: '100%', alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: colors.gray800,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    width: '80%',
                    textAlign: 'center',
                    backgroundColor: colors.white,
                  }}
                  value={editedName}
                  onChangeText={setEditedName}
                  autoFocus
                  autoCapitalize="words"
                />
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
                  <TouchableOpacity
                    onPress={handleSaveName}
                    disabled={isSavingName}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 8,
                      opacity: isSavingName ? 0.6 : 1,
                    }}
                  >
                    {isSavingName ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={{ color: colors.white, fontWeight: '600' }}>Save</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancelEditName}
                    disabled={isSavingName}
                    style={{
                      backgroundColor: colors.gray400,
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={handleEditName} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={{ fontSize: 16, color: colors.primary }}>✏️</Text>
                </View>
              </TouchableOpacity>
            )}
            
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
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default ProfileScreen;
