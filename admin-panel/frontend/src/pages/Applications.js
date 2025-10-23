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
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [taxYearFilter, setTaxYearFilter] = useState('all');
  
  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

  const handleDeleteApplication = async (applicationId, applicationName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the application "${applicationName}"?\n\nThis action cannot be undone and will permanently remove the application from the database.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const response = await AdminApiService.deleteTaxForm(applicationId);
      
      if (response.success) {
        alert('Application deleted successfully!');
        // Refresh the applications list
        await fetchApplications();
      } else {
        alert('Failed to delete application. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Error deleting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter options
  const getUniqueStatuses = () => {
    const statuses = [...new Set(applications.map(app => app.status).filter(Boolean))];
    return statuses;
  };

  const getUniqueTaxYears = () => {
    const years = [...new Set(applications.map(app => app.taxYear).filter(Boolean))];
    return years.sort((a, b) => b - a); // Sort descending (newest first)
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setTaxYearFilter('all');
  };

  const filteredApplications = applications.filter(app => {
    const searchLower = searchTerm.toLowerCase();
    const mobileNumber = app.user?.phone || app.user?.mobile || app.user?.phoneNumber || app.phone || app.mobile || app.phoneNumber || '';
    
    // Search filter
    const matchesSearch = (
      app.id.toLowerCase().includes(searchLower) ||
      (app.userName && app.userName.toLowerCase().includes(searchLower)) ||
      (app.userEmail && app.userEmail.toLowerCase().includes(searchLower)) ||
      (app.socialSecurityNumber && app.socialSecurityNumber.includes(searchTerm)) ||
      (mobileNumber && mobileNumber.includes(searchTerm))
    );
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all' && app.submittedAt) {
      const submittedDate = new Date(app.submittedAt._seconds ? app.submittedAt._seconds * 1000 : app.submittedAt);
      const now = new Date();
      const daysDiff = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case 'quarter':
          matchesDate = daysDiff <= 90;
          break;
        default:
          matchesDate = true;
      }
    }
    
    // Tax year filter
    const matchesTaxYear = taxYearFilter === 'all' || app.taxYear?.toString() === taxYearFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesTaxYear;
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    const newItemsPerPageNum = parseInt(newItemsPerPage);
    if (newItemsPerPageNum > 0 && newItemsPerPageNum <= 100) {
      setItemsPerPage(newItemsPerPageNum);
      setCurrentPage(1); // Reset to first page when changing items per page
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
            {/* Filters */}
            <div className="filters-container">
              <div className="filter-group">
                <label htmlFor="status-filter">Status:</label>
                <select 
                  id="status-filter"
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="date-filter">Submitted:</label>
                <select 
                  id="date-filter"
                  className="filter-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="tax-year-filter">Tax Year:</label>
                <select 
                  id="tax-year-filter"
                  className="filter-select"
                  value={taxYearFilter}
                  onChange={(e) => setTaxYearFilter(e.target.value)}
                >
                  <option value="all">All Years</option>
                  {getUniqueTaxYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button 
                className="clear-filters-button"
                onClick={clearAllFilters}
                disabled={searchTerm === '' && statusFilter === 'all' && dateFilter === 'all' && taxYearFilter === 'all'}
              >
                Clear Filters
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by email, application ID, name, SSN, or mobile number"
              className="applications-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {paginatedApplications.length > 0 ? (
            <>
              <div className="applications-table-container">
                <table className="applications-table">
                  <thead>
                    <tr>
                      <th>Sl.No</th>
                      <th>Application ID</th>
                      <th>User Name</th>
                      <th>User Email</th>
                      <th>Mobile Number</th>
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
                        <td>{app.user?.phone || app.user?.mobile || app.user?.phoneNumber || app.phone || app.mobile || app.phoneNumber || 'N/A'}</td>
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
                          <div className="action-buttons">
                            <button 
                              className="applications-action-button view-button"
                              onClick={() => handleViewApplication(app.id)}
                            >
                              View Details
                            </button>
                            <button 
                              className="applications-action-button delete-button"
                              onClick={() => handleDeleteApplication(app.id, app.userName || app.id)}
                              disabled={loading}
                            >
                              {loading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination-controls">
                <div className="pagination-left">
                  <button 
                    className="pagination-button" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="pagination-button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
                
                <div className="pagination-right">
                  <label htmlFor="items-per-page" className="items-per-page-label">
                    Show:
                  </label>
                  <input
                    id="items-per-page"
                    type="number"
                    min="5"
                    max="100"
                    step="5"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="items-per-page-input"
                  />
                  <span className="items-per-page-text">per page</span>
                </div>
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