import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDocuments.css';
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

const AdminDocuments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [taxForms, setTaxForms] = useState([]);

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

      // Fetch tax forms to check if application is submitted
      const formsResponse = await ApiService.getTaxFormHistory(token);
      if (formsResponse.success) {
        setTaxForms(formsResponse.data || []);
      }

      // Fetch admin documents
      const adminDocsResponse = await ApiService.getAdminDocuments(token);
      if (adminDocsResponse.success) {
        setAdminDocuments(adminDocsResponse.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin documents:', err);
      setError('Failed to load admin documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasSubmittedApplication = () => {
    if (taxForms.length === 0) return false;
    
    const currentYear = new Date().getFullYear();
    const currentYearForm = taxForms.find(form => form.taxYear === currentYear);
    
    if (!currentYearForm) return false;
    
    const submittedStatuses = ['submitted', 'under_review', 'processing', 'approved', 'completed'];
    return submittedStatuses.includes(currentYearForm.status);
  };

  const getDraftDocument = () => {
    return adminDocuments.find(doc => doc.type === 'draft_return') || null;
  };

  const getFinalDocument = () => {
    return adminDocuments.find(doc => doc.type === 'final_return') || null;
  };

  const getAdminNotes = () => {
    return adminDocuments.find(doc => doc.type === 'admin_notes') || null;
  };

  const handleViewDraft = () => {
    const draftDoc = getDraftDocument();
    if (!draftDoc) {
      alert('Draft document not available');
      return;
    }

    // Use decryption URL - prefer publicUrl if it's a decryption URL, otherwise construct it
    let url = draftDoc.publicUrl;
    
    // If publicUrl doesn't exist or doesn't look like a decryption URL, construct it from gcsPath
    if (!url || (!url.includes('/upload/view/') && draftDoc.gcsPath)) {
      url = getDecryptionUrl(draftDoc.gcsPath);
    }
    
    if (!url) {
      alert('Document URL not available');
      return;
    }

    console.log('🔓 Opening decrypted draft document URL:', url);
    window.open(url, '_blank');
  };

  const handleDownloadFinal = async () => {
    const finalDoc = getFinalDocument();
    if (!finalDoc) {
      alert('Final document not available yet. Please wait for the admin to upload it.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // Get the application ID from tax forms
      const currentYear = new Date().getFullYear();
      const currentYearForm = taxForms.find(form => form.taxYear === currentYear);
      const applicationId = currentYearForm?.id;

      if (!applicationId) {
        alert('Could not find application ID');
        return;
      }

      // Get decryption URL from backend (this endpoint returns the decryption URL)
      const urlResponse = await ApiService.getFinalDocumentUrl(applicationId, token);
      if (urlResponse.success && urlResponse.url) {
        console.log('🔓 Opening decrypted final document URL:', urlResponse.url);
        window.open(urlResponse.url, '_blank');
      } else {
        // Fallback: construct decryption URL from gcsPath
        if (finalDoc.gcsPath) {
          const decryptionUrl = getDecryptionUrl(finalDoc.gcsPath);
          console.log('🔓 Using fallback decryption URL:', decryptionUrl);
          window.open(decryptionUrl, '_blank');
        } else if (finalDoc.publicUrl) {
          // Last resort: use publicUrl if available
          console.log('🔓 Using publicUrl:', finalDoc.publicUrl);
          window.open(finalDoc.publicUrl, '_blank');
        } else {
          alert('Could not get download URL. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error downloading final document:', err);
      // Fallback: construct decryption URL from gcsPath
      if (finalDoc.gcsPath) {
        const decryptionUrl = getDecryptionUrl(finalDoc.gcsPath);
        console.log('🔓 Using fallback decryption URL after error:', decryptionUrl);
        window.open(decryptionUrl, '_blank');
      } else if (finalDoc.publicUrl) {
        // Last resort: use publicUrl if available
        console.log('🔓 Using publicUrl after error:', finalDoc.publicUrl);
        window.open(finalDoc.publicUrl, '_blank');
      } else {
        alert(`Failed to download final document: ${err.message}`);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="admin-documents-page" style={{ backgroundColor: Colors.background.secondary }}>
        <div className="admin-documents-container">
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Loading admin documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-documents-page" style={{ backgroundColor: Colors.background.secondary }}>
        <div className="admin-documents-container">
          <div className="admin-error">
            <p>{error}</p>
            <button onClick={fetchData} className="retry-button">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const draftDoc = getDraftDocument();
  const finalDoc = getFinalDocument();
  const adminNotes = getAdminNotes();
  const submitted = hasSubmittedApplication();

  return (
    <div className="admin-documents-page" style={{ backgroundColor: Colors.background.secondary }}>
      <div className="admin-documents-container">
        {/* Header */}
        <div className="admin-header">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h1 className="admin-title">Admin Documents</h1>
          <button className="refresh-button" onClick={fetchData} title="Refresh">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>

        <div className="admin-content">
          {!submitted ? (
            <div className="admin-message-card">
              <div className="message-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2>Application Not Submitted</h2>
              <p>Please submit your tax application first to view admin documents.</p>
              <button className="primary-button" onClick={() => navigate('/tax-wizard')}>
                Go to Tax Wizard
              </button>
            </div>
          ) : (
            <>
              {/* Draft Document Card */}
              {draftDoc ? (
                <div className="admin-document-card">
                  <div className="document-card-header">
                    <div className="document-icon draft-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div className="document-info">
                      <h2 className="document-title">Draft Tax Return</h2>
                      <p className="document-subtitle">Review your draft tax return document</p>
                    </div>
                  </div>
                  <div className="document-details">
                    <div className="detail-item">
                      <span className="detail-label">Document Name:</span>
                      <span className="detail-value">{draftDoc.name}</span>
                    </div>
                    {draftDoc.size && (
                      <div className="detail-item">
                        <span className="detail-label">File Size:</span>
                        <span className="detail-value">{formatFileSize(draftDoc.size)}</span>
                      </div>
                    )}
                    {draftDoc.createdAt && (
                      <div className="detail-item">
                        <span className="detail-label">Uploaded:</span>
                        <span className="detail-value">{formatDate(draftDoc.createdAt)}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    className="view-button"
                    onClick={handleViewDraft}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View Draft Document
                  </button>
                </div>
              ) : (
                <div className="admin-document-card empty-card">
                  <div className="document-icon disabled-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <h2 className="document-title">Draft Tax Return</h2>
                  <p className="empty-message">No draft document available yet. Please wait for the admin to upload it.</p>
                </div>
              )}

              {/* Final Document Card */}
              {finalDoc ? (
                <div className="admin-document-card">
                  <div className="document-card-header">
                    <div className="document-icon final-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="document-info">
                      <h2 className="document-title">Final Tax Return</h2>
                      <p className="document-subtitle">Download your completed tax return</p>
                    </div>
                  </div>
                  <div className="document-details">
                    <div className="detail-item">
                      <span className="detail-label">Document Name:</span>
                      <span className="detail-value">{finalDoc.name}</span>
                    </div>
                    {finalDoc.size && (
                      <div className="detail-item">
                        <span className="detail-label">File Size:</span>
                        <span className="detail-value">{formatFileSize(finalDoc.size)}</span>
                      </div>
                    )}
                    {finalDoc.createdAt && (
                      <div className="detail-item">
                        <span className="detail-label">Uploaded:</span>
                        <span className="detail-value">{formatDate(finalDoc.createdAt)}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    className="download-button"
                    onClick={handleDownloadFinal}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Final Document
                  </button>
                </div>
              ) : (
                <div className="admin-document-card empty-card">
                  <div className="document-icon disabled-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <h2 className="document-title">Final Tax Return</h2>
                  <p className="empty-message">No final document available yet. Please wait for the admin to upload it.</p>
                </div>
              )}

              {/* Admin Notes Card */}
              {adminNotes && (
                <div className="admin-document-card notes-card">
                  <div className="document-card-header">
                    <div className="document-icon notes-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div className="document-info">
                      <h2 className="document-title">Admin Notes</h2>
                      <p className="document-subtitle">Messages from your tax consultant</p>
                    </div>
                  </div>
                  <div className="notes-content">
                    <p className="notes-text">{adminNotes.content}</p>
                    {adminNotes.createdAt && (
                      <p className="notes-date">Posted: {formatDate(adminNotes.createdAt)}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDocuments;


