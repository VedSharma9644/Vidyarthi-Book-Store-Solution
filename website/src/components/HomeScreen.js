import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles, colors } from '../css/styles';
import { getResponsiveHomeStyles } from '../css/homeStyles';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import ApiService from '../services/apiService';

const HomeScreen = () => {
  const [bannerImage, setBannerImage] = useState(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const homeStyles = getResponsiveHomeStyles(isMobile, isTablet);

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
        setBannerImage('https://via.placeholder.com/1200x300/06429c/FFFFFF?text=Welcome+to+Vidyarthi+Book+Bank');
      }
    } catch (error) {
      console.error('Error loading banner image:', error);
      // Use fallback on error
      setBannerImage('https://via.placeholder.com/1200x300/06429c/FFFFFF?text=Welcome+to+Vidyarthi+Book+Bank');
    } finally {
      setIsLoadingBanner(false);
    }
  };

  const handleBrowseBooks = () => {
    navigate('/search');
  };

  const handleShopStationery = () => {
    alert('Shop Stationery functionality will be implemented');
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
        {/* Image Banner */}
        <div style={homeStyles.homeBannerContainer}>
          {isLoadingBanner ? (
            <div style={homeStyles.homeBannerLoading}>
              <div style={{ textAlign: 'center', padding: isMobile ? '20px' : '40px' }}>
                Loading...
              </div>
            </div>
          ) : bannerImage ? (
            <img
              src={bannerImage}
              alt="Banner"
              style={homeStyles.homeBannerImage}
              onError={() => {
                setBannerImage('https://via.placeholder.com/1200x300/06429c/FFFFFF?text=Welcome+to+Vidyarthi+Book+Bank');
              }}
            />
          ) : (
            <img
              src="https://via.placeholder.com/1200x300/06429c/FFFFFF?text=Welcome+to+Vidyarthi+Book+Bank"
              alt="Banner"
              style={homeStyles.homeBannerImage}
            />
          )}
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
                onClick={handleBrowseBooks}
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
                <div style={homeStyles.homeCardText}>Browse Books</div>
              </button>

              <button
                style={{
                  ...homeStyles.homeCard,
                  ...(!isMobile && { minWidth: '250px', maxWidth: '300px', flex: '1 1 250px' })
                }}
                onClick={handleShopStationery}
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
                <div style={homeStyles.homeCardText}>Shop Stationery</div>
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

