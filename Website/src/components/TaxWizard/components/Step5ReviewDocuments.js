import React from 'react';
import './StepComponents.css';
import DocumentPreview from './DocumentPreview';

const Step5ReviewDocuments = ({
  formData,
  dependents,
  isUploading,
  imageLoadingStates,
  imageErrorStates,
  onUploadDocument,
  onDeleteDocument,
  onImageLoad,
  onImageError,
  onInitializeImageStates,
}) => {
  const documentCategories = [
    { 
      id: 'previousYearTaxDocuments', 
      name: 'Previous Year Tax Documents', 
      icon: '📄',
      color: '#007bff',
      documents: formData.previousYearTaxDocuments || []
    },
    { 
      id: 'w2Forms', 
      name: 'W-2 Forms', 
      icon: '💼',
      color: '#28a745',
      documents: formData.w2Forms || []
    },
    { 
      id: 'medicalDocuments', 
      name: 'Medical Documents', 
      icon: '🏥',
      color: '#dc3545',
      documents: formData.medicalDocuments || []
    },
    { 
      id: 'educationDocuments', 
      name: 'Education Documents', 
      icon: '🎓',
      color: '#6f42c1',
      documents: formData.educationDocuments || []
    },
    { 
      id: 'dependentChildrenDocuments', 
      name: 'Tax Credits (Dependent Children)', 
      icon: '👶',
      color: '#fd7e14',
      documents: formData.dependentChildrenDocuments || []
    },
    { 
      id: 'homeownerDeductionDocuments', 
      name: 'Homeowner Deductions', 
      icon: '🏠',
      color: '#20c997',
      documents: formData.homeownerDeductionDocuments || []
    },
    { 
      id: 'personalIdDocuments', 
      name: 'Personal Documents (ID)', 
      icon: '🆔',
      color: '#17a2b8',
      documents: formData.personalIdDocuments || []
    },
  ];

  const getTotalAdditionalIncome = () => {
    const sources = formData.additionalIncomeSources || [];
    return sources.reduce((total, source) => {
      const amount = parseFloat(source.amount) || 0;
      return total + amount;
    }, 0);
  };

  const getTotalDocuments = () => {
    let total = 0;
    documentCategories.forEach(cat => {
      total += cat.documents.length;
    });
    // Add documents from additional income sources
    (formData.additionalIncomeSources || []).forEach(source => {
      total += (source.documents || []).length;
    });
    // Add general additional income documents
    total += (formData.additionalIncomeGeneralDocuments || []).length;
    return total;
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
          Review all your documents and information before submitting your tax form.
        </p>
      </div>

      {/* Summary */}
      <div className="step-category-card" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa' }}>
        <h3 className="step-category-title" style={{ marginBottom: '16px' }}>Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Total Documents</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#001826' }}>
              {getTotalDocuments()}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Dependents</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#001826' }}>
              {dependents.length}
            </p>
          </div>
          {formData.hasAdditionalIncome && (
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Additional Income</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#001826' }}>
                ${getTotalAdditionalIncome().toFixed(2)}
              </p>
            </div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>SSN Provided</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: formData.socialSecurityNumber ? '#28a745' : '#dc3545' }}>
              {formData.socialSecurityNumber ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Document Categories */}
      {documentCategories.map((category) => (
        category.documents.length > 0 && (
          <div key={category.id} className="step-category-section">
            <div className="step-category-card">
              <div className="step-category-header">
                <div className="step-category-header-content">
                  <div className="step-category-icon" style={{ backgroundColor: category.color }}>
                    <span className="step-category-icon-text">{category.icon}</span>
                  </div>
                  <div className="step-category-info">
                    <h3 className="step-category-title">{category.name}</h3>
                    <p className="step-category-description">{category.documents.length} document(s)</p>
                  </div>
                </div>
              </div>
              <div className="step-category-content">
                <div className="step-documents-list">
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
              </div>
            </div>
          </div>
        )
      ))}

      {/* Additional Income Sources */}
      {(formData.additionalIncomeSources || []).length > 0 && (
        <div className="step-category-section">
          <div className="step-category-card">
            <div className="step-category-header">
              <div className="step-category-header-content">
                <div className="step-category-icon" style={{ backgroundColor: '#16A34A' }}>
                  <span className="step-category-icon-text">💰</span>
                </div>
                <div className="step-category-info">
                  <h3 className="step-category-title">Additional Income Sources</h3>
                  <p className="step-category-description">{(formData.additionalIncomeSources || []).length} source(s)</p>
                </div>
              </div>
            </div>
            <div className="step-category-content">
              {(formData.additionalIncomeSources || []).map((source) => (
                <div key={source.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{source.source}</p>
                  <p style={{ margin: '0 0 8px 0', color: '#666' }}>Amount: ${parseFloat(source.amount || 0).toFixed(2)}</p>
                  {source.description && (
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>{source.description}</p>
                  )}
                  {(source.documents || []).length > 0 && (
                    <div className="step-documents-list">
                      {source.documents.map((doc) => (
                        <DocumentPreview
                          key={doc.id}
                          document={doc}
                          onDelete={() => onDeleteDocument(doc.id, 'additionalIncomeSources')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dependents */}
      {dependents.length > 0 && (
        <div className="step-category-section">
          <div className="step-category-card">
            <div className="step-category-header">
              <div className="step-category-header-content">
                <div className="step-category-icon" style={{ backgroundColor: '#fd7e14' }}>
                  <span className="step-category-icon-text">👶</span>
                </div>
                <div className="step-category-info">
                  <h3 className="step-category-title">Dependent Children</h3>
                  <p className="step-category-description">{dependents.length} dependent(s)</p>
                </div>
              </div>
            </div>
            <div className="step-category-content">
              {dependents.map((dependent, index) => (
                <div key={dependent.id} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Dependent {index + 1}</p>
                  <p style={{ margin: '0 0 2px 0', color: '#666' }}>Name: {dependent.name || 'Not provided'}</p>
                  <p style={{ margin: '0 0 2px 0', color: '#666' }}>Age: {dependent.age || 'Not provided'}</p>
                  <p style={{ margin: 0, color: '#666' }}>Relationship: {dependent.relationship || 'Not provided'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5ReviewDocuments;

