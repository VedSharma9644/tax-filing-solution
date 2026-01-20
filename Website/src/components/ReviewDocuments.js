import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReviewDocuments.css';
import Colors from '../utils/colors';
import ApiService, { API_BASE_URL } from '../config/api';
import DocumentPreview from './TaxWizard/components/DocumentPreview';

const ReviewDocuments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [taxFormId, setTaxFormId] = useState(null);
  const [personalInfo, setPersonalInfo] = useState({
    socialSecurityNumber: '',
    dependents: [],
    additionalIncomeSources: []
  });

  // Edit states
  const [editingSSN, setEditingSSN] = useState(false);
  const [ssnValue, setSsnValue] = useState('');
  const [editingDependent, setEditingDependent] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [showAddDependent, setShowAddDependent] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [saving, setSaving] = useState(false);

  // Upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('previousYearTax');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch tax forms to get the current year tax form ID
      const formsResponse = await ApiService.getTaxFormHistory(token);
      if (formsResponse.success && formsResponse.data && formsResponse.data.length > 0) {
        const currentYear = new Date().getFullYear();
        const currentYearForm = formsResponse.data.find(form => form.taxYear === currentYear) || formsResponse.data[0];
        setTaxFormId(currentYearForm.id);

        // Fetch personal info
        const personalInfoResponse = await ApiService.getTaxFormPersonalInfo(currentYearForm.id, token);
        if (personalInfoResponse.success) {
          setPersonalInfo({
            socialSecurityNumber: personalInfoResponse.data.socialSecurityNumber || '',
            dependents: personalInfoResponse.data.dependents || [],
            additionalIncomeSources: personalInfoResponse.data.additionalIncomeSources || []
          });
        }
      }

      // Fetch documents
      const docsResponse = await ApiService.getUserDocuments(token);
      if (docsResponse.success) {
        setDocuments(docsResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSSN = (ssn) => {
    if (!ssn) return '';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return cleaned;
  };

  const handleSaveSSN = async () => {
    if (!taxFormId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Validate SSN format
    const cleaned = ssnValue.replace(/\D/g, '');
    if (cleaned.length !== 9) {
      alert('Please enter a valid 9-digit Social Security Number');
      return;
    }

    try {
      setSaving(true);
      const response = await ApiService.updateTaxFormPersonalInfo(
        taxFormId,
        { socialSecurityNumber: cleaned },
        token
      );

      if (response.success) {
        setPersonalInfo(prev => ({
          ...prev,
          socialSecurityNumber: response.data.socialSecurityNumber
        }));
        setEditingSSN(false);
        alert('Social Security Number updated successfully');
      }
    } catch (err) {
      console.error('Error updating SSN:', err);
      alert('Failed to update Social Security Number. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDependent = async (dependent) => {
    if (!taxFormId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (!dependent.name || !dependent.relationship) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const updatedDependents = editingDependent
        ? personalInfo.dependents.map(dep => dep.id === dependent.id ? dependent : dep)
        : [...personalInfo.dependents, { ...dependent, id: Math.random().toString(36).substr(2, 9) }];

      const response = await ApiService.updateTaxFormPersonalInfo(
        taxFormId,
        { dependents: updatedDependents },
        token
      );

      if (response.success) {
        setPersonalInfo(prev => ({
          ...prev,
          dependents: response.data.dependents
        }));
        setEditingDependent(null);
        setShowAddDependent(false);
        alert('Dependent saved successfully');
      }
    } catch (err) {
      console.error('Error saving dependent:', err);
      alert('Failed to save dependent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependent = async (dependentId) => {
    if (!taxFormId) return;
    if (!window.confirm('Are you sure you want to delete this dependent?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setSaving(true);
      const updatedDependents = personalInfo.dependents.filter(dep => dep.id !== dependentId);

      const response = await ApiService.updateTaxFormPersonalInfo(
        taxFormId,
        { dependents: updatedDependents },
        token
      );

      if (response.success) {
        setPersonalInfo(prev => ({
          ...prev,
          dependents: response.data.dependents
        }));
        alert('Dependent deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting dependent:', err);
      alert('Failed to delete dependent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIncome = async (income) => {
    if (!taxFormId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (!income.source || !income.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const updatedIncome = editingIncome
        ? personalInfo.additionalIncomeSources.map(inc => inc.id === income.id ? income : inc)
        : [...personalInfo.additionalIncomeSources, { ...income, id: Math.random().toString(36).substr(2, 9) }];

      const response = await ApiService.updateTaxFormPersonalInfo(
        taxFormId,
        { additionalIncomeSources: updatedIncome },
        token
      );

      if (response.success) {
        setPersonalInfo(prev => ({
          ...prev,
          additionalIncomeSources: response.data.additionalIncomeSources
        }));
        setEditingIncome(null);
        setShowAddIncome(false);
        alert('Additional income source saved successfully');
      }
    } catch (err) {
      console.error('Error saving income:', err);
      alert('Failed to save additional income source. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIncome = async (incomeId) => {
    if (!taxFormId) return;
    if (!window.confirm('Are you sure you want to delete this income source?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setSaving(true);
      const updatedIncome = personalInfo.additionalIncomeSources.filter(inc => inc.id !== incomeId);

      const response = await ApiService.updateTaxFormPersonalInfo(
        taxFormId,
        { additionalIncomeSources: updatedIncome },
        token
      );

      if (response.success) {
        setPersonalInfo(prev => ({
          ...prev,
          additionalIncomeSources: response.data.additionalIncomeSources
        }));
        alert('Income source deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting income:', err);
      alert('Failed to delete income source. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // Use gcsPath as documentId (backend expects GCS path)
      const documentId = document.gcsPath || document.id;
      if (!documentId) {
        alert('Document path not found. Cannot delete.');
        return;
      }

      console.log('🗑️ Deleting document:', documentId);
      const response = await ApiService.deleteDocument(documentId, token);
      if (response.success) {
        // Remove from documents list using both id and gcsPath for matching
        setDocuments(prev => prev.filter(doc => 
          doc.id !== document.id && doc.gcsPath !== document.gcsPath
        ));
        alert('Document deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      const errorMessage = err.message || 'Failed to delete document. Please try again.';
      alert(errorMessage);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!taxFormId) {
      alert('Tax form not found. Please try refreshing the page.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setIsUploading(true);

    try {
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?.id;

      if (!userId) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('userId', userId);
      formData.append('category', uploadCategory);
      formData.append('taxFormId', taxFormId);

      console.log('📤 Uploading document:', {
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        category: uploadCategory,
        userId: userId,
        taxFormId: taxFormId
      });

      const response = await fetch(`${API_BASE_URL}/upload/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => '');
          errorMessage = errorText.substring(0, 200) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);

      // Close modal and reset form
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadCategory('previousYearTax');

      // Refresh documents list
      await fetchData();

      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'w2Forms': '💼',
      'previousYearTaxDocuments': '📄',
      'previousYearTax': '📄',
      'medicalDocuments': '🏥',
      'medical': '🏥',
      'educationDocuments': '🎓',
      'education': '🎓',
      'dependentChildrenDocuments': '👶',
      'dependentChildren': '👶',
      'homeownerDeductionDocuments': '🏠',
      'homeownerDeduction': '🏠',
      'personalIdDocuments': '🆔',
      'personalId': '🆔',
      'additionalIncomeGeneral': '💰',
      'additional_income': '💰'
    };
    return icons[category] || '📎';
  };

  const getCategoryName = (category) => {
    const names = {
      'w2Forms': 'W-2 Forms',
      'previousYearTaxDocuments': 'Previous Year Tax Documents',
      'previousYearTax': 'Previous Year Tax Documents',
      'medicalDocuments': 'Medical Documents',
      'medical': 'Medical Documents',
      'educationDocuments': 'Education Documents',
      'education': 'Education Documents',
      'dependentChildrenDocuments': 'Tax Credits (Dependent Children)',
      'dependentChildren': 'Tax Credits (Dependent Children)',
      'homeownerDeductionDocuments': 'Homeowner Deductions',
      'homeownerDeduction': 'Homeowner Deductions',
      'personalIdDocuments': 'Personal Documents (ID)',
      'personalId': 'Personal Documents (ID)',
      'additionalIncomeGeneral': 'Additional Income Documents',
      'additional_income': 'Additional Income Documents'
    };
    return names[category] || 'Other Documents';
  };

  const groupDocumentsByCategory = () => {
    const grouped = {};
    documents.forEach(doc => {
      let normalizedCategory = doc.category;
      
      // Normalize category names
      if (normalizedCategory === 'additionalIncomeGeneral') {
        normalizedCategory = 'additional_income';
      } else if (normalizedCategory === 'previousYearTaxDocuments') {
        normalizedCategory = 'previousYearTax';
      } else if (normalizedCategory === 'medicalDocuments') {
        normalizedCategory = 'medical';
      } else if (normalizedCategory === 'educationDocuments') {
        normalizedCategory = 'education';
      } else if (normalizedCategory === 'dependentChildrenDocuments') {
        normalizedCategory = 'dependentChildren';
      } else if (normalizedCategory === 'homeownerDeductionDocuments') {
        normalizedCategory = 'homeownerDeduction';
      } else if (normalizedCategory === 'personalIdDocuments') {
        normalizedCategory = 'personalId';
      }
      
      if (!grouped[normalizedCategory]) {
        grouped[normalizedCategory] = [];
      }
      grouped[normalizedCategory].push(doc);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="review-documents-page" style={{ backgroundColor: Colors.background.secondary }}>
        <div className="review-documents-container">
          <div className="review-loading">
            <div className="spinner"></div>
            <p>Loading your documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-documents-page" style={{ backgroundColor: Colors.background.secondary }}>
        <div className="review-documents-container">
          <div className="review-error">
            <p>{error}</p>
            <button onClick={fetchData} className="retry-button">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const groupedDocuments = groupDocumentsByCategory();
  const totalDocuments = documents.length;

  return (
    <div className="review-documents-page" style={{ backgroundColor: Colors.background.secondary }}>
      <div className="review-documents-container">
        {/* Header */}
        <div className="review-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h1 className="review-title">Review Documents</h1>
          <button className="refresh-button" onClick={fetchData} title="Refresh">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>

        <div className="review-content">
          {/* Summary and Upload Button */}
          <div className="review-summary-with-upload">
            <div className="review-summary">
              <p>{totalDocuments} document{totalDocuments !== 1 ? 's' : ''} found</p>
            </div>
            <button 
              className="upload-document-button"
              onClick={() => setShowUploadModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Upload Document
            </button>
          </div>

          {/* Personal Information Section */}
          <div className="review-section-card">
            <div className="section-header">
              <div className="section-icon" style={{ backgroundColor: '#007bff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="section-info">
                <h2 className="section-title">Personal Information</h2>
                <p className="section-description">Social Security Number</p>
              </div>
            </div>
            <div className="section-content">
              {editingSSN ? (
                <div className="edit-ssn-form">
                  <input
                    type="text"
                    value={ssnValue}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      if (cleaned.length <= 9) {
                        setSsnValue(formatSSN(cleaned));
                      }
                    }}
                    placeholder="XXX-XX-XXXX"
                    maxLength="11"
                    className="ssn-input"
                  />
                  <div className="edit-actions">
                    <button onClick={handleSaveSSN} disabled={saving} className="save-button">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => {
                      setEditingSSN(false);
                      setSsnValue('');
                    }} className="cancel-button">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ssn-display">
                  <span className="ssn-value">
                    {personalInfo.socialSecurityNumber || 'Not provided'}
                  </span>
                  <button onClick={() => {
                    setEditingSSN(true);
                    setSsnValue(personalInfo.socialSecurityNumber.replace(/\D/g, ''));
                  }} className="edit-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dependents Section */}
          <div className="review-section-card">
            <div className="section-header">
              <div className="section-icon" style={{ backgroundColor: '#fd7e14' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="section-info">
                <h2 className="section-title">Dependents</h2>
                <p className="section-description">
                  {personalInfo.dependents.length} dependent{personalInfo.dependents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setShowAddDependent(true)} className="add-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add
              </button>
            </div>
            <div className="section-content">
              {personalInfo.dependents.length === 0 ? (
                <p className="empty-state">No dependents added yet</p>
              ) : (
                <div className="dependents-list">
                  {personalInfo.dependents.map((dependent, index) => (
                    <div key={dependent.id || index} className="dependent-item">
                      {editingDependent?.id === dependent.id ? (
                        <DependentEditForm
                          dependent={dependent}
                          onSave={(dep) => handleSaveDependent(dep)}
                          onCancel={() => setEditingDependent(null)}
                          saving={saving}
                        />
                      ) : (
                        <>
                          <div className="dependent-info">
                            <div className="dependent-name">{dependent.name}</div>
                            <div className="dependent-details">
                              {dependent.relationship} {dependent.age ? `• Age: ${dependent.age}` : ''} {dependent.dob ? `• DOB: ${dependent.dob}` : ''}
                            </div>
                          </div>
                          <div className="dependent-actions">
                            <button onClick={() => setEditingDependent(dependent)} className="edit-button-small">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteDependent(dependent.id)} className="delete-button-small">
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {showAddDependent && (
                <DependentEditForm
                  dependent={{ name: '', relationship: '', age: '', dob: '' }}
                  onSave={(dep) => {
                    handleSaveDependent(dep);
                    setShowAddDependent(false);
                  }}
                  onCancel={() => setShowAddDependent(false)}
                  saving={saving}
                />
              )}
            </div>
          </div>

          {/* Additional Income Sources Section */}
          <div className="review-section-card">
            <div className="section-header">
              <div className="section-icon" style={{ backgroundColor: '#28a745' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="section-info">
                <h2 className="section-title">Additional Income Sources</h2>
                <p className="section-description">
                  {personalInfo.additionalIncomeSources.length} source{personalInfo.additionalIncomeSources.length !== 1 ? 's' : ''} • 
                  Total: ${personalInfo.additionalIncomeSources.reduce((sum, inc) => sum + (parseFloat(inc.amount) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <button onClick={() => setShowAddIncome(true)} className="add-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add
              </button>
            </div>
            <div className="section-content">
              {personalInfo.additionalIncomeSources.length === 0 ? (
                <p className="empty-state">No additional income sources added yet</p>
              ) : (
                <div className="income-list">
                  {personalInfo.additionalIncomeSources.map((income, index) => (
                    <div key={income.id || index} className="income-item">
                      {editingIncome?.id === income.id ? (
                        <IncomeEditForm
                          income={income}
                          onSave={(inc) => handleSaveIncome(inc)}
                          onCancel={() => setEditingIncome(null)}
                          saving={saving}
                        />
                      ) : (
                        <>
                          <div className="income-info">
                            <div className="income-header">
                              <span className="income-number">#{index + 1}</span>
                              <span className="income-amount">${(parseFloat(income.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="income-name">{income.source}</div>
                            {income.description && (
                              <div className="income-description">{income.description}</div>
                            )}
                          </div>
                          <div className="income-actions">
                            <button onClick={() => setEditingIncome(income)} className="edit-button-small">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteIncome(income.id)} className="delete-button-small">
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {showAddIncome && (
                <IncomeEditForm
                  income={{ source: '', amount: '', description: '' }}
                  onSave={(inc) => {
                    handleSaveIncome(inc);
                    setShowAddIncome(false);
                  }}
                  onCancel={() => setShowAddIncome(false)}
                  saving={saving}
                />
              )}
            </div>
          </div>

          {/* Documents by Category */}
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <div key={category} className="review-section-card">
              <div className="section-header">
                <div className="section-icon" style={{ backgroundColor: '#007bff' }}>
                  <span className="category-emoji">{getCategoryIcon(category)}</span>
                </div>
                <div className="section-info">
                  <h2 className="section-title">{getCategoryName(category)}</h2>
                  <p className="section-description">
                    {docs.length} document{docs.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="section-content">
                {docs.length === 0 ? (
                  <p className="empty-state">No documents uploaded for this category</p>
                ) : (
                  <div className="documents-list">
                    {docs.map((doc) => (
                      <DocumentPreview
                        key={doc.id || doc.gcsPath}
                        document={{
                          id: doc.id,
                          name: doc.name,
                          type: doc.type,
                          size: doc.size,
                          status: 'completed',
                          isImage: doc.type?.startsWith('image/') || !!(doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)),
                          uri: doc.publicUrl,
                          previewUrl: doc.publicUrl,
                          publicUrl: doc.publicUrl,
                          progress: 100,
                          category: doc.category || 'general',
                          timestamp: new Date(doc.uploadedAt || Date.now()),
                          gcsPath: doc.gcsPath
                        }}
                        onDelete={() => handleDeleteDocument(doc)}
                        onReplace={() => {
                          if (doc.publicUrl) {
                            window.open(doc.publicUrl, '_blank');
                          }
                        }}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Upload Document</h2>
              <button 
                className="close-button"
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="upload-modal-content">
              <div className="upload-form-group">
                <label htmlFor="upload-category">Document Category</label>
                <select
                  id="upload-category"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  disabled={isUploading}
                  className="upload-select"
                >
                  <option value="previousYearTax">Previous Year Tax Documents</option>
                  <option value="w2Forms">W-2 Forms</option>
                  <option value="medical">Medical Documents</option>
                  <option value="education">Education Documents</option>
                  <option value="dependentChildren">Tax Credits (Dependent Children)</option>
                  <option value="homeownerDeduction">Homeowner Deductions</option>
                  <option value="personalId">Personal Documents (ID)</option>
                  <option value="additional_income">Additional Income Documents</option>
                </select>
              </div>
              <div className="upload-form-group">
                <label htmlFor="upload-file">Select File</label>
                <input
                  id="upload-file"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="upload-file-input"
                  accept="image/*,.pdf,.doc,.docx"
                />
                {uploadFile && (
                  <div className="upload-file-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>{uploadFile.name}</span>
                    <span className="file-size">({(uploadFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
              </div>
              <div className="upload-modal-actions">
                <button
                  className="cancel-upload-button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  className="submit-upload-button"
                  onClick={handleUploadDocument}
                  disabled={isUploading || !uploadFile}
                >
                  {isUploading ? (
                    <>
                      <div className="upload-spinner"></div>
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dependent Edit Form Component
const DependentEditForm = ({ dependent, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState({
    name: dependent.name || '',
    relationship: dependent.relationship || '',
    age: dependent.age || '',
    dob: dependent.dob || ''
  });

  return (
    <div className="edit-form">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="form-input"
      />
      <input
        type="text"
        placeholder="Relationship"
        value={formData.relationship}
        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
        className="form-input"
      />
      <div className="form-row">
        <input
          type="text"
          placeholder="Age"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          className="form-input"
        />
        <input
          type="text"
          placeholder="Date of Birth"
          value={formData.dob}
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          className="form-input"
        />
      </div>
      <div className="edit-actions">
        <button onClick={() => onSave({ ...dependent, ...formData })} disabled={saving} className="save-button">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="cancel-button">Cancel</button>
      </div>
    </div>
  );
};

// Income Edit Form Component
const IncomeEditForm = ({ income, onSave, onCancel, saving }) => {
  const [formData, setFormData] = useState({
    source: income.source || '',
    amount: income.amount || '',
    description: income.description || ''
  });

  return (
    <div className="edit-form">
      <input
        type="text"
        placeholder="Income Source"
        value={formData.source}
        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        className="form-input"
      />
      <input
        type="number"
        placeholder="Amount"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        className="form-input"
      />
      <textarea
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="form-textarea"
        rows="3"
      />
      <div className="edit-actions">
        <button onClick={() => onSave({ ...income, ...formData })} disabled={saving} className="save-button">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="cancel-button">Cancel</button>
      </div>
    </div>
  );
};

export default ReviewDocuments;

