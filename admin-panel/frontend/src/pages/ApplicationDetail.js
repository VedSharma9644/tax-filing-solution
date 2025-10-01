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
  const [expectedReturn, setExpectedReturn] = useState('');
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
        adminNotes
      );
      
      if (response.success) {
        setApplication(prev => ({
          ...prev,
          status: response.data.status,
          expectedReturn: response.data.expectedReturn,
          adminNotes: response.data.adminNotes
        }));
        setShowStatusModal(false);
        alert(`Application ${status} successfully!`);
      } else {
        alert('Failed to update application status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating application status');
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
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    const colors = {
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
      const viewUrl = `http://localhost:5001/admin/returns/${application.id}/${returnType}/view?token=${token}&t=${timestamp}`;
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
            {application.status?.replace('_', ' ').toUpperCase()}
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

      {/* Admin Actions */}
      <div className="info-card admin-actions">
        <h3>Admin Actions</h3>
        <div className="admin-form">
          <div className="form-group">
            <label htmlFor="expectedReturn"></label>
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
            <label htmlFor="adminNotes">Admin Notes:</label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows="3"
            />
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
            <button 
              className="action-button approve-button"
              onClick={() => {
                setSelectedStatus('approved');
                setShowStatusModal(true);
              }}
              disabled={updating}
            >
              Approve
            </button>
            <button 
              className="action-button reject-button"
              onClick={() => {
                setSelectedStatus('rejected');
                setShowStatusModal(true);
              }}
              disabled={updating}
            >
              Reject
            </button>
            <button 
              className="action-button review-button"
              onClick={() => {
                setSelectedStatus('under_review');
                setShowStatusModal(true);
              }}
              disabled={updating}
            >
              Mark Under Review
            </button>
            <button 
              className="action-button processing-button"
              onClick={() => {
                setSelectedStatus('processing');
                setShowStatusModal(true);
              }}
              disabled={updating}
            >
              Processing
            </button>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Status Update</h3>
            <p>Are you sure you want to {selectedStatus.replace('_', ' ')} this application?</p>
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
                onClick={() => setShowStatusModal(false)}
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
