/**
 * Styles for the School page only.
 * Keeps layout (e.g. no gap between header and banner) isolated from the rest of the site.
 */
import { colors } from './theme';

/**
 * @param {number|string} _headerHeight - Unused; kept for API compatibility. School page has no top padding so banner touches header.
 */
export const getSchoolPageStyles = (_headerHeight) => ({
  // Page wrapper: no padding-top so section content (banner) starts at top and touches the sticky header
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: colors.backgroundLight,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 0,
  },
  // Content area: no top/side padding so banner can touch header and optionally go full-bleed
  pageContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    paddingTop: 0,
    paddingBottom: '40px',
    paddingLeft: 0,
    paddingRight: 0,
  },
  // Banner wrapper: no top margin/padding; horizontal padding for content below
  bannerWrap: {
    padding: '0 16px',
    marginTop: 0,
    marginBottom: '20px',
  },
  // Rest of content uses same horizontal padding for alignment
  sectionPadding: {
    paddingLeft: '16px',
    paddingRight: '16px',
  },
});
