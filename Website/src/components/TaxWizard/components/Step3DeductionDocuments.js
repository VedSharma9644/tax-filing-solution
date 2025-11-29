import React, { useRef } from 'react';
import './StepComponents.css';
import DocumentPreview from './DocumentPreview';

const Step3DeductionDocuments = ({
  formData,
  dependents,
  numberOfDependents,
  isUploading,
  imageLoadingStates,
  imageErrorStates,
  onUploadDocument,
  onDeleteDocument,
  onImageLoad,
  onImageError,
  onInitializeImageStates,
  onUpdateNumberOfDependents,
  onUpdateDependent,
  onRemoveDependent,
}) => {
  const fileInputRefs = {
    medical: useRef(null),
    education: useRef(null),
    dependentChildren: useRef(null),
    homeownerDeduction: useRef(null),
  };

  const documentCategories = [
    { 
      id: 'medicalDocuments', 
      name: 'Medical Documents', 
      description: 'Medical bills, prescriptions, and health insurance statements', 
      icon: '🏥',
      color: '#dc3545',
      documents: formData.medicalDocuments || []
    },
    { 
      id: 'educationDocuments', 
      name: 'Education Documents', 
      description: 'Tuition statements, student loan interest, and education expenses', 
      icon: '🎓',
      color: '#6f42c1',
      documents: formData.educationDocuments || []
    },
    { 
      id: 'dependentChildrenDocuments', 
      name: 'Tax Credits (Dependent Children)', 
      description: 'Documents related to dependent children for tax credits', 
      icon: '👶',
      color: '#fd7e14',
      documents: formData.dependentChildrenDocuments || []
    },
    { 
      id: 'homeownerDeductionDocuments', 
      name: 'Homeowner Deductions', 
      description: 'Mortgage interest statements, property tax receipts, and home improvement receipts', 
      icon: '🏠',
      color: '#20c997',
      documents: formData.homeownerDeductionDocuments || []
    },
  ];

  const handleFileSelect = (category, event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      onUploadDocument(file, category);
    });
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
          Upload documents for deductions and tax credits. You can also add information about dependent children.
        </p>
      </div>

      {/* Dependents Section */}
      <div className="step-category-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <h3 className="step-category-title" style={{ marginBottom: '16px' }}>Dependent Children</h3>
        
        <div className="step-input-group">
          <label className="step-input-label">Number of Dependent Children</label>
          <input
            type="number"
            className="step-input"
            placeholder="0"
            value={numberOfDependents}
            onChange={(e) => onUpdateNumberOfDependents(e.target.value)}
            min="0"
          />
        </div>

        {dependents.length > 0 && (
          <div className="step-dependents-list">
            {dependents.map((dependent, index) => (
              <div key={dependent.id} className="step-dependent-card" style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Dependent {index + 1}</h4>
                  <button
                    className="document-preview-delete"
                    onClick={() => onRemoveDependent(dependent.id)}
                    title="Remove dependent"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                
                <div className="step-input-group">
                  <label className="step-input-label">Name</label>
                  <input
                    type="text"
                    className="step-input"
                    placeholder="Child's full name"
                    value={dependent.name || ''}
                    onChange={(e) => onUpdateDependent(dependent.id, 'name', e.target.value)}
                  />
                </div>
                
                <div className="step-input-group">
                  <label className="step-input-label">Age</label>
                  <input
                    type="number"
                    className="step-input"
                    placeholder="Age"
                    value={dependent.age || ''}
                    onChange={(e) => onUpdateDependent(dependent.id, 'age', e.target.value)}
                    min="0"
                    max="18"
                  />
                </div>
                
                <div className="step-input-group">
                  <label className="step-input-label">Relationship</label>
                  <input
                    type="text"
                    className="step-input"
                    placeholder="e.g., Son, Daughter"
                    value={dependent.relationship || ''}
                    onChange={(e) => onUpdateDependent(dependent.id, 'relationship', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Categories */}
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
                  ref={fileInputRefs[category.id.replace('Documents', '')]}
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
                    const refKey = category.id.replace('Documents', '');
                    const input = fileInputRefs[refKey]?.current;
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
    </div>
  );
};

export default Step3DeductionDocuments;

