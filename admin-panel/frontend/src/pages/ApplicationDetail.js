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

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

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

  const openDocument = (doc) => {
    try {
      const secureUrl = AdminApiService.getSecureFileUrl(doc.gcsPath);
      window.open(secureUrl, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Error opening document. Please try again.');
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const secureUrl = AdminApiService.getSecureDownloadUrl(doc.gcsPath);
      
      // Use fetch to download the file
      const response = await fetch(secureUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
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
      alert(`Starting download of ${application.documents.length} documents...`);
      
      // Download each document with a small delay to avoid browser blocking
      for (let i = 0; i < application.documents.length; i++) {
        const doc = application.documents[i];
        try {
          await downloadDocument(doc);
          // Small delay between downloads
          if (i < application.documents.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error downloading ${doc.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in download all:', error);
      alert('Error starting downloads. Please try again.');
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
            <label htmlFor="expectedReturn">Expected Tax Return ($):</label>
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
