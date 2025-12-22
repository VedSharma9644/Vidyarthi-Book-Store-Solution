import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { styles, colors } from '../css/styles';
import { getResponsiveNavigationStyles } from '../css/navigationStyles';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import { LOGO_IMAGES } from '../config/imagePaths';
import { useAuth } from '../contexts/AuthContext';

const TopNavigation = ({ onLogout }) => {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const navStyles = getResponsiveNavigationStyles(isMobile, isTablet);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/' },
    { id: 'search', label: 'School Zone', icon: '🔍', path: '/search' },
    { id: 'cart', label: 'Cart', icon: '🛒', path: '/cart' },
    { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
  ];

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const activeTab = tabs.find(tab => tab.path === currentPath);
    return activeTab ? activeTab.id : 'home';
  };

  if (!isLoggedIn) {
    return null; // Don't show navigation if not logged in
  }

  const activeTab = getActiveTab();

  return (
    <div style={navStyles.topNavigation}>
      <div style={navStyles.topNavContent}>
        {/* Logo Section */}
        <div style={navStyles.topNavLeft}>
          <img
            src={LOGO_IMAGES.MAIN}
            alt="Vidyarthi Kart Logo"
            style={{
              height: isMobile ? '40px' : isTablet ? '50px' : '50px',
              width: 'auto',
              objectFit: 'contain',
              marginRight: isMobile ? '8px' : '12px',
            }}
            onError={(e) => {
              // Fallback to text if image fails
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Navigation Links */}
        <div style={navStyles.topNavCenter}>
          {!isMobile && tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              style={{
                ...navStyles.topNavItem,
                ...(activeTab === tab.id && navStyles.topNavItemActive),
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  ...navStyles.topNavIcon,
                  ...(activeTab === tab.id && navStyles.topNavIconActive),
                }}
              >
                {tab.icon}
              </span>
              <span
                style={{
                  ...navStyles.topNavLabel,
                  ...(activeTab === tab.id && navStyles.topNavLabelActive),
                }}
              >
                {tab.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right Section - Icons & User */}
        <div style={navStyles.topNavRight}>
          {isMobile && (
            <button
              style={navStyles.mobileMenuToggle}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          )}
          <button
            style={navStyles.topNavIconButton}
            onClick={() => alert('Notifications will be implemented')}
            title="Notifications"
          >
            <span style={navStyles.topNavIconText}>🔔</span>
          </button>
          <Link
            to="/cart"
            style={{
              ...navStyles.topNavIconButton,
              textDecoration: 'none',
            }}
            title="Cart"
          >
            <span style={navStyles.topNavIconText}>🛒</span>
          </Link>
          {user && (
            <div style={navStyles.topNavUser}>
              <span style={navStyles.topNavUserName}>
                {user.firstName || user.email?.split('@')[0] || 'User'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && isMenuOpen && (
        <div style={navStyles.mobileMenuPanel}>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              style={{
                ...navStyles.mobileMenuItem,
                ...(activeTab === tab.id && navStyles.mobileMenuItemActive),
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopNavigation;


