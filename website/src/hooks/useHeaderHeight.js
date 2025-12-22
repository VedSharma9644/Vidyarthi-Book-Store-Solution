import { useIsMobile, useIsTablet } from './useMediaQuery';

/**
 * Hook to get the responsive header height
 * This ensures all pages use the correct paddingTop to account for the fixed header
 */
export const useHeaderHeight = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Match the heights in navigationStyles.js
  if (isMobile) return '60px';
  if (isTablet) return '80px';
  return '70px';
};

