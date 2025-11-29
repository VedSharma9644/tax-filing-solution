import React, { useState, useRef } from 'react';
import './StepComponents.css';
import DocumentPreview from './DocumentPreview';

const Step4PersonalInfo = ({
  formData,
  isUploading,
  imageLoadingStates,
  imageErrorStates,
  onUpdateFormData,
  onUploadDocument,
  onDeleteDocument,
  onImageLoad,
  onImageError,
  onInitializeImageStates,
}) => {
  const [ssnError, setSsnError] = useState('');
  const fileInputRef = useRef(null);

  const formatSSN = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  const handleSSNChange = (value) => {
    const formatted = formatSSN(value);
    onUpdateFormData('socialSecurityNumber', formatted);
    
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 9) {
      setSsnError('SSN must be 9 digits');
    } else if (digits.length === 9) {
      setSsnError('');
    } else {
      setSsnError('');
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      onUploadDocument(file, 'personalIdDocuments');
    });
    event.target.value = '';
  };

  const handleDeleteDocument = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      onDeleteDocument(id, 'personalIdDocuments');
    }
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <p className="step-description">
          Provide your Social Security Number and upload personal identification documents.
        </p>
      </div>

      {/* SSN Input */}
      <div className="step-category-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <h3 className="step-category-title" style={{ marginBottom: '16px' }}>Social Security Number</h3>
        
        <div className="step-input-group">
          <label className="step-input-label">SSN</label>
          <input
            type="text"
            className={`step-input ${ssnError ? 'step-input-error' : ''}`}
            placeholder="XXX-XX-XXXX"
            value={formData.socialSecurityNumber || ''}
            onChange={(e) => handleSSNChange(e.target.value)}
            maxLength="11"
          />
          {ssnError && <p className="step-error-message">{ssnError}</p>}
        </div>
      </div>

      {/* Personal ID Documents */}
      <div className="step-category-section">
        <div className="step-category-card">
          <div className="step-category-header">
            <div className="step-category-header-content">
              <div className="step-category-icon" style={{ backgroundColor: '#17a2b8' }}>
                <span className="step-category-icon-text">🆔</span>
              </div>
              <div className="step-category-info">
                <h3 className="step-category-title">Personal Identification Documents</h3>
                <p className="step-category-description">Driver's license, passport, or other government-issued ID</p>
              </div>
            </div>
          </div>
          <div className="step-category-content">
            <div className="step-category-actions">
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
              />
              <button
                className="step-action-button"
                style={{ borderColor: '#17a2b8', color: '#17a2b8' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>Select File</span>
              </button>
            </div>

            {(formData.personalIdDocuments || []).length > 0 && (
              <div className="step-documents-list">
                <p className="step-documents-title">
                  Uploaded Documents ({formData.personalIdDocuments.length})
                </p>
                {formData.personalIdDocuments.map((doc) => (
                  <DocumentPreview
                    key={doc.id}
                    document={doc}
                    onDelete={() => handleDeleteDocument(doc.id)}
                    onImageLoad={() => onImageLoad(doc.id)}
                    onImageError={() => onImageError(doc.id)}
                    imageLoading={imageLoadingStates[doc.id]}
                    imageError={imageErrorStates[doc.id]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4PersonalInfo;

