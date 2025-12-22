// Common/Shared Styles used across multiple components
import { colors, borderRadius } from './theme';

export const commonStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.backgroundLight,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: '24px',
    paddingBottom: '24px',
    paddingLeft: '24px',
    paddingRight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: colors.white,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: '24px',
    paddingRight: '24px',
    paddingTop: '32px',
    paddingBottom: '32px',
  },
  // Form Elements
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputContainer: {
    marginBottom: 0,
  },
  input: {
    width: '100%',
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingLeft: '16px',
    paddingRight: '16px',
    backgroundColor: colors.inputLight,
    color: colors.textLight,
    borderRadius: borderRadius.md,
    fontSize: '16px',
    border: 'none',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputFocused: {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colors.primary,
  },
  // Buttons
  button: {
    borderRadius: borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  buttonDisabled: {
    backgroundColor: colors.gray400,
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  // Header Content
  headerContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '400px',
    margin: '0 auto',
    width: '100%',
  },
  backButton: {
    padding: '8px',
    marginLeft: '-8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
  },
  backButtonText: {
    fontSize: '24px',
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: '24px',
  },
};


