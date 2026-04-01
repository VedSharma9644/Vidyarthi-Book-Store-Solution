import React from 'react';
import { useNavigate } from 'react-router-dom';
import { styles, colors } from '../css/styles';
import { getResponsiveHomeStyles } from '../css/homeStyles';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import { BANNER_IMAGES } from '../config/imagePaths';

const HomeScreen = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const homeStyles = getResponsiveHomeStyles(isMobile, isTablet);

  const handleSchoolZone = () => {
    navigate('/search');
  };

  const handleGeneralBooks = () => {
    alert('General Books – Feature coming soon');
  };

  const handleReorderPrevious = () => {
    alert('Re-order functionality will be implemented');
  };

  const handleTrackOrder = () => {
    navigate('/profile');
  };

  return (
    <div style={styles.container}>
      {/* Main Content */}
      <div style={homeStyles.homeMainContent}>
        {/* Image Banner - No spacing between header and banner */}
        <div style={homeStyles.homeBannerContainer}>
          <img
            src={BANNER_IMAGES.HOMEPAGE}
            alt="Banner"
            style={homeStyles.homeBannerImage}
          />
        </div>

        {/* Text Banner */}
        <div style={homeStyles.homeTextBanner}>
          <p style={homeStyles.homeTextBannerText}>
            Back to School Sale! Get 10% Off all Stationery until Friday.
          </p>
        </div>

        {/* Content Container - Responsive */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: isMobile ? '0 16px' : '0 24px' 
        }}>
          {/* Explore & Shop Section */}
          <div style={homeStyles.homeSection}>
            <h2 style={homeStyles.homeSectionTitle}>Explore & Shop</h2>
            <div style={homeStyles.homeCardsGrid}>
              <button
                style={{
                  ...homeStyles.homeCard,
                  ...(!isMobile && { minWidth: '250px', maxWidth: '300px', flex: '1 1 250px' })
                }}
                onClick={handleSchoolZone}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, homeStyles.homeCardHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={homeStyles.homeCardIconContainer}>
                  <span style={homeStyles.homeCardIcon}>📚</span>
                </div>
                <div style={homeStyles.homeCardText}>School Zone</div>
              </button>

              <button
                style={{
                  ...homeStyles.homeCard,
                  ...(!isMobile && { minWidth: '250px', maxWidth: '300px', flex: '1 1 250px' })
                }}
                onClick={handleGeneralBooks}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, homeStyles.homeCardHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={homeStyles.homeCardIconContainer}>
                  <span style={homeStyles.homeCardIcon}>✏️</span>
                </div>
                <div style={homeStyles.homeCardText}>General Books</div>
              </button>
            </div>
          </div>

          {/* Quick Links Section */}
          <div style={homeStyles.homeSection}>
            <h2 style={homeStyles.homeSectionTitle}>Quick Links</h2>
            <div style={homeStyles.homeCardsGrid}>
              <button
                style={{
                  ...homeStyles.homeCard,
                  ...(!isMobile && { minWidth: '250px', maxWidth: '300px', flex: '1 1 250px' })
                }}
                onClick={handleReorderPrevious}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, homeStyles.homeCardHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={homeStyles.homeCardIconContainer}>
                  <span style={homeStyles.homeCardIcon}>📋</span>
                </div>
                <div style={homeStyles.homeCardText}>Re-order Previous</div>
              </button>

              <button
                style={{
                  ...homeStyles.homeCard,
                  ...(!isMobile && { minWidth: '250px', maxWidth: '300px', flex: '1 1 250px' })
                }}
                onClick={handleTrackOrder}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, homeStyles.homeCardHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={homeStyles.homeCardIconContainer}>
                  <span style={homeStyles.homeCardIcon}>📦</span>
                </div>
                <div style={homeStyles.homeCardText}>Track My Order</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

