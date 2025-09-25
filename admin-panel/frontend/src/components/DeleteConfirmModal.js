import React, { useState } from 'react';
import './DeleteConfirmModal.css';
import { useModal } from '../contexts/ModalContext';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, userName, userEmail }) => {
  const { showAlert } = useModal();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (confirmText === 'Delete') {
      setIsDeleting(true);
      try {
        await onConfirm();
        onClose();
        setConfirmText('');
      } catch (error) {
        console.error('Error deleting user:', error);
        showAlert({
          title: 'Error',
          message: 'Failed to delete user. Please try again.',
          type: 'error'
        });
      } finally {
        setIsDeleting(false);
      }
    } else {
      showAlert({
        title: 'Validation Error',
        message: 'Please type "Delete" exactly to confirm deletion.',
        type: 'warning'
      });
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Delete User</h2>
          <button className="close-button" onClick={handleClose} disabled={isDeleting}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="warning-message">
            <p>Are you sure you want to delete this user?</p>
            <div className="user-info">
              <strong>Name:</strong> {userName || 'N/A'}<br/>
              <strong>Email:</strong> {userEmail || 'N/A'}
            </div>
            <p className="warning-text">
              This action cannot be undone. All user data will be permanently deleted.
            </p>
          </div>
          
          <div className="confirmation-input">
            <label htmlFor="confirmText">
              Type <strong>"Delete"</strong> to confirm:
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'Delete' here"
              disabled={isDeleting}
              autoFocus
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            className="delete-button" 
            onClick={handleConfirm}
            disabled={confirmText !== 'Delete' || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
