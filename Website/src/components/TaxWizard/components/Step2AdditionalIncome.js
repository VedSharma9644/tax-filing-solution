import React, { useState, useRef } from 'react';
import './StepComponents.css';
import DocumentPreview from './DocumentPreview';

const Step2AdditionalIncome = ({
  formData,
  onUpdateFormData,
  onUploadIncomeSourceDocument,
  onDeleteIncomeSourceDocument,
  onUploadDocument,
  onDeleteDocument,
  isUploading = false,
}) => {
  const [newIncomeSource, setNewIncomeSource] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newIncomeDescription, setNewIncomeDescription] = useState('');
  const generalDocsInputRef = useRef(null);

  const commonIncomeSources = [
    'Investment Income (Stocks, Bonds)',
    'Rental Income',
    'Freelance/Self-Employment',
    'Interest Income (Savings, CDs)',
    'Dividend Income',
    'Capital Gains (Property Sale)',
    'Business Income',
    'Royalty Income',
    'Pension/Annuity Income',
    'Unemployment Benefits',
    'Social Security Benefits',
    'Other'
  ];

  const handleHasAdditionalIncomeChange = (hasIncome) => {
    onUpdateFormData('hasAdditionalIncome', hasIncome);
    if (!hasIncome) {
      onUpdateFormData('additionalIncomeSources', []);
    }
  };

  const addIncomeSource = () => {
    if (!newIncomeSource.trim() || !newIncomeAmount.trim()) {
      alert('Please fill in both income source and amount.');
      return;
    }

    const amount = parseFloat(newIncomeAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const newSource = {
      id: Date.now().toString(),
      source: newIncomeSource.trim(),
      amount: newIncomeAmount.trim(),
      description: newIncomeDescription.trim() || undefined,
      documents: []
    };

    const currentSources = formData.additionalIncomeSources || [];
    const updatedSources = [...currentSources, newSource];
    onUpdateFormData('additionalIncomeSources', updatedSources);

    // Reset form
    setNewIncomeSource('');
    setNewIncomeAmount('');
    setNewIncomeDescription('');
  };

  const removeIncomeSource = (id) => {
    const updatedSources = (formData.additionalIncomeSources || []).filter(source => source.id !== id);
    onUpdateFormData('additionalIncomeSources', updatedSources);
  };

  const handleIncomeSourceFileSelect = (incomeSourceId, event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      onUploadIncomeSourceDocument(file, incomeSourceId);
    });
    event.target.value = '';
  };

  const handleGeneralDocsFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      onUploadDocument(file, 'additionalIncomeGeneralDocuments');
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
          Add any additional income sources beyond your W-2 forms. You can upload supporting documents for each income source.
        </p>
      </div>

      {/* Toggle for additional income */}
      <div className="step-toggle-container">
        <label className="step-toggle-switch">
          <input
            type="checkbox"
            checked={formData.hasAdditionalIncome || false}
            onChange={(e) => handleHasAdditionalIncomeChange(e.target.checked)}
          />
          <span className="step-toggle-slider"></span>
        </label>
        <span className="step-toggle-label">I have additional income sources</span>
      </div>

      {formData.hasAdditionalIncome && (
        <>
          {/* Add Income Source Form */}
          <div className="step-category-card" style={{ marginBottom: '24px', padding: '16px' }}>
            <h3 className="step-category-title" style={{ marginBottom: '16px' }}>Add Income Source</h3>
            
            <div className="step-input-group">
              <label className="step-input-label">Income Source</label>
              <select
                className="step-input"
                value={newIncomeSource}
                onChange={(e) => setNewIncomeSource(e.target.value)}
              >
                <option value="">Select income source...</option>
                {commonIncomeSources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <div className="step-input-group">
              <label className="step-input-label">Amount ($)</label>
              <input
                type="number"
                className="step-input"
                placeholder="0.00"
                value={newIncomeAmount}
                onChange={(e) => setNewIncomeAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="step-input-group">
              <label className="step-input-label">Description (Optional)</label>
              <textarea
                className="step-textarea"
                placeholder="Add any additional details about this income source..."
                value={newIncomeDescription}
                onChange={(e) => setNewIncomeDescription(e.target.value)}
                rows="3"
              />
            </div>

            <button
              className="step-action-button"
              style={{ borderColor: '#0E502B', color: '#0E502B', width: '100%', justifyContent: 'center' }}
              onClick={addIncomeSource}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Add Income Source</span>
            </button>
          </div>

          {/* Income Sources List */}
          {(formData.additionalIncomeSources || []).length > 0 && (
            <div className="step-category-section">
              <h3 className="step-category-title" style={{ marginBottom: '16px' }}>Income Sources</h3>
              {(formData.additionalIncomeSources || []).map((source) => (
                <div key={source.id} className="step-category-card" style={{ marginBottom: '16px' }}>
                  <div className="step-category-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div>
                        <h4 className="step-category-title" style={{ marginBottom: '4px' }}>{source.source}</h4>
                        <p className="step-category-description">Amount: ${parseFloat(source.amount || 0).toFixed(2)}</p>
                        {source.description && (
                          <p className="step-category-description" style={{ marginTop: '4px' }}>{source.description}</p>
                        )}
                      </div>
                      <button
                        className="document-preview-delete"
                        onClick={() => removeIncomeSource(source.id)}
                        title="Remove income source"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="step-category-content">
                    <input
                      type="file"
                      id={`income-source-${source.id}`}
                      style={{ display: 'none' }}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleIncomeSourceFileSelect(source.id, e)}
                    />
                    <button
                      className="step-action-button"
                      style={{ borderColor: '#007bff', color: '#007bff' }}
                      onClick={() => {
                        const input = document.getElementById(`income-source-${source.id}`);
                        if (input) input.click();
                      }}
                      disabled={isUploading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>Add Documents</span>
                    </button>

                    {(source.documents || []).length > 0 && (
                      <div className="step-documents-list">
                        {source.documents.map((doc) => (
                          <DocumentPreview
                            key={doc.id}
                            document={doc}
                            onDelete={() => onDeleteIncomeSourceDocument(doc.id, source.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* General Additional Income Documents */}
          <div className="step-category-section">
            <div className="step-category-card">
              <div className="step-category-header">
                <div className="step-category-header-content">
                  <div className="step-category-icon" style={{ backgroundColor: '#6c757d' }}>
                    <span className="step-category-icon-text">📎</span>
                  </div>
                  <div className="step-category-info">
                    <h3 className="step-category-title">General Additional Income Documents</h3>
                    <p className="step-category-description">Documents not tied to a specific income source</p>
                  </div>
                </div>
              </div>
              <div className="step-category-content">
                <input
                  ref={generalDocsInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleGeneralDocsFileSelect}
                />
                <button
                  className="step-action-button"
                  style={{ borderColor: '#6c757d', color: '#6c757d' }}
                  onClick={() => generalDocsInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>Select File</span>
                </button>

                {(formData.additionalIncomeGeneralDocuments || []).length > 0 && (
                  <div className="step-documents-list">
                    <p className="step-documents-title">
                      Uploaded Documents ({formData.additionalIncomeGeneralDocuments.length})
                    </p>
                    {formData.additionalIncomeGeneralDocuments.map((doc) => (
                      <DocumentPreview
                        key={doc.id}
                        document={doc}
                        onDelete={() => handleDeleteDocument(doc.id, 'additionalIncomeGeneralDocuments')}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Step2AdditionalIncome;

