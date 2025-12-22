// Main styles export file - combines all style modules
// This maintains backward compatibility with existing imports

import { colors, typography, spacing, borderRadius } from './theme';
import { commonStyles } from './commonStyles';
import { authStyles } from './authStyles';
import { homeStyles } from './homeStyles';
import { navigationStyles, getResponsiveNavigationStyles } from './navigationStyles';
import { searchStyles } from './searchStyles';
import { booksStyles } from './booksStyles';
import { cartStyles } from './cartStyles';
import { checkoutStyles } from './checkoutStyles';
import { profileStyles } from './profileStyles';
import { orderStyles } from './orderStyles';

// Export theme constants
export { colors, typography, spacing, borderRadius };

// Export style modules separately for direct import
export { booksStyles, cartStyles, checkoutStyles, profileStyles, orderStyles };
export { getResponsiveNavigationStyles };

// Combine all styles into a single object for backward compatibility
export const styles = {
  ...commonStyles,
  ...authStyles,
  ...homeStyles,
  ...navigationStyles,
  ...searchStyles,
};

// You can also import specific style modules directly:
// import { authStyles } from './css/authStyles';
// import { homeStyles } from './css/homeStyles';
// etc.
