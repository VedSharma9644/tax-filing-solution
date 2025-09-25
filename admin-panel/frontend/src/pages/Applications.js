import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminApiService from '../services/api';
import './Applications.css';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, [currentPage]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await AdminApiService.getTaxForms();
      
      if (response.success) {
        setApplications(response.data || []);
        setTotalPages(Math.ceil((response.data || []).length / 10)); // 10 items per page
      } else {
        setError('Failed to fetch applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStatus = (applicationId) => {
    console.log('View status for application:', applicationId);
    // TODO: Implement status view modal or page
  };

  const handleViewApplication = (applicationId) => {
    navigate(`/admin/applications/${applicationId}`);
  };

  const filteredApplications = applications.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    return (
      app.id.toLowerCase().includes(searchLower) ||
      (app.userName && app.userName.toLowerCase().includes(searchLower)) ||
      (app.userEmail && app.userEmail.toLowerCase().includes(searchLower)) ||
      (app.socialSecurityNumber && app.socialSecurityNumber.includes(searchTerm))
    );
  });

  // Pagination
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
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
      <div className="homepage">
        <main className="dashboard-content">
          <div className="applications-container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading applications...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage">
        <main className="dashboard-content">
          <div className="applications-container">
            <div className="error-state">
              <h2>Error</h2>
              <p>{error}</p>
              <button onClick={fetchApplications} className="retry-button">
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="applications-container">
          <h1 className="applications-title">Applications</h1>
          <p className="applications-description">
            Review and manage submitted applications. ({filteredApplications.length} total)
          </p>
          
          <div className="applications-actions">
            <input
              type="text"
              placeholder="Search by email, application ID, name, or SSN"
              className="applications-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {paginatedApplications.length > 0 ? (
            <>
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Sl.No</th>
                    <th>Application ID</th>
                    <th>User Name</th>
                    <th>User Email</th>
                    <th>Tax Year</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApplications.map((app, index) => (
                    <tr key={app.id}>
                      <td>{startIndex + index + 1}</td>
                      <td className="application-id">{app.id}</td>
                      <td>{app.userName || 'N/A'}</td>
                      <td>{app.userEmail || 'N/A'}</td>
                      <td>{app.taxYear || 'N/A'}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(app.status) }}
                        >
                          {app.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td>{formatDate(app.submittedAt)}</td>
                      <td>
                        <button 
                          className="applications-action-button"
                          onClick={() => handleViewApplication(app.id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="pagination-controls">
                <button 
                  className="pagination-button" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {Math.ceil(filteredApplications.length / itemsPerPage)}
                </span>
                <button 
                  className="pagination-button"
                  disabled={currentPage >= Math.ceil(filteredApplications.length / itemsPerPage)}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="no-data-state">
              <h3>No Applications Found</h3>
              <p>
                {searchTerm 
                  ? 'No applications match your search criteria.' 
                  : 'No applications have been submitted yet.'
                }
              </p>
              {searchTerm && (
                <button 
                  className="clear-search-button"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Applications; 