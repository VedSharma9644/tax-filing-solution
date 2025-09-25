import React, { useState, useEffect } from 'react';
import './Modal.css';

const InputModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  placeholder = '',
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'text',
  required = false,
  validation = null,
  isLoading = false,
  loadingText = 'Processing...'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    return (
      <svg className="modal-icon info" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const validateInput = (value) => {
    if (required && !value.trim()) {
      return 'This field is required';
    }
    if (validation && typeof validation === 'function') {
      return validation(value);
    }
    return null;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (error) {
      const validationError = validateInput(value);
      setError(validationError || '');
    }
  };

  const handleConfirm = () => {
    if (isLoading) return;

    const validationError = validateInput(inputValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    onConfirm(inputValue);
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleConfirm();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {getIcon()}
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
          <div className="modal-input-container">
            <input
              type={type}
              className={`modal-input ${error ? 'modal-input-error' : ''}`}
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              autoFocus
            />
            {error && <span className="modal-error-text">{error}</span>}
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="modal-button modal-button-secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className="modal-button modal-button-primary"
            onClick={handleConfirm}
            disabled={isLoading || (required && !inputValue.trim())}
          >
            {isLoading ? (
              <>
                <svg className="modal-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="modal-spinner-circle"/>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" className="modal-spinner-path"/>
                </svg>
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
