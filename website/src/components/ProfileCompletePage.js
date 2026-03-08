import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from '../css/styles';
import { profileStyles, colors } from '../css/profileStyles';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/apiService';

/**
 * Shown after first-time registration. User can optionally complete profile (e.g. class) then continue to home.
 */
const ProfileCompletePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classStandard, setClassStandard] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setError('');
    const userId = user?.id || localStorage.getItem('userId');
    if (userId && classStandard.trim()) {
      try {
        setIsLoading(true);
        const result = await ApiService.updateUserProfile(userId, { classStandard: classStandard.trim() });
        if (result && result.success === false) {
          setError(result.message || 'Could not save. You can update this later in Profile.');
          return;
        }
        const updated = await ApiService.getUserById(userId);
        if (updated?.success && updated?.data) {
          ApiService.storeUserData(updated.data);
        }
      } catch (err) {
        setError(err?.message || 'Could not save. You can update this later in Profile.');
        return;
      } finally {
        setIsLoading(false);
      }
    }
    navigate('/');
  };

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.userName || user.email || 'there'
    : 'there';

  return (
    <div style={profileStyles.profilePageContainer}>
      <div style={profileStyles.profileHeader}>
        <div style={profileStyles.profileHeaderContent}>
          <h1 style={profileStyles.profileHeaderTitle}>Complete your profile</h1>
        </div>
      </div>
      <div style={profileStyles.profileContent}>
        <div style={profileStyles.profileSummary}>
          <h2 style={{ fontSize: '20px', color: colors.textLight, marginBottom: '24px', textAlign: 'center' }}>
            Welcome, {displayName}!
          </h2>
          <p style={{ fontSize: '16px', color: colors.contentLight, marginBottom: '24px', textAlign: 'center' }}>
            You can add your class below, or skip and update it later from your profile.
          </p>
          {error ? (
            <div style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          ) : null}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
            <input
              type="text"
              style={{ ...styles.input, ...styles.registerInput }}
              placeholder="Class / Standard (optional)"
              value={classStandard}
              onChange={(e) => setClassStandard(e.target.value)}
            />
          </div>
          <button
            style={{
              ...styles.registerButton,
              ...(isLoading && styles.registerButtonDisabled),
            }}
            onClick={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue to home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletePage;
