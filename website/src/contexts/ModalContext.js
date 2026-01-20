import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '../components/common/Modal';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: null,
    message: '',
    type: 'info',
    showCloseButton: true,
  });

  const showModal = useCallback(({ title, message, type = 'info', showCloseButton = true }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      showCloseButton,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Convenience methods
  const showAlert = useCallback((message, title = null, type = 'info') => {
    showModal({ title, message, type, showCloseButton: true });
  }, [showModal]);

  const showSuccess = useCallback((message, title = 'Success') => {
    showModal({ title, message, type: 'success', showCloseButton: true });
  }, [showModal]);

  const showError = useCallback((message, title = 'Error') => {
    showModal({ title, message, type: 'error', showCloseButton: true });
  }, [showModal]);

  const showWarning = useCallback((message, title = 'Warning') => {
    showModal({ title, message, type: 'warning', showCloseButton: true });
  }, [showModal]);

  const showInfo = useCallback((message, title = 'Information') => {
    showModal({ title, message, type: 'info', showCloseButton: true });
  }, [showModal]);

  const value = {
    showModal,
    hideModal,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        showCloseButton={modalState.showCloseButton}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

