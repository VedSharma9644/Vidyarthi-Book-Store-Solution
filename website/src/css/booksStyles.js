// Books/Grade Books Page Styles - E-commerce Design
import { colors, borderRadius, spacing } from './theme';

// Re-export colors for convenience
export { colors };

// Helper function to get responsive books styles
export const getResponsiveBooksStyles = (isMobile, isTablet) => ({
  booksPageContainer: {
    paddingTop: isMobile ? '60px' : isTablet ? '80px' : '70px', // Account for fixed top navigation
    minHeight: '100vh',
    backgroundColor: colors.backgroundLight,
  },
  booksPageHeader: {
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.borderLight}`,
    padding: isMobile ? '16px 0' : '24px 0',
    marginBottom: isMobile ? '16px' : '24px',
  },
  booksPageHeaderContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '0 16px' : '0 24px',
  },
  booksPageTitle: {
    fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: '0 0 8px 0',
  },
  booksPageSubtitle: {
    fontSize: isMobile ? '14px' : '16px',
    color: colors.textSecondary,
    margin: 0,
  },
  booksContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '0 16px 24px' : '0 24px 40px',
  },
  sectionHeader: {
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: isMobile ? '24px 0 16px 0' : '32px 0 20px 0',
    paddingBottom: '12px',
    borderBottom: `2px solid ${colors.primary}`,
  },
  booksGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile 
      ? '1fr' // 1 column on mobile for wider horizontal cards
      : isTablet 
        ? 'repeat(3, 1fr)' // 3 columns on tablet
        : 'repeat(auto-fill, minmax(240px, 1fr))', // Auto-fill on desktop
    gap: isMobile ? '12px' : isTablet ? '16px' : '24px',
    marginBottom: isMobile ? '24px' : '40px',
  },
  bookCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    border: `1px solid ${colors.borderLight}`,
  },
  // Mobile-specific horizontal card layout
  bookCardMobile: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: '12px',
    gap: '12px',
  },
  bookImageContainerMobile: {
    width: '80px',
    height: '80px',
    minWidth: '80px',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bookCardContentMobile: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0, // Allow text to shrink
  },
  bookTitleMobile: {
    fontSize: '16px',
    fontWeight: '500',
    color: colors.textPrimary,
    margin: '0 0 6px 0',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  bookPriceTableMobile: {
    marginTop: '6px',
  },
  bookPriceTableRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookPriceTableHeader: {
    flex: 1,
    fontSize: '12px',
    color: '#555',
  },
  bookPriceTableValue: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '600',
    color: '#06412c',
  },
  bookCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
  bookImageContainer: {
    width: '100%',
    height: isMobile ? '180px' : isTablet ? '220px' : '280px',
    backgroundColor: colors.gray100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bookImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  bookImagePlaceholder: {
    fontSize: '64px',
    color: colors.gray400,
  },
  bookCardContent: {
    padding: isMobile ? '12px' : '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  bookTitle: {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: '600',
    color: colors.textPrimary,
    margin: '0 0 12px 0',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: isMobile ? '40px' : '44px',
  },
  bookPriceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: isMobile ? '8px' : '12px',
  },
  bookPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: isMobile ? '12px' : '14px',
  },
  bookPriceLabel: {
    color: colors.textSecondary,
    fontSize: isMobile ? '10px' : '12px',
  },
  bookPriceValue: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: isMobile ? '12px' : '14px',
  },
  bookTotalPrice: {
    fontSize: isMobile ? '16px' : '18px',
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: '4px',
  },
  bookCardFooter: {
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: `1px solid ${colors.borderLight}`,
  },
  addToCartButton: {
    width: '100%',
    padding: isMobile ? '8px 12px' : '10px 16px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  addToCartButtonHover: {
    backgroundColor: '#053080',
    transform: 'scale(1.02)',
  },
  optionalBundleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.borderLight}`,
  },
  bundleCheckbox: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: `2px solid ${colors.gray400}`,
    backgroundColor: colors.white,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bundleCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bundleTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: colors.textPrimary,
    margin: 0,
  },
  bundleDescription: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: '4px 0 0 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: colors.textSecondary,
  },
  emptyStateIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyStateText: {
    fontSize: '18px',
    margin: 0,
  },
  stickyCartButton: {
    position: 'fixed',
    bottom: isMobile ? '16px' : '24px',
    right: isMobile ? '16px' : '24px',
    zIndex: 1000,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.lg,
    padding: isMobile ? '12px 20px' : '16px 32px',
    fontSize: isMobile ? '14px' : '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    transition: 'all 0.2s ease',
  },
  stickyCartButtonHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
  },
  cartButtonBadge: {
    backgroundColor: colors.white,
    color: colors.primary,
    borderRadius: '50%',
    width: isMobile ? '20px' : '24px',
    height: isMobile ? '20px' : '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '10px' : '12px',
    fontWeight: 'bold',
  },
});

// Default export for backward compatibility
export const booksStyles = getResponsiveBooksStyles(false, false);

