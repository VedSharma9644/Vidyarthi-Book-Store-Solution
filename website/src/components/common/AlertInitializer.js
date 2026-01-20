import { useEffect } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { initAlert } from '../../utils/alert';

/**
 * Component to initialize the alert utility with modal context
 * This should be placed high in the component tree (e.g., in App.js)
 */
const AlertInitializer = () => {
  const modal = useModal();

  useEffect(() => {
    initAlert(modal);
  }, [modal]);

  return null;
};

export default AlertInitializer;

