import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileStyles, colors } from '../css/profileStyles';
import { borderRadius } from '../css/theme';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';
import AddressForm from './checkout/AddressForm';
import LoadingScreen from './common/LoadingScreen';

const ShippingAddressesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
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
          studentName: '',
          studentRollNumber: '',
          isDefault: true,
        };
        addresses = [fallbackAddress];
      }
      
      setAddresses(addresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
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
      let updatedAddresses = [...addresses];

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
      setAddresses(updatedAddresses);

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

      setShowAddForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        
        // Save to localStorage first
        localStorage.setItem('shippingAddresses', JSON.stringify(updatedAddresses));
        setAddresses(updatedAddresses);

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
              console.log('Address deleted from database successfully');
            } else {
              localStorage.setItem('userData', JSON.stringify(updateData));
              console.log('Address deleted from database (manual update)');
            }
          }
        } catch (apiError) {
          console.error('Could not delete from API, deleted locally only:', apiError);
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));
      
      // Save to localStorage first
      localStorage.setItem('shippingAddresses', JSON.stringify(updatedAddresses));
      setAddresses(updatedAddresses);

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
            console.log('Default address updated in database successfully');
          } else {
            localStorage.setItem('userData', JSON.stringify(updateData));
            console.log('Default address updated in database (manual update)');
          }
        }
      } catch (apiError) {
        console.error('Could not update default in API, updated locally only:', apiError);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address. Please try again.');
    }
  };

  const formatAddressDisplay = (address) => {
    const parts = [];
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    return parts.length > 0 ? parts.join(', ') : 'No address details';
  };

  const formatStudentInfo = (address) => {
    const parts = [];
    if (address.studentName) parts.push(`Student: ${address.studentName}`);
    if (address.studentRollNumber) parts.push(`Roll No: ${address.studentRollNumber}`);
    return parts.length > 0 ? parts.join(' | ') : null;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div style={profileStyles.profilePageContainer}>
      {/* Header */}
      <div style={profileStyles.profileHeader}>
        <div style={profileStyles.profileHeaderContent}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.white,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            ←
          </button>
          <h1 style={profileStyles.profileHeaderTitle}>Shipping Addresses</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={profileStyles.profileContent}>
        {/* Add New Address Button */}
        <div style={{ marginBottom: '24px' }}>
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
        </div>

        {/* Address Form (when adding/editing) */}
        {showAddForm && (
          <div style={profileStyles.sectionContainer}>
            <h2 style={profileStyles.sectionTitle}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <AddressForm
              address={editingAddress}
              onSave={handleSaveAddress}
              onCancel={() => {
                setShowAddForm(false);
                setEditingAddress(null);
              }}
              isEditing={!!editingAddress}
            />
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div style={profileStyles.sectionContainer}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📍</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.textPrimary,
                margin: '0 0 12px 0',
              }}>
                No addresses saved
              </h2>
              <p style={{
                fontSize: '16px',
                color: colors.textSecondary,
                margin: 0,
              }}>
                Click "Add New Address" to create your first shipping address
              </p>
            </div>
          </div>
        ) : (
          <div style={profileStyles.sectionContainer}>
            <h2 style={profileStyles.sectionTitle}>Saved Addresses</h2>
            {addresses.map((address) => (
              <div
                key={address.id}
                style={{
                  ...profileStyles.optionItem,
                  marginBottom: '16px',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  padding: '20px',
                }}
              >
                {/* Address Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px',
                    }}>
                      <h3 style={{
                        ...profileStyles.optionTitle,
                        margin: 0,
                        fontSize: '18px',
                      }}>
                        {address.name}
                      </h3>
                      {address.isDefault && (
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: colors.primary,
                          color: colors.white,
                          padding: '4px 12px',
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          Default
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: colors.textSecondary,
                      margin: '4px 0',
                    }}>
                      {address.phone}
                    </p>
                    {formatStudentInfo(address) && (
                      <p style={{
                        fontSize: '13px',
                        color: colors.primary,
                        fontWeight: '500',
                        margin: '4px 0',
                      }}>
                        {formatStudentInfo(address)}
                      </p>
                    )}
                    <p style={{
                      fontSize: '14px',
                      color: colors.textPrimary,
                      margin: '8px 0 0 0',
                      lineHeight: '1.6',
                    }}>
                      {formatAddressDisplay(address)}
                    </p>
                    {address.country && (
                      <p style={{
                        fontSize: '14px',
                        color: colors.textSecondary,
                        margin: '4px 0 0 0',
                      }}>
                        {address.country}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address Actions */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${colors.borderLight}`,
                }}>
                  {!address.isDefault && (
                    <button
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${colors.primary}`,
                        borderRadius: borderRadius.sm,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.primary,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => handleSetDefault(address.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary;
                        e.currentTarget.style.color = colors.white;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = colors.primary;
                      }}
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: borderRadius.sm,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleEdit(address)}
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
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.gray400}`,
                      borderRadius: borderRadius.sm,
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#dc2626',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleDeleteAddress(address.id)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingAddressesPage;

