import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileStyles, colors } from '../css/profileStyles';
import { borderRadius } from '../css/theme';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';

const defaultProfileImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpjxEfE7ea34iS2cRGSWsmeaKsAFJRhbMGl69cHfVqKLFhPihowan-DypyvXbvvn0088j2FSLVvnYQccFUXJ73y1eNXuGDz7KAWV5_t5tguQ_78LpNELkmN9zjgxGwv15mYEGnQ2BLbuOaM5v3bB4ZqMjmnvbwFuvNwUatcbej9LbHH92_fwVOMKk2vqSYRmMUXx-d7urQeB4sjVbew1-CARvegFPvB4-ifYUqGvVa0YgVIlUqEF2rkCV3WZX3WmnVstFVlPqbGTI';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [editNameForm, setEditNameForm] = useState({ firstName: '', lastName: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      if (!user) {
        // Try to get from localStorage
        const userData = ApiService.getUserData();
        if (userData) {
          updateUserDisplay(userData);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        return;
      }

      // Try to fetch fresh user data from API
      try {
        const userId = user.id || localStorage.getItem('userId');
        if (userId) {
          const response = await ApiService.getUserById(userId);
          if (response.success && response.data) {
            updateUserDisplay(response.data);
            // Update localStorage
            ApiService.storeUserData(response.data);
          } else {
            updateUserDisplay(user);
          }
        } else {
          updateUserDisplay(user);
        }
      } catch (error) {
        console.warn('Failed to fetch fresh user data, using cached:', error);
        updateUserDisplay(user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      if (user) {
        updateUserDisplay(user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserDisplay = (userData) => {
    // Set profile image
    if (userData.profileImageUrl) {
      setProfileImage(userData.profileImageUrl);
    } else if (userData.profileImage) {
      setProfileImage(userData.profileImage);
    } else {
      setProfileImage(defaultProfileImage);
    }

    // Set first and last name
    setFirstName(userData.firstName || '');
    setLastName(userData.lastName || '');
    setEditNameForm({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
    });

    // Set user name
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

    // Set user email
    if (userData.email) {
      setUserEmail(userData.email);
    } else if (userData.phoneNumber) {
      setUserEmail(userData.phoneNumber);
    } else {
      setUserEmail('');
    }
  };

  const handleImageClick = () => {
    if (isUploading) return;
    setShowImagePickerModal(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setShowImagePickerModal(false);
    uploadProfileImage(file);
  };

  const uploadProfileImage = async (file) => {
    if (!user?.id) {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User ID not found. Please log in again.');
        return;
      }
    }

    setIsUploading(true);
    try {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);

      // Upload image to storage
      const uploadResponse = await ApiService.uploadImage(file, {
        category: 'profile-images',
        description: 'User profile image',
        folderPath: 'profile-images',
        uploadedBy: user?.id || localStorage.getItem('userId'),
      });

      if (!uploadResponse.success || !uploadResponse.url) {
        throw new Error(uploadResponse.message || 'Failed to upload image');
      }

      const imageUrl = uploadResponse.url;

      // Update user profile in database
      const userId = user?.id || localStorage.getItem('userId');
      const updateResponse = await ApiService.updateUserProfile(userId, {
        profileImageUrl: imageUrl,
      });

      if (!updateResponse.success) {
        throw new Error(updateResponse.message || 'Failed to update profile');
      }

      // Update local state
      setProfileImage(imageUrl);

      // Update localStorage with new user data
      const userData = ApiService.getUserData();
      if (userData) {
        userData.profileImageUrl = imageUrl;
        ApiService.storeUserData(userData);
      }

      alert('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      // Revert to previous image on error
      await loadUserProfile();
      alert(error.response?.data?.message || error.message || 'Failed to upload profile image. Please try again.');
    } finally {
      setIsUploading(false);
      // Clean up preview URL
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAccountOption = (option) => {
    switch (option) {
      case 'Payment Methods':
        alert('Payment methods will be implemented');
        break;
      case 'Shipping Address':
        navigate('/profile/shipping-addresses');
        break;
      default:
        alert(`${option} functionality will be implemented`);
    }
  };

  const handleOrderOption = (option) => {
    switch (option) {
      case 'Order History':
        navigate('/orders');
        break;
      case 'Past Orders':
        navigate('/orders');
        break;
      default:
        alert(`${option} functionality will be implemented`);
    }
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setEditNameForm({
      firstName: firstName,
      lastName: lastName,
    });
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditNameForm({
      firstName: firstName,
      lastName: lastName,
    });
  };

  const handleSaveName = async () => {
    if (!user?.id) {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User ID not found. Please log in again.');
        return;
      }
    }

    // Validate
    if (!editNameForm.firstName.trim() && !editNameForm.lastName.trim()) {
      alert('Please enter at least a first name or last name');
      return;
    }

    setIsSavingName(true);
    try {
      const userId = user?.id || localStorage.getItem('userId');
      const updateData = {
        firstName: editNameForm.firstName.trim() || null,
        lastName: editNameForm.lastName.trim() || null,
      };

      const updateResponse = await ApiService.updateUserProfile(userId, updateData);

      if (updateResponse.success) {
        // Update local state
        setFirstName(updateData.firstName || '');
        setLastName(updateData.lastName || '');
        
        // Update display name
        let displayName = 'User';
        if (updateData.firstName && updateData.lastName) {
          displayName = `${updateData.firstName} ${updateData.lastName}`;
        } else if (updateData.firstName) {
          displayName = updateData.firstName;
        } else if (updateData.lastName) {
          displayName = updateData.lastName;
        }
        setUserName(displayName);

        // Update localStorage
        const userData = ApiService.getUserData();
        if (userData) {
          userData.firstName = updateData.firstName;
          userData.lastName = updateData.lastName;
          ApiService.storeUserData(userData);
        }

        setIsEditingName(false);
        alert('Name updated successfully!');
      } else {
        alert(updateResponse.message || 'Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      alert(error.response?.data?.message || error.message || 'Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div style={profileStyles.profilePageContainer}>
      {/* Main Content */}
      <div style={profileStyles.profileContent}>
        {/* Profile Summary */}
        <div style={profileStyles.profileSummary}>
          <div style={profileStyles.profilePictureContainer}>
            {isUploading ? (
              <div style={profileStyles.profilePicturePlaceholder}>
                <div style={profileStyles.loadingOverlay}>
                  <div style={{ fontSize: '24px', color: colors.primary }}>⏳</div>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={profileImage}
                  alt="Profile"
                  style={profileStyles.profilePicture}
                  onError={() => {
                    setProfileImage(defaultProfileImage);
                  }}
                />
                <div
                  style={{
                    ...profileStyles.editProfileButton,
                    ...(isUploading && profileStyles.editProfileButtonDisabled),
                  }}
                  onClick={handleImageClick}
                  onMouseEnter={(e) => {
                    if (!isUploading) {
                      Object.assign(e.currentTarget.style, profileStyles.editProfileButtonHover);
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = colors.active;
                  }}
                >
                  <span style={profileStyles.editIcon}>✏️</span>
                </div>
              </>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
            position: 'relative',
          }}>
            {isEditingName ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                maxWidth: '400px',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}>
                  <input
                    type="text"
                    value={editNameForm.firstName}
                    onChange={(e) => setEditNameForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First Name"
                    style={{
                      padding: '10px 14px',
                      fontSize: '16px',
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: borderRadius.md,
                      backgroundColor: colors.white,
                      color: colors.textPrimary,
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    value={editNameForm.lastName}
                    onChange={(e) => setEditNameForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last Name"
                    style={{
                      padding: '10px 14px',
                      fontSize: '16px',
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: borderRadius.md,
                      backgroundColor: colors.white,
                      color: colors.textPrimary,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                }}>
                  <button
                    style={{
                      padding: '8px 20px',
                      backgroundColor: colors.primary,
                      color: colors.white,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isSavingName ? 'not-allowed' : 'pointer',
                      opacity: isSavingName ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    onMouseEnter={(e) => {
                      if (!isSavingName) {
                        e.currentTarget.style.backgroundColor = '#053080';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary;
                    }}
                  >
                    {isSavingName ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    style={{
                      padding: '8px 20px',
                      backgroundColor: 'transparent',
                      color: colors.textSecondary,
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={handleCancelEditName}
                    disabled={isSavingName}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.gray50;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 style={profileStyles.userName}>{userName}</h2>
                <button
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: colors.gray100,
                    border: `1px solid ${colors.borderLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0,
                  }}
                  onClick={handleEditName}
                  title="Edit Name"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.gray200;
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.gray100;
                    e.currentTarget.style.borderColor = colors.borderLight;
                  }}
                >
                  <span style={{
                    fontSize: '14px',
                    color: colors.textSecondary,
                  }}>
                    ✏️
                  </span>
                </button>
              </>
            )}
          </div>
          {userEmail && (
            <p style={profileStyles.userEmail}>{userEmail}</p>
          )}
        </div>

        {/* Account Section */}
        <div style={profileStyles.sectionContainer}>
          <h2 style={profileStyles.sectionTitle}>Account</h2>
          
          <div
            style={profileStyles.optionItem}
            onClick={() => handleAccountOption('Payment Methods')}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, profileStyles.optionItemHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray50;
              e.currentTarget.style.borderColor = colors.borderLight;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={profileStyles.optionLeft}>
              <div style={profileStyles.optionIconContainer}>
                <span style={profileStyles.optionIcon}>💳</span>
              </div>
              <h3 style={profileStyles.optionTitle}>Payment Methods</h3>
            </div>
            <span style={profileStyles.chevronIcon}>›</span>
          </div>

          <div
            style={{
              ...profileStyles.optionItem,
              ...profileStyles.optionItemLast,
            }}
            onClick={() => handleAccountOption('Shipping Address')}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, profileStyles.optionItemHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray50;
              e.currentTarget.style.borderColor = colors.borderLight;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={profileStyles.optionLeft}>
              <div style={profileStyles.optionIconContainer}>
                <span style={profileStyles.optionIcon}>🚚</span>
              </div>
              <h3 style={profileStyles.optionTitle}>Shipping Address</h3>
            </div>
            <span style={profileStyles.chevronIcon}>›</span>
          </div>
        </div>

        {/* Orders Section */}
        <div style={profileStyles.sectionContainer}>
          <h2 style={profileStyles.sectionTitle}>Orders</h2>
          
          <div
            style={profileStyles.optionItem}
            onClick={() => handleOrderOption('Order History')}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, profileStyles.optionItemHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray50;
              e.currentTarget.style.borderColor = colors.borderLight;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={profileStyles.optionLeft}>
              <div style={profileStyles.optionIconContainer}>
                <span style={profileStyles.optionIcon}>🕒</span>
              </div>
              <h3 style={profileStyles.optionTitle}>Order History</h3>
            </div>
            <span style={profileStyles.chevronIcon}>›</span>
          </div>

          <div
            style={{
              ...profileStyles.optionItem,
              ...profileStyles.optionItemLast,
            }}
            onClick={() => handleOrderOption('Past Orders')}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, profileStyles.optionItemHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray50;
              e.currentTarget.style.borderColor = colors.borderLight;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={profileStyles.optionLeft}>
              <div style={profileStyles.optionIconContainer}>
                <span style={profileStyles.optionIcon}>📋</span>
              </div>
              <h3 style={profileStyles.optionTitle}>Past Orders</h3>
            </div>
            <span style={profileStyles.chevronIcon}>›</span>
          </div>
        </div>

        {/* Logout Section */}
        <div style={profileStyles.logoutSection}>
          <button
            style={profileStyles.logoutButton}
            onClick={handleLogout}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, profileStyles.logoutButtonHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={profileStyles.logoutButtonContent}>
              <div style={profileStyles.logoutIconContainer}>
                <span style={profileStyles.logoutIcon}>🚪</span>
              </div>
              <span style={profileStyles.logoutButtonText}>Logout</span>
            </div>
          </button>
        </div>
      </div>

      {/* Image Picker Modal */}
      {showImagePickerModal && (
        <div
          style={profileStyles.imagePickerModal}
          onClick={() => setShowImagePickerModal(false)}
        >
          <div
            style={profileStyles.imagePickerModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={profileStyles.imagePickerModalTitle}>Select Profile Image</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={profileStyles.fileInput}
              onChange={handleFileSelect}
            />
            <div
              style={profileStyles.imagePickerOption}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, profileStyles.imagePickerOptionHover);
                e.currentTarget.querySelector('p').style.color = colors.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.gray50;
                e.currentTarget.querySelector('p').style.color = colors.textPrimary;
              }}
            >
              <p style={profileStyles.imagePickerOptionText}>Choose from Gallery</p>
            </div>
            <div
              style={{
                ...profileStyles.imagePickerOption,
                ...profileStyles.imagePickerOptionCancel,
              }}
              onClick={() => setShowImagePickerModal(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.gray300;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.gray200;
              }}
            >
              <p style={{
                ...profileStyles.imagePickerOptionText,
                ...profileStyles.imagePickerOptionCancelText,
              }}>
                Cancel
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

