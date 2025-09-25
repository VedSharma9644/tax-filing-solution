import React, { useState, useEffect } from 'react';
import './ScheduledCalls.css';
import AdminApiService from '../services/api';
import { useModal } from '../contexts/ModalContext';

const ScheduledCalls = () => {
  const { showAlert, showConfirm, showInput } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [error, setError] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({});
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Load appointments data
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const response = await AdminApiService.getAppointments(params);
      
      if (response.success) {
        const appointments = response.data || [];
        setCalls(appointments);
        setPagination(response.pagination || {});
        
        // Initialize admin notes from database
        const notesFromDB = {};
        appointments.forEach(appointment => {
          if (appointment.adminNotes) {
            notesFromDB[appointment.id] = appointment.adminNotes;
          }
        });
        setAdminNotes(notesFromDB);
      } else {
        setError('Failed to load appointments');
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load appointments on component mount and when filters change
  useEffect(() => {
    loadAppointments();
  }, [currentPage, statusFilter, searchTerm, dateFrom, dateTo]);

  const handleStatusChange = async (callId, newStatus) => {
    // If rescheduling, show modal instead of direct update
    if (newStatus === 'rescheduled') {
      setReschedulingAppointment(callId);
      setShowRescheduleModal(true);
      return;
    }

    // If cancelling, show cancellation reason modal
    if (newStatus === 'cancelled') {
      setCancellingAppointment(callId);
      setCancellationReason('');
      setShowCancelModal(true);
      return;
    }

    try {
      setUpdatingStatus(callId);
      const notes = adminNotes[callId] || '';
      
      const response = await AdminApiService.updateAppointmentStatus(callId, newStatus, notes);
      
      if (response.success) {
        // Update local state
        setCalls(calls.map(call => 
          call.id === callId ? { ...call, status: newStatus, adminNotes: notes } : call
        ));
        
        // Clear admin notes for this call
        setAdminNotes({
          ...adminNotes,
          [callId]: ''
        });
        
        showAlert({
          title: 'Success',
          message: 'Appointment status updated successfully!',
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
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleNotesChange = (callId, newNotes) => {
    setAdminNotes({
      ...adminNotes,
      [callId]: newNotes
    });
  };

  const handleSaveNotes = async (callId) => {
    try {
      const notes = adminNotes[callId] || '';
      
      const response = await AdminApiService.updateAppointmentNotes(callId, notes);
      
      if (response.success) {
        // Update local state
        setCalls(calls.map(call => 
          call.id === callId ? { ...call, adminNotes: notes } : call
        ));
        
        // Update admin notes state to reflect saved value
        setAdminNotes({
          ...adminNotes,
          [callId]: notes
        });
        
        showAlert({
          title: 'Success',
          message: 'Admin notes saved successfully!',
          type: 'success'
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to save notes. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to save notes. Please try again.',
        type: 'error'
      });
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancellingAppointment) return;

    if (!cancellationReason.trim()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please provide a reason for cancellation.',
        type: 'warning'
      });
      return;
    }

    try {
      setUpdatingStatus(cancellingAppointment);
      
      const response = await AdminApiService.updateAppointmentStatus(
        cancellingAppointment, 
        'cancelled', 
        `Cancellation Reason: ${cancellationReason.trim()}`
      );
      
      if (response.success) {
        // Update local state
        setCalls(calls.map(call => 
          call.id === cancellingAppointment 
            ? { 
                ...call, 
                status: 'cancelled',
                adminNotes: `Cancellation Reason: ${cancellationReason.trim()}`
              } : call
        ));
        
        // Close modal
        setShowCancelModal(false);
        setCancellingAppointment(null);
        setCancellationReason('');
        
        showAlert({
          title: 'Success',
          message: 'Appointment cancelled successfully!',
          type: 'success'
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to cancel appointment. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to cancel appointment. Please try again.',
        type: 'error'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteAppointment = async (callId) => {
    showConfirm({
      title: 'Delete Appointment',
      message: 'Are you sure you want to delete this appointment? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        await performDeleteAppointment(callId);
      }
    });
  };

  const performDeleteAppointment = async (callId) => {

    try {
      const response = await AdminApiService.deleteAppointment(callId);
      
      if (response.success) {
        setCalls(calls.filter(call => call.id !== callId));
        showAlert({
          title: 'Success',
          message: 'Appointment deleted successfully!',
          type: 'success'
        });
      } else {
        showAlert({
          title: 'Error',
          message: 'Failed to delete appointment. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to delete appointment. Please try again.',
        type: 'error'
      });
    }
  };

  const handleReschedule = async () => {
    if (!reschedulingAppointment) return;

    const { newDate, newTime } = rescheduleData[reschedulingAppointment] || {};
    const notes = adminNotes[reschedulingAppointment] || '';

    if (!newDate || !newTime) {
      showAlert({
        title: 'Validation Error',
        message: 'Please select both new date and time for rescheduling.',
        type: 'warning'
      });
      return;
    }

    try {
      setUpdatingStatus(reschedulingAppointment);
      
      const response = await AdminApiService.rescheduleAppointment(
        reschedulingAppointment, 
        newDate, 
        newTime, 
        notes
      );
      
      if (response.success) {
        // Update local state
        setCalls(calls.map(call => 
          call.id === reschedulingAppointment 
            ? { 
                ...call, 
                date: newDate,
                time: newTime,
                status: 'rescheduled',
                adminNotes: notes,
                originalDate: call.date,
                originalTime: call.time
              } : call
        ));
        
        // Clear admin notes and reschedule data for this call
        setAdminNotes({
          ...adminNotes,
          [reschedulingAppointment]: ''
        });
        setRescheduleData({
          ...rescheduleData,
          [reschedulingAppointment]: {}
        });
        
        // Close modal
        setShowRescheduleModal(false);
        setReschedulingAppointment(null);
        
        showAlert({
          title: 'Success',
          message: 'Appointment rescheduled successfully!',
          type: 'success'
        });
      } else {
        showAlert({
          title: 'Error',
          message: response.error || 'Failed to reschedule appointment. Please try again.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      showAlert({
        title: 'Error',
        message: 'Failed to reschedule appointment. Please try again.',
        type: 'error'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRescheduleDataChange = (appointmentId, field, value) => {
    setRescheduleData({
      ...rescheduleData,
      [appointmentId]: {
        ...rescheduleData[appointmentId],
        [field]: value
      }
    });
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const time12 = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 12 ? 12 : time12;
      slots.push(`${displayHour}:00 ${ampm}`);
      if (hour < 17) {
        slots.push(`${displayHour}:30 ${ampm}`);
      }
    }
    return slots;
  };

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Unknown time';
    return timeString;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#ffc107';
      case 'confirmed': return '#28a745';
      case 'completed': return '#17a2b8';
      case 'cancelled': return '#dc3545';
      case 'rescheduled': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getAppointmentTypeDisplay = (type) => {
    const types = {
      'consultation': 'Tax Consultation',
      'review': 'Document Review',
      'filing': 'Tax Filing Help',
      'planning': 'Tax Planning'
    };
    return types[type] || type;
  };

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="scheduled-calls-container">
          <h1 className="scheduled-calls-title">Scheduled Appointments</h1>
          <p className="scheduled-calls-description">View and manage scheduled appointments with tax professionals.</p>
          
          {/* Filters */}
          <div className="appointments-filters">
            <input
              type="text"
              placeholder="Search by user name, email, or appointment type..."
              className="schedulecalls-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
            
            <input
              type="date"
              className="date-filter"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            
            <input
              type="date"
              className="date-filter"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <p>Loading appointments...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={loadAppointments} className="retry-button">
                Retry
              </button>
            </div>
          )}
          
          {/* Appointments Table */}
          {!loading && !error && calls.length === 0 && (
            <p className="no-appointments-msg">No appointments found.</p>
          )}
          
          {!loading && !error && calls.length > 0 && (
            <table className="scheduled-calls-table">
              <thead>
                <tr>
                  <th>Sl.No</th>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Appointment Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>User Notes</th>
                  <th>Admin Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, index) => (
                  <tr key={call.id}>
                    <td>{index + 1}</td>
                    <td>{call.userName || 'Unknown User'}</td>
                    <td>{call.userEmail || 'No email'}</td>
                    <td>{getAppointmentTypeDisplay(call.appointmentType)}</td>
                    <td>{formatDate(call.date)}</td>
                    <td>{formatTime(call.time)}</td>
                    <td>{call.duration || '30 min'}</td>
                    <td>
                      <select 
                        className="schedule-call-update-select"
                        value={call.status}
                        onChange={(e) => handleStatusChange(call.id, e.target.value)}
                        disabled={updatingStatus === call.id}
                        style={{ backgroundColor: getStatusColor(call.status), color: 'white' }}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </td>
                    <td>
                      <div className="user-notes">
                        {call.notes ? (
                          <span className="notes-text" title={call.notes}>
                            {call.notes.length > 50 ? `${call.notes.substring(0, 50)}...` : call.notes}
                          </span>
                        ) : (
                          <span className="no-notes">No notes</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-notes-container">
                        <textarea 
                          className="admin-notes-textarea"
                          value={adminNotes[call.id] || call.adminNotes || ''}
                          onChange={(e) => handleNotesChange(call.id, e.target.value)}
                          placeholder="Add admin notes..."
                          rows="2"
                        />
                        <button
                          className="save-notes-button"
                          onClick={() => handleSaveNotes(call.id)}
                          title="Save admin notes"
                        >
                          💾
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="delete-appointment-button"
                        onClick={() => handleDeleteAppointment(call.id)}
                        title="Delete appointment"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button 
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
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}

          {/* Reschedule Modal */}
          {showRescheduleModal && reschedulingAppointment && (
            <div className="modal-overlay">
              <div className="reschedule-modal">
                <div className="modal-header">
                  <h3>Reschedule Appointment</h3>
                  <button 
                    className="close-button"
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setReschedulingAppointment(null);
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-content">
                  <div className="reschedule-form">
                    <div className="form-group">
                      <label>New Date:</label>
                      <select
                        value={rescheduleData[reschedulingAppointment]?.newDate || ''}
                        onChange={(e) => handleRescheduleDataChange(reschedulingAppointment, 'newDate', e.target.value)}
                        className="reschedule-select"
                      >
                        <option value="">Select Date</option>
                        {generateAvailableDates().map(date => (
                          <option key={date} value={date}>
                            {new Date(date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>New Time:</label>
                      <select
                        value={rescheduleData[reschedulingAppointment]?.newTime || ''}
                        onChange={(e) => handleRescheduleDataChange(reschedulingAppointment, 'newTime', e.target.value)}
                        className="reschedule-select"
                      >
                        <option value="">Select Time</option>
                        {generateTimeSlots().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Admin Notes (Optional):</label>
                      <textarea
                        value={adminNotes[reschedulingAppointment] || ''}
                        onChange={(e) => handleNotesChange(reschedulingAppointment, e.target.value)}
                        placeholder="Add notes about the rescheduling..."
                        className="reschedule-textarea"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setReschedulingAppointment(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="reschedule-button"
                    onClick={handleReschedule}
                    disabled={updatingStatus === reschedulingAppointment}
                  >
                    {updatingStatus === reschedulingAppointment ? 'Rescheduling...' : 'Reschedule'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Modal */}
          {showCancelModal && cancellingAppointment && (
            <div className="modal-overlay">
              <div className="cancel-modal">
                <div className="modal-header">
                  <h3>Cancel Appointment</h3>
                  <button 
                    className="close-button"
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancellingAppointment(null);
                      setCancellationReason('');
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-content">
                  <div className="cancel-form">
                    <p className="cancel-warning">
                      Are you sure you want to cancel this appointment? Please provide a reason for cancellation.
                    </p>
                    
                    <div className="form-group">
                      <label>Reason for Cancellation:</label>
                      <textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Please provide a reason for cancelling this appointment..."
                        className="cancel-reason-textarea"
                        rows="4"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancellingAppointment(null);
                      setCancellationReason('');
                    }}
                  >
                    Keep Appointment
                  </button>
                  <button
                    className="confirm-cancel-button"
                    onClick={handleCancelAppointment}
                    disabled={updatingStatus === cancellingAppointment || !cancellationReason.trim()}
                  >
                    {updatingStatus === cancellingAppointment ? 'Cancelling...' : 'Cancel Appointment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScheduledCalls; 