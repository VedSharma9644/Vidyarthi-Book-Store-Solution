// Navigation Styles (Top Navigation Bar)
import { colors, borderRadius } from './theme';

// Helper function to get responsive navigation styles
export const getResponsiveNavigationStyles = (isMobile, isTablet) => ({
  topNavigation: {
    backgroundColor: colors.primary,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colors.borderLight,
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  topNavContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: isMobile ? '60px' : isTablet ? '80px' : '70px',
    maxWidth: '1200px',
    margin: '0 auto',
    paddingLeft: isMobile ? '12px' : '20px',
    paddingRight: isMobile ? '12px' : '20px',
  },
  topNavLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: '0 0 auto',
  },
  topNavCenter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: isMobile ? '4px' : '8px',
    display: isMobile ? 'none' : 'flex',
  },
  topNavRight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: '0 0 auto',
    gap: '16px',
  },
  topNavItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: isMobile ? '6px' : '10px',
    paddingBottom: isMobile ? '6px' : '10px',
    paddingLeft: isMobile ? '8px' : '16px',
    paddingRight: isMobile ? '8px' : '16px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: borderRadius.md,
    transition: 'background-color 0.2s',
    gap: isMobile ? '4px' : '8px',
  },
  topNavItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  topNavIcon: {
    fontSize: isMobile ? '20px' : isTablet ? '24px' : '20px',
    color: colors.white,
    opacity: 0.9,
  },
  topNavIconActive: {
    opacity: 1,
  },
  topNavLabel: {
    fontSize: isMobile ? '12px' : isTablet ? '14px' : '14px',
    fontWeight: '500',
    color: colors.white,
    opacity: 0.9,
    display: isMobile ? 'none' : 'inline', // Hide labels on mobile
  },
  topNavLabelActive: {
    fontWeight: '700',
    opacity: 1,
  },
  topNavIconButton: {
    width: isMobile ? '36px' : isTablet ? '44px' : '40px',
    height: isMobile ? '36px' : isTablet ? '44px' : '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.2s',
  },
  topNavIconText: {
    fontSize: isMobile ? '18px' : isTablet ? '22px' : '20px',
  },
  topNavUser: {
    display: isMobile ? 'none' : 'flex', // Hide user name on mobile
    alignItems: 'center',
    paddingLeft: '12px',
    paddingRight: '12px',
  },
  topNavUserName: {
    fontSize: isMobile ? '12px' : isTablet ? '14px' : '14px',
    fontWeight: '500',
    color: colors.white,
    opacity: 0.95,
  },
  // Mobile menu
  mobileMenuToggle: {
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    color: colors.white,
    fontSize: '20px',
  },
  mobileMenuPanel: {
    position: 'absolute',
    top: isMobile ? '60px' : '70px',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
    borderBottom: `1px solid ${colors.borderLight}`,
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
  },
  mobileMenuItem: {
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: colors.textPrimary,
    textDecoration: 'none',
    borderBottom: `1px solid ${colors.borderLight}`,
  },
  mobileMenuItemActive: {
    backgroundColor: 'rgba(6,66,156,0.08)',
    color: colors.primary,
  },
});

// Default export for backward compatibility
export const navigationStyles = getResponsiveNavigationStyles(false, false);


