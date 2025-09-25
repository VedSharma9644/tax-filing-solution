import React, { useState, useEffect } from 'react';
import './Feedbacks.css';
import AdminApiService from '../services/api';
import { useModal } from '../contexts/ModalContext';

const Feedbacks = () => {
  const { showAlert, showConfirm } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState(null);

  // Load feedback data
  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      };

      const response = await AdminApiService.getFeedback(params);
      
      if (response.success) {
        setFeedbacks(response.data);
        setPagination(response.pagination || {});
      } else {
        setError('Failed to load feedbacks');
      }
    } catch (err) {
      console.error('Error loading feedbacks:', err);
      setError('Failed to load feedbacks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load feedbacks on component mount and when filters change
  useEffect(() => {
    loadFeedbacks();
  }, [currentPage, statusFilter, searchTerm]);

  const handleReplyChange = (feedbackId, text) => {
    setReplyText({
      ...replyText,
      [feedbackId]: text
    });
  };

  const handleSendReply = async (feedbackId) => {
    try {
      setReplyingTo(feedbackId);
      const reply = replyText[feedbackId];
      
      if (!reply || reply.trim() === '') {
        showAlert({
          title: 'Validation Error',
          message: 'Please enter a reply',
          type: 'warning'
        });
        return;
      }

      const response = await AdminApiService.replyToFeedback(feedbackId, reply);
      
      if (response.success) {
        // Update local state
        setFeedbacks(feedbacks.map(feedback => 
          feedback.id === feedbackId 
            ? { 
                ...feedback, 
                adminReply: reply,
                status: 'replied',
                repliedBy: 'Admin',
                repliedAt: new Date().toISOString()
              }
            : feedback
        ));
        
        setReplyText({
          ...replyText,
          [feedbackId]: ''
        });
        
        showAlert({
          title: 'Success',
          message: 'Reply sent successfully!',
          type: 'success'
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to send reply. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to send reply. Please try again.',
        type: 'error'
      });
    } finally {
      setReplyingTo(null);
    }
  };

  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      const response = await AdminApiService.updateFeedbackStatus(feedbackId, newStatus);
      
      if (response.success) {
        setFeedbacks(feedbacks.map(feedback => 
          feedback.id === feedbackId 
            ? { ...feedback, status: newStatus }
            : feedback
        ));
        showAlert({
          title: 'Success',
          message: 'Status updated successfully!',
          type: 'success'
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to update status. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to update status. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    showConfirm({
      title: 'Delete Feedback',
      message: 'Are you sure you want to delete this feedback? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        await performDeleteFeedback(feedbackId);
      }
    });
  };

  const performDeleteFeedback = async (feedbackId) => {
    try {
      const response = await AdminApiService.deleteFeedback(feedbackId);
      
      if (response.success) {
        setFeedbacks(feedbacks.filter(feedback => feedback.id !== feedbackId));
        showAlert({
          title: 'Success',
          message: 'Feedback deleted successfully!',
          type: 'success'
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to delete feedback. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to delete feedback. Please try again.',
        type: 'error'
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'replied': return '#28a745';
      case 'resolved': return '#17a2b8';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="feedbacks-container">
          <h1 className="feedbacks-title">User Feedbacks</h1>
          
          {/* Filters */}
          <div className="feedbacks-filters">
            <input
              type="text"
              placeholder="Search by user name, email or feedback content..."
              className="feedbacks-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <p>Loading feedbacks...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={loadFeedbacks} className="retry-button">
                Retry
              </button>
            </div>
          )}
          
          {/* Feedbacks List */}
          {!loading && !error && feedbacks.length === 0 && (
            <p className="no-feedback-msg">No feedbacks found.</p>
          )}
          
          {!loading && !error && feedbacks.length > 0 && (
            <div className="feedbacks-list">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="feedback-card">
                  <div className="feedback-header">
                    <div className="feedback-user-info">
                      <h3 className="feedback-user-name">{feedback.userName || 'Unknown User'}</h3>
                      <p className="feedback-email">{feedback.userEmail || 'No email'}</p>
                      <span className="feedback-date">{formatDate(feedback.createdAt)}</span>
                      {feedback.rating && (
                        <div className="feedback-rating">
                          Rating: {feedback.rating}/5
                        </div>
                      )}
                    </div>
                    <div className="feedback-status">
                      <select
                        className="status-select"
                        value={feedback.status}
                        onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="replied">Replied</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        className="delete-feedback-button"
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        title="Delete feedback"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="feedback-content">
                    <h4 className="feedback-label">Feedback:</h4>
                    <p className="feedback-text">{feedback.feedback}</p>
                    {feedback.category && (
                      <span className="feedback-category">Category: {feedback.category}</span>
                    )}
                  </div>
                  
                  <div className="feedback-reply">
                    <h4 className="feedback-label">Admin Reply:</h4>
                    {feedback.adminReply ? (
                      <div className="reply-section">
                        <p className="reply-text">{feedback.adminReply}</p>
                        {feedback.repliedBy && (
                          <p className="reply-meta">
                            Replied by {feedback.repliedBy} on {formatDate(feedback.repliedAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="reply-input-section">
                        <textarea
                          className="reply-textarea"
                          placeholder="Type your reply here..."
                          value={replyText[feedback.id] || ''}
                          onChange={(e) => handleReplyChange(feedback.id, e.target.value)}
                        />
                        <button
                          className="send-reply-button"
                          onClick={() => handleSendReply(feedback.id)}
                          disabled={!replyText[feedback.id] || replyText[feedback.id].trim() === '' || replyingTo === feedback.id}
                        >
                          {replyingTo === feedback.id ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-button" 
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalCount} total)
              </span>
              <button 
                className="pagination-button"
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Feedbacks; 