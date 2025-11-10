import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminApiService from '../services/api';
import './ApplicationDetail.css';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [expectedReturn, setExpectedReturn] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [draftReturnFile, setDraftReturnFile] = useState(null);
  const [finalReturnFile, setFinalReturnFile] = useState(null);
  const [uploadingDraft, setUploadingDraft] = useState(false);
  const [uploadingFinal, setUploadingFinal] = useState(false);
  const [uploadedReturns, setUploadedReturns] = useState({});

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  useEffect(() => {
    if (application && application.id) {
      loadUploadedReturns();
    }
  }, [application]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await AdminApiService.getTaxFormDetails(id);
      if (response.success) {
        setApplication(response.data);
        setExpectedReturn(response.data.expectedReturn || '');
        setPaymentAmount(response.data.paymentAmount || '');
        setAdminNotes(response.data.adminNotes || '');
      } else {
        setError('Failed to fetch application details');
      }
    } catch (err) {
      console.error('Error fetching application details:', err);
      setError('Error loading application details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      setUpdating(true);
      const response = await AdminApiService.updateTaxFormStatus(
        id,
        status,
        parseFloat(expectedReturn) || 0,
        parseFloat(paymentAmount) || 0,
        adminNotes
      );
      
      if (response.success) {
        setApplication(prev => ({
          ...prev,
          status: response.data.status,
          expectedReturn: response.data.expectedReturn,
          paymentAmount: response.data.paymentAmount,
          adminNotes: response.data.adminNotes
        }));
        setShowStatusModal(false);
        setSelectedStatus(''); // Reset selected status
        // Update select value to new status
        const select = document.getElementById('status-select');
        if (select) {
          select.value = response.data.status || '';
        }
        alert(`Application status updated to ${formatStatusName(status)} successfully!`);
      } else {
        alert('Failed to update application status');
        // Reset select on error
        const select = document.getElementById('status-select');
        if (select && application) {
          select.value = application.status || '';
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating application status');
      // Reset select on error
      const select = document.getElementById('status-select');
      if (select && application) {
        select.value = application.status || '';
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusSelectChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus && newStatus !== application.status) {
      setSelectedStatus(newStatus);
      setShowStatusModal(true);
      // Reset select to current status immediately (will update after confirmation)
      setTimeout(() => {
        e.target.value = application.status || '';
      }, 0);
    }
  };

  const handleSaveAdminNotes = async () => {
    try {
      setSavingNotes(true);
      // Update notes using the status endpoint with current status (no status change)
      const response = await AdminApiService.updateTaxFormStatus(
        id,
        application.status, // Keep current status
        parseFloat(expectedReturn) || 0,
        parseFloat(paymentAmount) || 0,
        adminNotes
      );
      
      if (response.success) {
        setApplication(prev => ({
          ...prev,
          adminNotes: response.data.adminNotes,
          adminNotesUpdatedAt: response.data.adminNotesUpdatedAt
        }));
        alert('Admin notes saved successfully!');
      } else {
        alert('Failed to save admin notes');
      }
    } catch (err) {
      console.error('Error saving admin notes:', err);
      alert('Error saving admin notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteApplication = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this application?\n\nApplication ID: ${id}\nUser: ${application?.userName || 'Unknown'}\n\nThis action cannot be undone and will permanently remove the application from the database.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setUpdating(true);
      const response = await AdminApiService.deleteTaxForm(id);
      
      if (response.success) {
        alert('Application deleted successfully!');
        // Navigate back to applications list
        navigate('/admin/applications');
      } else {
        alert('Failed to delete application. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Error deleting application. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const openDocument = async (doc) => {
    try {
      console.log(`🔓 Opening document: ${doc.name}`);
      
      // Create a blob URL from the file response
      const response = await AdminApiService.getSecureFileUrl(doc.gcsPath);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      console.log(`🔗 Document blob URL created`);
      window.open(blobUrl, '_blank');
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000); // Clean up after 1 minute
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Error opening document. Please try again.');
    }
  };

  const downloadDocument = async (doc) => {
    try {
      console.log(`📥 Downloading document: ${doc.name}`);
      
      // Use the new download endpoint that handles decryption
      const response = await AdminApiService.downloadFile(doc.gcsPath);
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create a blob URL and download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name || 'document';
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      console.log(`✅ Document downloaded successfully: ${doc.name}`);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(`Error downloading document: ${error.message}`);
    }
  };

  const downloadAllDocuments = async () => {
    if (!application.documents || application.documents.length === 0) {
      alert('No documents to download');
      return;
    }

    try {
      console.log(`📦 Starting download of all ${application.documents.length} documents as ZIP...`);
      alert(`Starting download of all ${application.documents.length} documents as ZIP...`);
      
      // Use the new download all endpoint that creates a ZIP file
      const response = await AdminApiService.downloadAllFiles(application.id);
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create a blob URL and download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `application-${application.id}-documents.zip`;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      console.log(`✅ ZIP archive downloaded successfully`);
    } catch (error) {
      console.error('Error downloading all documents:', error);
      alert(`Error downloading all documents: ${error.message}`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    
    // Handle Firestore Timestamp objects
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    // Handle Firestore Timestamp serialized objects
    else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    }
    // Handle regular Date objects or date strings
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    }
    // Handle timestamp in milliseconds
    else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    }
    else {
      console.warn('Unknown timestamp format:', timestamp);
      return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', timestamp);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatStatusName = (status) => {
    if (!status) return 'UNKNOWN';
    // Replace all underscores with spaces and capitalize each word
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatHistoryAction = (action) => {
    const actionMap = {
      'application_created': 'Application Created',
      'status_changed': 'Status Changed',
      'notes_updated': 'Admin Notes Updated',
      'document_uploaded': 'Document Uploaded',
      'expected_return_updated': 'Expected Return Updated',
      'payment_amount_updated': 'Payment Amount Updated'
    };
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getHistoryDescription = (historyEntry) => {
    const { action, details } = historyEntry;
    
    switch (action) {
      case 'application_created':
        return `Application submitted with ${details.documentCount || 0} document(s) for tax year ${details.taxYear || 'N/A'}`;
      case 'status_changed':
        return `Status changed from "${formatStatusName(details.oldStatus)}" to "${formatStatusName(details.newStatus)}"`;
      case 'notes_updated':
        return details.hasNotes ? `Admin notes updated (${details.notesLength} characters)` : 'Admin notes cleared';
      case 'document_uploaded':
        return `Document "${details.documentName}" uploaded in category "${details.documentCategory}" (${(details.documentSize / 1024).toFixed(2)} KB)`;
      case 'expected_return_updated':
        return `Expected return updated from $${details.oldValue.toFixed(2)} to $${details.newValue.toFixed(2)}`;
      case 'payment_amount_updated':
        return `Payment amount updated from $${details.oldValue.toFixed(2)} to $${details.newValue.toFixed(2)}`;
      default:
        return 'Action performed';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      // New states
      new_application_submitted: '#3498db', // Blue - new application
      processing: '#f39c12', // Orange - admin reviewing
      awaiting_for_documents: '#e67e22', // Dark orange - waiting for docs
      new_documents_submitted: '#3498db', // Blue - new docs uploaded
      draft_uploaded: '#9b59b6', // Purple - draft ready
      draft_rejected: '#e74c3c', // Red - draft rejected
      payment_completed: '#27ae60', // Green - payment done
      close_application: '#2ecc71', // Green - application closed
      // Legacy states (for backward compatibility)
      submitted: '#3498db',
      under_review: '#f39c12',
      approved: '#27ae60',
      rejected: '#e74c3c',
      completed: '#2ecc71'
    };
    return colors[status] || '#95a5a6';
  };

  const loadUploadedReturns = async () => {
    try {
      const response = await AdminApiService.getReturns(application.id);
      if (response.success) {
        setUploadedReturns(response.data);
      }
    } catch (error) {
      console.error('Error loading uploaded returns:', error);
    }
  };

  const downloadReturn = async (returnType) => {
    try {
      const response = await AdminApiService.downloadReturn(application.id, returnType);
      if (response.success) {
        // Open the download URL in a new tab
        window.open(response.downloadUrl, '_blank');
      } else {
        throw new Error(response.error || 'Download failed');
      }
    } catch (error) {
      console.error(`Error downloading ${returnType} return:`, error);
      alert(`Error downloading ${returnType} return: ${error.message}`);
    }
  };

  const viewReturn = async (returnType) => {
    try {
      // Use the new decryption endpoint for viewing
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const viewUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/admin/returns/${application.id}/${returnType}/view?token=${token}&t=${timestamp}`;
      console.log(`🔓 Opening decrypted view URL: ${viewUrl}`);
      console.log(`📁 Current uploaded returns state:`, uploadedReturns);
      
      // Open the decrypted file in a new tab
      window.open(viewUrl, '_blank');
    } catch (error) {
      console.error(`Error viewing ${returnType} return:`, error);
      alert(`Error viewing ${returnType} return: ${error.message}`);
    }
  };

  const handleDraftReturnUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if application is loaded
    if (!application || !application.id) {
      alert('Application not loaded yet. Please wait and try again.');
      return;
    }

    // File validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    if (file.size > maxSize) {
      alert('File size too large. Maximum size is 10MB.');
      return;
    }

    setDraftReturnFile(file);
    setUploadingDraft(true);

    try {
      console.log('Uploading draft return:', file.name);
      console.log('Application ID:', application.id);
      
      const response = await AdminApiService.uploadReturn(application.id, 'draft', file);
      
      if (response.success) {
        alert('Draft return uploaded successfully!');
        // Refresh application data to show the uploaded file
        await fetchApplicationDetails();
        // Also refresh uploaded returns specifically
        await loadUploadedReturns();
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading draft return:', error);
      alert(`Error uploading draft return: ${error.message}`);
    } finally {
      setUploadingDraft(false);
      setDraftReturnFile(null);
    }
  };

  const handleFinalReturnUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if application is loaded
    if (!application || !application.id) {
      alert('Application not loaded yet. Please wait and try again.');
      return;
    }

    // File validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    if (file.size > maxSize) {
      alert('File size too large. Maximum size is 10MB.');
      return;
    }

    setFinalReturnFile(file);
    setUploadingFinal(true);

    try {
      console.log('Uploading final return:', file.name);
      console.log('Application ID:', application.id);
      
      const response = await AdminApiService.uploadReturn(application.id, 'final', file);
      
      if (response.success) {
        alert('Final return uploaded successfully!');
        // Refresh application data to show the uploaded file
        await fetchApplicationDetails();
        // Also refresh uploaded returns specifically
        await loadUploadedReturns();
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading final return:', error);
      alert(`Error uploading final return: ${error.message}`);
    } finally {
      setUploadingFinal(false);
      setFinalReturnFile(null);
    }
  };

  if (loading) {
    return (
      <div className="application-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="application-detail-error">
        <h2>Error</h2>
        <p>{error || 'Application not found'}</p>
        <button onClick={() => navigate('/admin/applications')}>
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="application-detail">
      {/* Header */}
      <div className="application-detail-header">
        <button 
          className="back-button"
          onClick={() => navigate('/admin/applications')}
        >
          ← Back to Applications
        </button>
        <div className="header-info">
          <h1>Application Details</h1>
          <div 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(application.status) }}
          >
            {formatStatusName(application.status)}
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="info-card">
        <h3>User Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Name:</label>
            <span>{application.user?.firstName && application.user?.lastName 
              ? `${application.user.firstName} ${application.user.lastName}`
              : application.userName || 'N/A'
            }</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{application.user?.email || application.userEmail || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{application.user?.phone || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>User ID:</label>
            <span>{application.userId || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Application Details */}
      <div className="info-card">
        <h3>Application Details</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Application ID:</label>
            <span>{application.id}</span>
          </div>
          <div className="info-item">
            <label>Tax Year:</label>
            <span>{application.taxYear || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Form Type:</label>
            <span>{application.formType || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Filing Status:</label>
            <span>{application.filingStatus || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>SSN:</label>
            <span>{application.socialSecurityNumber || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Submitted:</label>
            <span>{formatDate(application.submittedAt)}</span>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="info-card">
        <div className="documents-header">
          <h3>Documents ({application.documents?.length || 0} files)</h3>
          {application.documents && application.documents.length > 0 && (
            <button 
              className="download-all-button"
              onClick={downloadAllDocuments}
            >
              📥 Download All
            </button>
          )}
        </div>
        {application.documents && application.documents.length > 0 ? (
          <div className="documents-grid">
            {application.documents.map((doc, index) => (
              <div key={index} className="document-item">
                <div className="document-preview" onClick={() => openDocument(doc)}>
                  <div className="document-icon">
                    {doc.type?.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  <div className="document-info">
                    <div className="document-name">{doc.name}</div>
                    <div className="document-category">{doc.category}</div>
                    <div className="document-date">
                      {formatDate(doc.uploadedAt)}
                    </div>
                  </div>
                </div>
                <div className="document-actions">
                  <button 
                    className="action-button open-button"
                    onClick={() => openDocument(doc)}
                  >
                    Open
                  </button>
                  <button 
                    className="action-button download-button"
                    onClick={() => downloadDocument(doc)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No documents uploaded</p>
        )}
      </div>

      {/* Dependents */}
      <div className="info-card">
        <h3>Dependents ({application.dependents?.length || 0})</h3>
        {application.dependents && application.dependents.length > 0 ? (
          <div className="dependents-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Relationship</th>
                </tr>
              </thead>
              <tbody>
                {application.dependents.map((dep, index) => (
                  <tr key={index}>
                    <td>{dep.name || 'N/A'}</td>
                    <td>{dep.age || 'N/A'}</td>
                    <td>{dep.relationship || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No dependents listed</p>
        )}
      </div>

      {/* Additional Income Sources */}
      <div className="info-card">
        <h3>Additional Income Sources ({application.additionalIncomeSources?.length || 0})</h3>
        {application.additionalIncomeSources && application.additionalIncomeSources.length > 0 ? (
          <div className="additional-income-table">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Documents</th>
                </tr>
              </thead>
              <tbody>
                {application.additionalIncomeSources.map((income, index) => (
                  <tr key={income.id || index}>
                    <td>{income.source || 'N/A'}</td>
                    <td>${income.amount || '0.00'}</td>
                    <td>{income.description || 'No description'}</td>
                    <td>
                      {income.documents && income.documents.length > 0 ? (
                        <div className="document-count">
                          <span className="document-badge">
                            {income.documents.length} file{income.documents.length !== 1 ? 's' : ''}
                          </span>
                          <div className="document-list">
                            {income.documents.map((doc, docIndex) => (
                              <div key={doc.id || docIndex} className="document-item-small">
                                <span className="document-icon">📄</span>
                                <span className="document-name">{doc.name}</span>
                                <span className={`document-status ${doc.status}`}>
                                  {doc.status === 'uploading' ? 'Uploading...' :
                                   doc.status === 'completed' ? 'Uploaded' :
                                   doc.status === 'error' ? 'Failed' : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="no-documents">No documents</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No additional income sources listed</p>
        )}
      </div>

      {/* Admin Actions */}
      <div className="info-card admin-actions">
        <h3>Admin Actions</h3>
        <div className="admin-form">
          <div className="form-group">
            <label htmlFor="expectedReturn">Expected Return ($):</label>
            <input
              type="number"
              id="expectedReturn"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="paymentAmount">Payment Amount ($):</label>
            <input
              type="number"
              id="paymentAmount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="adminNotes">Admin Notes (Visible to all admins):</label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add personal notes about this application that other admins can see..."
              rows="5"
              disabled={savingNotes}
            />
            <button
              type="button"
              className="action-button save-notes-button"
              onClick={handleSaveAdminNotes}
              disabled={savingNotes || !application}
            >
              {savingNotes ? '💾 Saving...' : '💾 Save Notes'}
            </button>
            {application?.adminNotesUpdatedAt && (
              <div className="notes-timestamp">
                Last updated: {formatDate(application.adminNotesUpdatedAt)}
              </div>
            )}
          </div>
          
          {/* File Upload Fields */}
          <div className="form-group">
            <label htmlFor="draftReturn">Draft Return Upload:</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="draftReturn"
                accept=".pdf,.doc,.docx"
                onChange={handleDraftReturnUpload}
                disabled={uploadingDraft}
                style={{ display: 'none' }}
              />
              <label htmlFor="draftReturn" className="file-upload-button">
                {uploadingDraft ? (
                  <span>📤 Uploading...</span>
                ) : (
                  <span>📄 {draftReturnFile ? draftReturnFile.name : 'Choose Draft Return File'}</span>
                )}
              </label>
              {draftReturnFile && (
                <button
                  type="button"
                  className="file-remove-button"
                  onClick={() => setDraftReturnFile(null)}
                  disabled={uploadingDraft}
                >
                  ✕
                </button>
              )}
            </div>
            {uploadedReturns.draftReturn && (
              <div className="uploaded-file-info">
                <div className="file-info">
                  <span className="file-name">📄 {uploadedReturns.draftReturn.originalName}</span>
                  <span className="file-size">({(uploadedReturns.draftReturn.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <span className="file-date">{formatDate(uploadedReturns.draftReturn.uploadedAt)}</span>
                </div>
                <div className="file-actions">
                  <button
                    className="view-button"
                    onClick={() => viewReturn('draft')}
                    title="View file in new tab"
                  >
                    👁️ View
                  </button>
                  <button
                    className="download-button"
                    onClick={() => downloadReturn('draft')}
                    title="Download file"
                  >
                    📥 Download
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="finalReturn">Final Return Upload:</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="finalReturn"
                accept=".pdf,.doc,.docx"
                onChange={handleFinalReturnUpload}
                disabled={uploadingFinal}
                style={{ display: 'none' }}
              />
              <label htmlFor="finalReturn" className="file-upload-button">
                {uploadingFinal ? (
                  <span>📤 Uploading...</span>
                ) : (
                  <span>📄 {finalReturnFile ? finalReturnFile.name : 'Choose Final Return File'}</span>
                )}
              </label>
              {finalReturnFile && (
                <button
                  type="button"
                  className="file-remove-button"
                  onClick={() => setFinalReturnFile(null)}
                  disabled={uploadingFinal}
                >
                  ✕
                </button>
              )}
            </div>
            {uploadedReturns.finalReturn && (
              <div className="uploaded-file-info">
                <div className="file-info">
                  <span className="file-name">📄 {uploadedReturns.finalReturn.originalName}</span>
                  <span className="file-size">({(uploadedReturns.finalReturn.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <span className="file-date">{formatDate(uploadedReturns.finalReturn.uploadedAt)}</span>
                </div>
                <div className="file-actions">
                  <button
                    className="view-button"
                    onClick={() => viewReturn('final')}
                    title="View file in new tab"
                  >
                    👁️ View
                  </button>
                  <button
                    className="download-button"
                    onClick={() => downloadReturn('final')}
                    title="Download file"
                  >
                    📥 Download
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="action-buttons">
            <div className="status-update-container">
              <label htmlFor="status-select" className="status-label">Update Status:</label>
              <select
                id="status-select"
                className="status-select"
                value={application.status || ''}
                onChange={handleStatusSelectChange}
                disabled={updating}
                style={{ 
                  backgroundColor: getStatusColor(application.status),
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  minWidth: '200px'
                }}
              >
                <option value={application.status || ''} disabled>
                  {formatStatusName(application.status) || 'Current Status'}
                </option>
                <option value="processing">Processing</option>
                <option value="awaiting_for_documents">Awaiting for Documents</option>
                <option value="draft_uploaded">Draft Uploaded</option>
                <option value="close_application">Close Application</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
            <button 
              className="action-button delete-button"
              onClick={handleDeleteApplication}
              disabled={updating}
            >
              {updating ? 'Deleting...' : 'Delete Application'}
            </button>
          </div>
        </div>
      </div>

      {/* Application History */}
      <div className="info-card">
        <h3>Application History</h3>
        <p className="history-description">
          Complete audit trail of all changes and activities for this application.
        </p>
        {application.history && application.history.length > 0 ? (
          <div className="history-timeline">
            {application.history.map((entry, index) => (
              <div key={entry.id || index} className="history-entry">
                <div className="history-icon">
                  {entry.performedByType === 'admin' ? '👤' : entry.performedByType === 'user' ? '👤' : '🤖'}
                </div>
                <div className="history-content">
                  <div className="history-header">
                    <span className="history-action">{formatHistoryAction(entry.action)}</span>
                    <span className="history-time">{formatDate(entry.timestamp || entry.createdAt)}</span>
                  </div>
                  <div className="history-description-text">
                    {getHistoryDescription(entry)}
                  </div>
                  <div className="history-performed-by">
                    {entry.performedByType === 'admin' && '👨‍💼 Admin: '}
                    {entry.performedByType === 'user' && '👤 User: '}
                    {entry.performedByType === 'system' && '🤖 System: '}
                    {entry.performedBy || 'Unknown'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-history">
            <p>No history available for this application yet.</p>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Status Update</h3>
            <p>Are you sure you want to set status to "{formatStatusName(selectedStatus)}" for this application?</p>
            <div className="modal-actions">
              <button 
                className="action-button confirm-button"
                onClick={() => handleStatusUpdate(selectedStatus)}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Confirm'}
              </button>
              <button 
                className="action-button cancel-button"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus('');
                  // Force re-render of select to reset value
                  const select = document.getElementById('status-select');
                  if (select && application) {
                    select.value = application.status || '';
                  }
                }}
                disabled={updating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;
