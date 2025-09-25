import React, { createContext, useContext, useState } from 'react';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';
import InputModal from '../components/InputModal';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);

  const showAlert = (options) => {
    const id = Date.now() + Math.random();
    const modal = {
      id,
      type: 'alert',
      isOpen: true,
      ...options
    };
    setModals(prev => [...prev, modal]);
    return id;
  };

  const showConfirm = (options) => {
    const id = Date.now() + Math.random();
    const modal = {
      id,
      type: 'confirm',
      isOpen: true,
      ...options
    };
    setModals(prev => [...prev, modal]);
    return id;
  };

  const showInput = (options) => {
    const id = Date.now() + Math.random();
    const modal = {
      id,
      type: 'input',
      isOpen: true,
      ...options
    };
    setModals(prev => [...prev, modal]);
    return id;
  };

  const closeModal = (id) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  };

  const closeAllModals = () => {
    setModals([]);
  };

  const renderModal = (modal) => {
    const commonProps = {
      isOpen: modal.isOpen,
      onClose: () => closeModal(modal.id)
    };

    switch (modal.type) {
      case 'alert':
        return <AlertModal {...commonProps} {...modal} />;
      case 'confirm':
        return (
          <ConfirmModal 
            {...commonProps} 
            {...modal}
            onConfirm={() => {
              if (modal.onConfirm) {
                modal.onConfirm();
              }
              closeModal(modal.id);
            }}
          />
        );
      case 'input':
        return (
          <InputModal 
            {...commonProps} 
            {...modal}
            onConfirm={(value) => {
              if (modal.onConfirm) {
                modal.onConfirm(value);
              }
              closeModal(modal.id);
            }}
          />
        );
      default:
        return null;
    }
  };

  const value = {
    showAlert,
    showConfirm,
    showInput,
    closeModal,
    closeAllModals
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map(renderModal)}
    </ModalContext.Provider>
  );
};
