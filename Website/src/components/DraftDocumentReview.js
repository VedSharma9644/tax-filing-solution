import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DraftDocumentReview.css';
import Colors from '../utils/colors';
import ApiService from '../config/api';

// Helper function to get API base URL
const getApiBaseUrl = () => {
  return typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'
    ? 'https://tax-filing-backend-693306869303.us-central1.run.app'
    : 'http://localhost:5000';
};

// Helper function to construct decryption URL
const getDecryptionUrl = (gcsPath) => {
  if (!gcsPath) return null;
  const API_BASE_URL = getApiBaseUrl();
  return `${API_BASE_URL}/upload/view/${encodeURIComponent(gcsPath)}`;
};

const DraftDocumentReview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [taxForms, setTaxForms] = useState([]);
  const [userDocuments, setUserDocuments] = useState([]);
  const [notes, setNotes] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [sendingNotes, setSendingNotes] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch tax forms
      const formsResponse = await ApiService.getTaxFormHistory(token);
      if (formsResponse.success) {
        setTaxForms(formsResponse.data || []);
      }

      // Fetch admin documents
      const adminDocsResponse = await ApiService.getAdminDocuments(token);
      if (adminDocsResponse.success) {
        setAdminDocuments(adminDocsResponse.data || []);
      }

      // Fetch user documents
      const docsResponse = await ApiService.getUserDocuments(token);
      if (docsResponse.success) {
        setUserDocuments(docsResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get the most recent tax form that allows editing
  const getApprovedTaxForm = () => {
    const editableStatuses = ['approved', 'processing', 'submitted', 'under_review'];
    const editableForm = taxForms.find(form => editableStatuses.includes(form.status));
    return editableForm || taxForms[0];
  };

  // Get admin document (draft return)
  const getAdminDocument = () => {
    if (adminDocuments && adminDocuments.length > 0) {
      const adminDoc = adminDocuments.find(doc => 
        doc.type === 'draft_return' || doc.type === 'final_return'
      ) || adminDocuments[0];

      if (adminDoc) {
        const adminNotesDoc = adminDocuments.find(doc => doc.type === 'admin_notes');
        const adminNotes = adminNotesDoc ? adminNotesDoc.content : '';
        
        return {
          id: adminDoc.id,
          name: adminDoc.name || 'Tax Document.pdf',
          uploadedBy: 'Admin',
          uploadedAt: adminDoc.createdAt ? new Date(adminDoc.createdAt).toLocaleDateString() : 'Unknown',
          status: adminDoc.status || 'pending',
          size: adminDoc.size ? `${(adminDoc.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
          adminNotes: adminNotes,
          publicUrl: adminDoc.publicUrl,
          gcsPath: adminDoc.gcsPath,
          type: adminDoc.type,
          applicationId: adminDoc.applicationId
        };
      }
    }
    return null;
  };

  // Get all user documents
  const getAllDocuments = () => {
    const approvedForm = getApprovedTaxForm();
    if (!approvedForm || !approvedForm.documents) return [];

    return approvedForm.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      category: doc.category,
      gcsPath: doc.gcsPath,
      uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toLocaleDateString() : 'Unknown',
      size: doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
      type: 'Personal Document'
    }));
  };

  // Check if application is under review
  const isUnderReview = () => {
    const approvedForm = getApprovedTaxForm();
    return approvedForm && approvedForm.status === 'under_review';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return '#28a745';
      case 'pending':
      case 'in_progress':
        return '#ffc107';
      case 'submitted':
        return '#17a2b8';
      case 'rejected':
      case 'error':
        return '#dc3545';
      case 'draft':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '✅ Approved';
      case 'completed':
        return '✅ Completed';
      case 'pending':
        return '⏳ Pending Review';
      case 'in_progress':
        return '🔄 In Progress';
      case 'submitted':
        return '📤 Submitted';
      case 'rejected':
        return '❌ Rejected';
      case 'error':
        return '❌ Error';
      case 'draft':
        return '📝 Draft';
      default:
        return status || 'Unknown';
    }
  };

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const handleAcceptDocuments = () => {
    if (!acceptedTerms) {
      alert('Please accept the terms and conditions to proceed.');
      return;
    }

    setShowApprovalModal(false);
    setIsApproved(true);
    
    // Navigate to payment after a brief delay
    setTimeout(() => {
      navigate('/dashboard');
      alert('Document approved! You can proceed to payment.');
    }, 1500);
  };

  const handleRejectDocuments = () => {
    setShowApprovalModal(false);
    alert('Your documents have been rejected. Please review and make necessary changes before proceeding.');
  };

  const handleSendNotes = async () => {
    if (!notes.trim()) {
      alert('Please enter your notes before sending.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setSendingNotes(true);
    try {
      // TODO: Implement API call to send notes to admin
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Your notes have been sent to the admin. They will review and make necessary changes.');
      setNotes('');
    } catch (err) {
      console.error('Error sending notes:', err);
      alert('Failed to send notes. Please try again.');
    } finally {
      setSendingNotes(false);
    }
  };

  const openDocumentInBrowser = (document) => {
    if (!document) {
      alert('Document not available');
      return;
    }

    // Use decryption URL - prefer publicUrl if it's a decryption URL, otherwise construct it
    let url = document.publicUrl;
    
    // If publicUrl doesn't exist or doesn't look like a decryption URL, construct it from gcsPath
    if (!url || (!url.includes('/upload/view/') && document.gcsPath)) {
      url = getDecryptionUrl(document.gcsPath);
    }
    
    if (!url) {
      alert('Document URL not available');
      return;
    }

    console.log('🔓 Opening decrypted document URL:', url);
    window.open(url, '_blank');
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Unknown';
    }
  };

  const allDocuments = getAllDocuments();
  const adminDocument = getAdminDocument();

  if (loading) {
    return (
      <div className="draft-review-page" style={{ backgroundColor: Colors.background.secondary }}>
        <div className="draft-review-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading draft document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="draft-review-page" style={{ backgroundColor: Colors.background.secondary }}>
        <div className="draft-review-container">
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchData} className="retry-button">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!adminDocument) {
    return (
      <div className="draft-review-page" style={{ backgroundColor: Colors.background.secondary }}>
        <div className="draft-review-container">
          <div className="no-document-container">
            <p>⏳ No draft document found. Please wait for admin approval.</p>
            <button onClick={() => navigate('/dashboard')} className="back-button">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-review-page" style={{ backgroundColor: Colors.background.secondary }}>
      <div className="draft-review-container">
        {/* Header */}
        <div className="draft-review-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h1 className="draft-review-title">Draft Document Review</h1>
        </div>

        {/* Document Info Section */}
        <div className="section-title-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D7B04C" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <h2 className="section-title">Review Filed Tax Document</h2>
        </div>

        {/* Document Info Card */}
        <div className="document-card">
          <div className="document-info">
            <div className="info-row">
              <span className="info-label">📅 Date:</span>
              <span className="info-value">{adminDocument.uploadedAt}</span>
            </div>
            <div className="info-row">
              <span className="info-label">📊 Status:</span>
              <span className="info-value" style={{ color: getStatusColor(adminDocument.status) }}>
                {getStatusDisplayText(adminDocument.status)}
              </span>
            </div>
            {adminDocument.expectedReturn && adminDocument.expectedReturn > 0 && (
              <div className="info-row">
                <span className="info-label">💰 Expected Return:</span>
                <span className="info-value" style={{ color: '#28a745', fontWeight: '600' }}>
                  ${adminDocument.expectedReturn.toFixed(0)}
                </span>
              </div>
            )}
          </div>

          <button 
            className="view-button" 
            onClick={() => openDocumentInBrowser(adminDocument)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View Document
          </button>
        </div>

        {/* Admin Notes Section */}
        {adminDocument.adminNotes && (
          <>
            <div className="section-title-container">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D7B04C" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h2 className="section-title">Tax Consultant Notes</h2>
            </div>

            <div className="document-card notes-card">
              <div className="admin-note-item">
                <p className="admin-note-text">{adminDocument.adminNotes}</p>
                {adminDocument.applicationId && (
                  <p className="admin-note-meta">
                    🆔 Application: {adminDocument.applicationId}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Review Actions Section */}
        <div className="section-title-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D7B04C" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h2 className="section-title">Review Actions</h2>
        </div>

        <div className="document-card">
          <p className="section-text">
            Please review the document carefully. You can either approve it or send notes to the CA Team for any changes needed.
          </p>

          {/* Notes Section */}
          <div className="notes-section">
            <label className="notes-label">Notes to Admin (Optional):</label>
            <textarea
              placeholder="Enter any notes or changes you'd like the admin to make..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="notes-input"
              rows="4"
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className={`approve-button ${isUnderReview() ? 'disabled' : ''}`}
              onClick={isUnderReview() ? null : handleApprove}
              disabled={isUnderReview()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {isUnderReview() ? 'Under Review' : 'Approve & Continue'}
            </button>

            <button 
              className="notes-button" 
              onClick={handleSendNotes}
              disabled={!notes.trim() || sendingNotes}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              {sendingNotes ? 'Sending...' : 'Send Notes'}
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        {isApproved && (
          <div className="document-card approved-card">
            <div className="approved-content">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="approved-text">
                Document approved! Redirecting to dashboard...
              </p>
            </div>
          </div>
        )}

        {/* Document Approval Modal */}
        {showApprovalModal && (
          <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <h3 className="modal-title">Document Approval</h3>
                <p className="modal-subtitle">
                  Please review all documents and accept terms before proceeding
                </p>
              </div>

              <div className="modal-body">
                {/* All Documents List */}
                <div className="documents-section">
                  <h4 className="documents-section-title">All Documents ({allDocuments.length})</h4>
                  {allDocuments.map((doc) => (
                    <div key={doc.id} className="document-item-card">
                      <div className="document-item-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <div className="document-item-info">
                          <p className="document-item-title">{doc.name}</p>
                          <p className="document-item-type">{doc.type}</p>
                          <p className="document-item-meta">
                            {doc.size} • {doc.uploadedAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Terms & Conditions */}
                <div className="terms-section">
                  <h4 className="terms-title">Terms & Conditions</h4>
                  <div className="terms-content">
                    <p className="terms-text">
                      1. I confirm that all information provided is accurate and complete to the best of my knowledge.<br/><br/>
                      2. I understand that I am responsible for the accuracy of all documents and information submitted.<br/><br/>
                      3. I authorize the tax preparation service to file my tax return on my behalf.<br/><br/>
                      4. I agree to pay the service fee upon successful filing of my tax return.<br/><br/>
                      5. I understand that any errors or omissions may result in penalties or delays.<br/><br/>
                      6. I acknowledge that I have reviewed all documents and approve them for filing.<br/><br/>
                      7. I understand that I can request changes before final submission.
                    </p>
                  </div>
                  
                  <div className="terms-checkbox">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    <label htmlFor="acceptTerms" className="terms-checkbox-text">
                      I accept the terms and conditions
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button 
                  className="reject-button" 
                  onClick={handleRejectDocuments}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Reject
                </button>
                
                <button 
                  className="accept-button" 
                  onClick={handleAcceptDocuments}
                  disabled={!acceptedTerms}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Accept & Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftDocumentReview;

