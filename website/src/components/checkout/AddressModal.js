import React, { useState, useEffect } from 'react';
import { checkoutStyles, colors } from '../../css/checkoutStyles';
import { borderRadius } from '../../css/theme';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/apiService';
import AddressForm from './AddressForm';

const AddressModal = ({ onClose, onSelectAddress, selectedAddress }) => {
  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      let addresses = [];
      
      // First, try to load from user data (database)
      try {
        const userId = user?.id || localStorage.getItem('userId');
        if (userId) {
          const userDataResponse = await ApiService.getUserById(userId);
          if (userDataResponse.success && userDataResponse.data) {
            const userData = userDataResponse.data;
            // Check if user has addresses array in database
            if (userData.addresses && Array.isArray(userData.addresses) && userData.addresses.length > 0) {
              addresses = userData.addresses;
              // Sync to localStorage for offline access
              localStorage.setItem('shippingAddresses', JSON.stringify(addresses));
              console.log('Loaded addresses from database');
            }
          }
        }
      } catch (apiError) {
        console.log('Could not load addresses from database, trying local storage:', apiError);
      }
      
      // If no addresses from database, try localStorage
      if (addresses.length === 0) {
        const addressesJson = localStorage.getItem('shippingAddresses');
        if (addressesJson) {
          addresses = JSON.parse(addressesJson);
          console.log('Loaded addresses from local storage');
        }
      }
      
      // If still no addresses, try fallback to user data
      if (addresses.length === 0 && user) {
        const userAddress = user.address || {};
        const fallbackAddress = {
          id: 'user-default',
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`.trim()
            : user.firstName || user.userName || '',
          phone: user.phoneNumber || '',
          address: userAddress.address || '',
          city: userAddress.city || '',
          state: userAddress.state || '',
          postalCode: userAddress.postalCode || '',
          country: userAddress.country || 'India',
          isDefault: true,
        };
        addresses = [fallbackAddress];
      }
      
      if (addresses.length > 0) {
        setSavedAddresses(addresses);
        
        // Auto-select default address or first address
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedId(defaultAddress.id);
          if (!selectedAddress.name) {
            onSelectAddress(defaultAddress);
          }
        } else if (!selectedAddress.name) {
          setSelectedId(addresses[0].id);
          onSelectAddress(addresses[0]);
        }
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedId(address.id);
    onSelectAddress(address);
    onClose();
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setShowAddForm(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleSaveAddress = async (formData) => {
    try {
      let updatedAddresses = [...savedAddresses];

      if (editingAddress) {
        // Update existing address
        const addressId = editingAddress.id;
        
        // If setting as default, remove default from others first
        if (formData.isDefault) {
          updatedAddresses = updatedAddresses.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId,
          }));
        }

        // Update the address
        updatedAddresses = updatedAddresses.map(addr =>
          addr.id === addressId
            ? { ...formData, id: addressId }
            : addr
        );
      } else {
        // Add new address
        const newAddress = {
          ...formData,
          id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // If setting as default, remove default from others
        if (formData.isDefault) {
          updatedAddresses = updatedAddresses.map(addr => ({
            ...addr,
            isDefault: false,
          }));
        }

        updatedAddresses.push(newAddress);
      }

      // Save to localStorage first
      localStorage.setItem('shippingAddresses', JSON.stringify(updatedAddresses));
      setSavedAddresses(updatedAddresses);

      // Save to API/database
      try {
        const userId = user?.id || localStorage.getItem('userId');
        if (userId) {
          // Get current user data
          const userDataResponse = await ApiService.getUserById(userId);
          const currentUserData = userDataResponse.success && userDataResponse.data 
            ? userDataResponse.data 
            : user || {};
          
          const updateData = {
            ...currentUserData,
            addresses: updatedAddresses,
          };
          
          const updatedUserDataResponse = await ApiService.updateUserProfile(userId, updateData);
          
          // Update local storage with the updated user data from server
          if (updatedUserDataResponse.success && updatedUserDataResponse.data) {
            const updatedUserData = updatedUserDataResponse.data;
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            console.log('Addresses saved to database successfully');
          } else {
            // If API doesn't return updated data, update local storage manually
            localStorage.setItem('userData', JSON.stringify(updateData));
            console.log('Addresses saved to database (manual update)');
          }
        } else {
          console.log('User ID not available, saved locally only');
        }
      } catch (apiError) {
        console.error('Could not save to API, saved locally only:', apiError);
      }

      // Auto-select if it's the default or first address
      const savedAddress = editingAddress
        ? updatedAddresses.find(addr => addr.id === editingAddress.id)
        : updatedAddresses[updatedAddresses.length - 1];

      if (formData.isDefault || updatedAddresses.length === 1) {
        handleSelectAddress(savedAddress);
      } else {
        // Just update the selected address if editing
        if (editingAddress) {
          setSelectedId(savedAddress.id);
          onSelectAddress(savedAddress);
        }
        setShowAddForm(false);
        setEditingAddress(null);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  const handleDeleteAddress = (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
        localStorage.setItem('shippingAddresses', JSON.stringify(updatedAddresses));
        setSavedAddresses(updatedAddresses);

        // If deleted address was selected, select first available
        if (selectedId === addressId && updatedAddresses.length > 0) {
          const defaultAddr = updatedAddresses.find(addr => addr.isDefault) || updatedAddresses[0];
          handleSelectAddress(defaultAddr);
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
      }
    }
  };

  const formatAddressDisplay = (address) => {
    const parts = [];
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    return parts.join(', ');
  };

  const formatAddressCard = (address) => {
    const parts = [];
    if (address.studentName) parts.push(`Student: ${address.studentName}`);
    if (address.studentRollNumber) parts.push(`Roll No: ${address.studentRollNumber}`);
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  return (
    <div style={checkoutStyles.addressModal} onClick={onClose}>
      <div style={checkoutStyles.addressModalContent} onClick={(e) => e.stopPropagation()}>
        <div style={checkoutStyles.addressModalHeader}>
          <h2 style={checkoutStyles.addressModalTitle}>
            {showAddForm ? (editingAddress ? 'Edit Address' : 'Add New Address') : 'Select Shipping Address'}
          </h2>
          <button
            style={checkoutStyles.addressModalClose}
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingAddress(null);
              } else {
                onClose();
              }
            }}
          >
            ✕
          </button>
        </div>

        <div style={checkoutStyles.addressModalBody}>
          {showAddForm ? (
            <AddressForm
              address={editingAddress}
              onSave={handleSaveAddress}
              onCancel={() => {
                setShowAddForm(false);
                setEditingAddress(null);
              }}
              isEditing={!!editingAddress}
            />
          ) : (
            <>
              {/* Add New Address Button */}
              <button
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  transition: 'all 0.2s ease',
                }}
                onClick={handleAddNew}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#053080';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }}
              >
                + Add New Address
              </button>

              {/* Address List */}
              {savedAddresses.length === 0 ? (
                <div style={checkoutStyles.emptyState}>
                  <div style={checkoutStyles.emptyStateIcon}>📍</div>
                  <p style={checkoutStyles.emptyStateText}>No addresses saved</p>
                  <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '8px' }}>
                    Click "Add New Address" to create one
                  </p>
                </div>
              ) : (
                savedAddresses.map((address) => (
                  <div
                    key={address.id}
                    style={{
                      ...checkoutStyles.addressCard,
                      ...(selectedId === address.id && checkoutStyles.addressCardSelected),
                    }}
                  >
                    {address.isDefault && (
                      <div style={checkoutStyles.defaultBadge}>
                        <span style={checkoutStyles.defaultBadgeText}>Default</span>
                      </div>
                    )}
                    <div
                      onClick={() => handleSelectAddress(address)}
                      style={{ flex: 1, cursor: 'pointer' }}
                    >
                      <h3 style={checkoutStyles.addressCardName}>{address.name}</h3>
                      <p style={checkoutStyles.addressCardPhone}>{address.phone}</p>
                      {formatAddressCard(address) && (
                        <p style={{
                          fontSize: '13px',
                          color: colors.primary,
                          fontWeight: '500',
                          margin: '4px 0',
                        }}>
                          {formatAddressCard(address)}
                        </p>
                      )}
                      <p style={checkoutStyles.addressCardAddress}>{formatAddressDisplay(address)}</p>
                      {address.country && (
                        <p style={checkoutStyles.addressCardCountry}>{address.country}</p>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginLeft: '16px',
                    }}>
                      {selectedId === address.id && (
                        <div style={checkoutStyles.selectedIndicator}>
                          <span style={checkoutStyles.selectedIndicatorText}>✓</span>
                        </div>
                      )}
                      <button
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${colors.borderLight}`,
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          fontWeight: '500',
                          color: colors.textSecondary,
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(address);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.gray50;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          border: `1px solid ${colors.gray400}`,
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#dc2626',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address.id);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressModal;

