import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, colors } from '../css/styles';
import ApiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const ShippingAddressesScreen = ({ onBack }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      // For now, load from AsyncStorage. Later this can be replaced with API call
      const savedAddresses = await ApiService.getUserData();
      if (savedAddresses && savedAddresses.addresses) {
        setAddresses(savedAddresses.addresses);
      } else {
        // Try to get from AsyncStorage directly
        const addressesJson = await AsyncStorage.getItem('shippingAddresses');
        if (addressesJson) {
          setAddresses(JSON.parse(addressesJson));
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAddresses = async (updatedAddresses) => {
    try {
      // Save to AsyncStorage first
      await AsyncStorage.setItem('shippingAddresses', JSON.stringify(updatedAddresses));
      setAddresses(updatedAddresses);
      
      // Save to API/database
      try {
        const userData = await ApiService.getUserData();
        if (userData && (userData.id || user?.id)) {
          const userId = userData.id || user?.id;
          const updateData = {
            ...userData,
            addresses: updatedAddresses,
          };
          
          const updatedUserData = await ApiService.updateUserProfile(userId, updateData);
          
          // Update local storage with the updated user data from server
          if (updatedUserData && updatedUserData.data) {
            await ApiService.storeUserData(updatedUserData.data);
          } else if (updatedUserData) {
            await ApiService.storeUserData(updatedUserData);
          } else {
            // If API doesn't return updated data, update local storage manually
            await ApiService.storeUserData(updateData);
          }
          
          console.log('Addresses saved to database successfully');
        } else {
          console.log('User data not available, saved locally only');
        }
      } catch (apiError) {
        console.error('Could not save to API, saved locally only:', apiError);
        // Don't throw here - local save was successful
        // User can still use the address, it just won't sync until next login
      }
    } catch (error) {
      console.error('Error saving addresses:', error);
      throw error;
    }
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      isDefault: false,
    });
    setShowAddModal(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name || '',
      phone: address.phone || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
      isDefault: address.isDefault || false,
    });
    setShowAddModal(true);
  };

  const handleDelete = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
            await saveAddresses(updatedAddresses);
            Alert.alert('Success', 'Address deleted successfully');
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId,
    }));
    await saveAddresses(updatedAddresses);
    Alert.alert('Success', 'Default address updated');
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter your state');
      return;
    }
    if (!formData.postalCode.trim()) {
      Alert.alert('Error', 'Please enter your postal code');
      return;
    }

    try {
      setIsSaving(true);
      let updatedAddresses;

      if (editingAddress) {
        // Update existing address
        updatedAddresses = addresses.map(addr =>
          addr.id === editingAddress.id
            ? { ...formData, id: editingAddress.id }
            : editingAddress.isDefault && formData.isDefault
            ? { ...addr, isDefault: false }
            : addr
        );
      } else {
        // Add new address
        const newAddress = {
          ...formData,
          id: Date.now().toString(),
        };
        // If this is set as default, remove default from others
        if (formData.isDefault) {
          updatedAddresses = addresses.map(addr => ({ ...addr, isDefault: false }));
        } else {
          updatedAddresses = [...addresses];
        }
        updatedAddresses.push(newAddress);
      }

      await saveAddresses(updatedAddresses);
      setShowAddModal(false);
      Alert.alert('Success', editingAddress ? 'Address updated successfully' : 'Address added successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatAddress = (address) => {
    const parts = [];
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    return parts.join(', ');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.profileHeaderTitle}>Shipping Addresses</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.profileMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileContent}>
          {/* Add New Button */}
          <TouchableOpacity style={styles.addAddressButton} onPress={handleAddNew}>
            <Text style={styles.addAddressButtonText}>+ Add New Address</Text>
          </TouchableOpacity>

          {/* Loading State */}
          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 16, color: '#666', fontSize: 16 }}>
                Loading addresses...
              </Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
              <Text style={{ color: '#666', fontSize: 18, fontWeight: '500', marginBottom: 8 }}>
                No addresses saved
              </Text>
              <Text style={{ color: '#999', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>
                Add your first shipping address to get started
              </Text>
            </View>
          ) : (
            <View style={styles.addressesList}>
              {addresses.map((address) => (
                <View key={address.id} style={styles.addressCard}>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                  <View style={styles.addressCardContent}>
                    <Text style={styles.addressCardName}>{address.name}</Text>
                    <Text style={styles.addressCardPhone}>{address.phone}</Text>
                    <Text style={styles.addressCardAddress}>{formatAddress(address)}</Text>
                    {address.country && (
                      <Text style={styles.addressCardCountry}>{address.country}</Text>
                    )}
                  </View>
                  <View style={styles.addressCardActions}>
                    {!address.isDefault && (
                      <TouchableOpacity
                        style={styles.addressActionButton}
                        onPress={() => handleSetDefault(address.id)}
                      >
                        <Text style={styles.addressActionButtonText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.addressActionButton, styles.addressEditButton]}
                      onPress={() => handleEdit(address)}
                    >
                      <Text style={[styles.addressActionButtonText, styles.addressEditButtonText]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addressActionButton, styles.addressDeleteButton]}
                      onPress={() => handleDelete(address.id)}
                    >
                      <Text style={[styles.addressActionButtonText, styles.addressDeleteButtonText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <View style={styles.addressModalContent}>
                <View style={styles.addressModalHeader}>
                  <Text style={styles.addressModalTitle}>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Text style={styles.modalCloseButton}>✕</Text>
                  </TouchableOpacity>
                </View>

              <ScrollView 
                style={styles.addressModalBody} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
              <View style={styles.formFieldContainer}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={`${colors.textPrimary}60`}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formFieldContainer}>
                <Text style={styles.formLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={`${colors.textPrimary}60`}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text.replace(/[^0-9]/g, '').slice(0, 10) })}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.formFieldContainer}>
                <Text style={styles.formLabel}>Address *</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Street address, apartment, suite, etc."
                  placeholderTextColor={`${colors.textPrimary}60`}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                />
              </View>

              <View style={styles.formFieldContainer}>
                <Text style={styles.formLabel}>City *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter city"
                  placeholderTextColor={`${colors.textPrimary}60`}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
              </View>

              <View style={styles.formFieldContainer}>
                <Text style={styles.formLabel}>State *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter state"
                  placeholderTextColor={`${colors.textPrimary}60`}
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                />
              </View>

              <View style={styles.formFieldContainer}>
                <Text style={styles.formLabel}>Postal Code *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter postal code"
                  placeholderTextColor={`${colors.textPrimary}60`}
                  value={formData.postalCode}
                  onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formFieldContainer}>
                <Text style={styles.formLabel}>Country</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter country"
                  placeholderTextColor={`${colors.textPrimary}60`}
                  value={formData.country}
                  onChangeText={(text) => setFormData({ ...formData, country: text })}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
              >
                <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
                  {formData.isDefault && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as default address</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveAddressButton, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveAddressButtonText}>
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Text>
                )}
              </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ShippingAddressesScreen;

