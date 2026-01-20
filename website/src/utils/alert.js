/**
 * Utility function to replace browser alert() with custom modal
 * This provides a drop-in replacement for alert() calls
 */

let modalContext = null;

/**
 * Initialize the alert utility with the modal context
 * This should be called from a component that has access to useModal
 */
export const initAlert = (modal) => {
  modalContext = modal;
};

/**
 * Show an alert modal (replacement for window.alert)
 * @param {string} message - The message to display
 * @param {string} title - Optional title (defaults to null)
 * @param {string} type - Alert type: 'info', 'success', 'error', 'warning' (defaults to 'info')
 */
export const alert = (message, title = null, type = 'info') => {
  if (modalContext) {
    modalContext.showAlert(message, title, type);
  } else {
    // Fallback to browser alert if modal context is not initialized
    console.warn('Modal context not initialized, falling back to browser alert');
    window.alert(message);
  }
};

/**
 * Show a success alert
 */
export const alertSuccess = (message, title = 'Success') => {
  if (modalContext) {
    modalContext.showSuccess(message, title);
  } else {
    window.alert(message);
  }
};

/**
 * Show an error alert
 */
export const alertError = (message, title = 'Error') => {
  if (modalContext) {
    modalContext.showError(message, title);
  } else {
    window.alert(message);
  }
};

/**
 * Show a warning alert
 */
export const alertWarning = (message, title = 'Warning') => {
  if (modalContext) {
    modalContext.showWarning(message, title);
  } else {
    window.alert(message);
  }
};

/**
 * Show an info alert
 */
export const alertInfo = (message, title = 'Information') => {
  if (modalContext) {
    modalContext.showInfo(message, title);
  } else {
    window.alert(message);
  }
};

