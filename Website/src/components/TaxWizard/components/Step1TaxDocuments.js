import React, { useRef } from 'react';
import './StepComponents.css';
import DocumentPreview from './DocumentPreview';

const Step1TaxDocuments = ({
  formData,
  isUploading,
  imageLoadingStates,
  imageErrorStates,
  onUploadDocument,
  onDeleteDocument,
  onImageLoad,
  onImageError,
  onInitializeImageStates,
}) => {
  const fileInputRefs = {
    previousYearTax: useRef(null),
    w2Forms: useRef(null),
  };

  const documentCategories = [
    { 
      id: 'previousYearTaxDocuments', 
      name: 'Previous Year Tax Documents', 
      description: 'Your previous year tax return and related documents', 
      icon: '📄',
      color: '#007bff',
      documents: formData.previousYearTaxDocuments || []
    },
    { 
      id: 'w2Forms', 
      name: 'W-2 Forms', 
      description: 'Wage and tax statements from all employers', 
      icon: '💼',
      color: '#28a745',
      documents: formData.w2Forms || []
    },
  ];

  const handleFileSelect = (category, event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      onUploadDocument(file, category);
    });
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleDeleteDocument = (id, category) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      onDeleteDocument(id, category);
    }
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <p className="step-description">
          Upload your tax documents including previous year returns and W-2 forms.
        </p>
      </div>

      {documentCategories.map((category) => (
        <div key={category.id} className="step-category-section">
          <div className="step-category-card">
            <div className="step-category-header">
              <div className="step-category-header-content">
                <div className="step-category-icon" style={{ backgroundColor: category.color }}>
                  <span className="step-category-icon-text">{category.icon}</span>
                </div>
                <div className="step-category-info">
                  <h3 className="step-category-title">{category.name}</h3>
                  <p className="step-category-description">{category.description}</p>
                </div>
              </div>
            </div>
            <div className="step-category-content">
              <div className="step-category-actions">
                <input
                  ref={fileInputRefs[category.id === 'previousYearTaxDocuments' ? 'previousYearTax' : 'w2Forms']}
                  type="file"
                  id={`file-input-${category.id}`}
                  style={{ display: 'none' }}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileSelect(category.id, e)}
                />
                <button
                  className="step-action-button"
                  style={{ borderColor: category.color, color: category.color }}
                  onClick={() => {
                    const input = fileInputRefs[category.id === 'previousYearTaxDocuments' ? 'previousYearTax' : 'w2Forms'].current;
                    if (input) input.click();
                  }}
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

              {/* Uploaded Documents for this category */}
              {category.documents.length > 0 && (
                <div className="step-documents-list">
                  <p className="step-documents-title">Uploaded Documents ({category.documents.length})</p>
                  {category.documents.map((doc) => (
                    <DocumentPreview
                      key={doc.id}
                      document={doc}
                      onDelete={() => handleDeleteDocument(doc.id, category.id)}
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
      ))}

      {isUploading && (
        <div className="step-uploading-overlay">
          <p className="step-uploading-text">Uploading documents...</p>
        </div>
      )}
    </div>
  );
};

export default Step1TaxDocuments;

