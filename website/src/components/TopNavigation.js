import React, { useState } from 'react';
import { Link, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { getResponsiveNavigationStyles } from '../css/navigationStyles';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import { LOGO_IMAGES } from '../config/imagePaths';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitleContext } from '../contexts/PageTitleContext';

const TOP_LEVEL_PATHS = ['/', '/search', '/cart', '/profile'];

const TopNavigation = () => {
  const { isLoggedIn, user } = useAuth();
  const { pageTitle } = usePageTitleContext();
  const location = useLocation();
  const navigate = useNavigate();
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
    if (currentPath === '/') return 'home';
    if (currentPath.startsWith('/search') || matchPath('/school/:schoolId', currentPath) || matchPath('/grade/:gradeId', currentPath) || matchPath('/grade/:gradeId/sections', currentPath)) {
      return 'search';
    }
    if (currentPath.startsWith('/cart') || currentPath.startsWith('/checkout')) return 'cart';
    if (currentPath.startsWith('/profile') || currentPath.startsWith('/orders')) return 'profile';
    const activeTab = tabs.find((tab) => tab.path === currentPath);
    return activeTab ? activeTab.id : 'home';
  };

  if (!isLoggedIn) {
    return null;
  }

  const activeTab = getActiveTab();
  const showBack = !TOP_LEVEL_PATHS.includes(location.pathname);
  const displayTitle = pageTitle || '';

  return (
    <div style={navStyles.topNavigation}>
      <div style={{ ...navStyles.topNavContent, position: 'relative' }}>
        <div style={navStyles.topNavLeft}>
          {showBack ? (
            <button
              type="button"
              style={navStyles.backButton}
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              ←
            </button>
          ) : null}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src={LOGO_IMAGES.MAIN}
              alt="Vidyarthi Kart Logo"
              style={{
                height: isMobile ? '36px' : isTablet ? '50px' : '50px',
                width: 'auto',
                objectFit: 'contain',
                marginRight: isMobile ? '0' : '12px',
                display: isMobile && displayTitle ? 'none' : 'block',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Link>
          {!isMobile && displayTitle ? (
            <span style={navStyles.pageTitleDesktop} title={displayTitle}>
              {displayTitle}
            </span>
          ) : null}
        </div>

        {isMobile && displayTitle ? (
          <div style={navStyles.pageTitleWrap} aria-live="polite">
            <span style={navStyles.pageTitleText} title={displayTitle}>
              {displayTitle}
            </span>
          </div>
        ) : null}

        <div style={navStyles.topNavCenter}>
          {!isMobile &&
            tabs.map((tab) => (
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

        <div style={navStyles.topNavRight}>
          {isMobile && (
            <button
              style={navStyles.mobileMenuToggle}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              type="button"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          )}
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
