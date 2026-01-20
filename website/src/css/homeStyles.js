// Home Screen Styles
import { colors, borderRadius } from './theme';

// Helper function to get responsive styles
export const getResponsiveHomeStyles = (isMobile, isTablet) => ({
  homeHeader: {
    backgroundColor: colors.primary,
    paddingTop: '16px',
    paddingBottom: '16px',
    paddingLeft: '20px',
    paddingRight: '20px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  homeHeaderContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  homeHeaderLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  homeLogoContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: colors.white,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12px',
  },
  homeLogoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.primary,
  },
  homeHeaderTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.white,
  },
  homeHeaderSubtitle: {
    fontSize: '14px',
    color: colors.white,
    opacity: 0.9,
  },
  homeHeaderRight: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
  },
  homeHeaderIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  homeHeaderIconText: {
    fontSize: '24px',
  },
  homeMainContent: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    overflowY: 'auto',
    paddingTop: 0, // No padding to ensure banner touches header
    marginTop: 0, // No margin to ensure banner touches header
  },
  homeBannerContainer: {
    width: '100%',
    marginTop: 0, // No top margin
    marginBottom: 0,
    paddingTop: 0, // No top padding
    paddingBottom: 0, // No bottom padding
    backgroundColor: colors.gray100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    lineHeight: 0, // Remove any line-height spacing
  },
  homeBannerImage: {
    width: '100%',
    maxHeight: isMobile ? '200px' : isTablet ? '300px' : '400px',
    objectFit: 'cover',
    display: 'block', // Remove any inline spacing
    margin: 0, // No margins
    padding: 0, // No padding
    verticalAlign: 'top', // Align to top
    lineHeight: 0, // Remove line-height spacing
  },
  homeBannerLoading: {
    width: '100%',
    minHeight: isMobile ? '200px' : '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  homeTextBanner: {
    backgroundColor: colors.primary,
    paddingTop: isMobile ? '12px' : '16px',
    paddingBottom: isMobile ? '12px' : '16px',
    paddingLeft: isMobile ? '16px' : '20px',
    paddingRight: isMobile ? '16px' : '20px',
    marginBottom: isMobile ? '16px' : '24px',
  },
  homeTextBannerText: {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
    margin: 0,
  },
  homeSection: {
    paddingLeft: isMobile ? '16px' : '20px',
    paddingRight: isMobile ? '16px' : '20px',
    marginBottom: isMobile ? '24px' : '32px',
  },
  homeSectionTitle: {
    fontSize: isMobile ? '18px' : '20px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: isMobile ? '12px' : '16px',
    margin: 0,
  },
  homeCardsRow: {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '12px' : '16px',
  },
  homeCardsGrid: {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: isMobile ? '12px' : '16px',
    justifyContent: isMobile ? 'stretch' : 'center',
  },
  homeCard: {
    flex: isMobile ? 'none' : 1,
    width: isMobile ? '100%' : 'auto',
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: isMobile ? '16px' : '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isMobile ? '120px' : '140px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  homeCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
  homeCardIconContainer: {
    marginBottom: isMobile ? '8px' : '12px',
  },
  homeCardIcon: {
    fontSize: isMobile ? '40px' : '48px',
  },
  homeCardText: {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
});

// Default export for backward compatibility
export const homeStyles = getResponsiveHomeStyles(false, false);


