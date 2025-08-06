import React, { useState } from 'react';
import './ScheduledCalls.css';

const ScheduledCalls = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [calls, setCalls] = useState([
    {
      id: 1,
      applicationId: '67db023fd98edd7b63e60750',
      firstName: 'VIVEK SAI',
      lastName: 'POTU',
      mobileNumber: '9403151794',
      scheduledDate: 'Mar 20, 2025',
      scheduledTime: '13:00',
      taxYear: '2024',
      status: 'New Call Scheduled',
      notes: ''
    },
    {
      id: 2,
      applicationId: '67aa414275aa68d5b091d2d6',
      firstName: 'seshi',
      lastName: 'vanukuri',
      mobileNumber: '9083440001',
      scheduledDate: 'Feb 11, 2025',
      scheduledTime: '10:00',
      taxYear: '2024',
      status: 'New Call Scheduled',
      notes: ''
    },
    {
      id: 3,
      applicationId: '6796b632f4efbbabc1d1f9d7',
      firstName: 'Aman',
      lastName: 'Jain',
      mobileNumber: '7203885760',
      scheduledDate: 'Jan 31, 2025',
      scheduledTime: '13:00',
      taxYear: '2024',
      status: 'New Call Scheduled',
      notes: 'Asked About planning and issue resolved'
    },
    {
      id: 4,
      applicationId: '67825930fe953205e25d10cb',
      firstName: 'Not Available',
      lastName: 'Not Available',
      mobileNumber: '6304295513',
      scheduledDate: 'Jan 22, 2025',
      scheduledTime: '09:00',
      taxYear: '2024',
      status: 'New Call Scheduled',
      notes: ''
    }
  ]);

  const handleStatusChange = (callId, newStatus) => {
    setCalls(calls.map(call => 
      call.id === callId ? { ...call, status: newStatus } : call
    ));
  };

  const handleNotesChange = (callId, newNotes) => {
    setCalls(calls.map(call => 
      call.id === callId ? { ...call, notes: newNotes } : call
    ));
  };

  const handleEnterNotes = (callId) => {
    console.log('Saving notes for call:', callId);
    // Here you would typically save to backend
  };

  const filteredCalls = calls.filter(call =>
    call.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.mobileNumber.includes(searchTerm)
  );

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="scheduled-calls-container">
          <h1 className="scheduled-calls-title">Scheduled Calls</h1>
          <p className="scheduled-calls-description">View and manage your scheduled call records.</p>
          
          <input
            type="text"
            placeholder="Search by First Name, Last Name or Mobile Number..."
            className="schedulecalls-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <table className="scheduled-calls-table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Application ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Mobile Number</th>
                <th>Scheduled Date</th>
                <th>Scheduled Time</th>
                <th>Tax Year</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((call, index) => (
                <tr key={call.id}>
                  <td>{index + 1}</td>
                  <td>{call.applicationId}</td>
                  <td>{call.firstName}</td>
                  <td>{call.lastName}</td>
                  <td>{call.mobileNumber}</td>
                  <td>{call.scheduledDate}</td>
                  <td>{call.scheduledTime}</td>
                  <td>{call.taxYear}</td>
                  <td>
                    <select 
                      className="schedule-call-update-select"
                      value={call.status}
                      onChange={(e) => handleStatusChange(call.id, e.target.value)}
                    >
                      <option value="New Call Scheduled">New Call Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                      <option value="Pending">Pending</option>
                      <option value="Rescheduled">Rescheduled</option>
                    </select>
                  </td>
                  <td>
                    <textarea 
                      className="notes-textarea"
                      value={call.notes}
                      onChange={(e) => handleNotesChange(call.id, e.target.value)}
                      placeholder="Enter notes..."
                    />
                    <button 
                      className="enter-notes-button"
                      onClick={() => handleEnterNotes(call.id)}
                    >
                      Enter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination-controls">
            <button disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of 1</span>
            <button disabled>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScheduledCalls; 