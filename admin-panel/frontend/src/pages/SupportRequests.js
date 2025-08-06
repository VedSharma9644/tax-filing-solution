import React, { useState } from 'react';
import './SupportRequests.css';

const SupportRequests = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState([
    {
      id: 1,
      name: 'seshi r vanukuri',
      email: 'seshi.vanukuri@gmail.com',
      mobile: '9083440001',
      message: 'Hey everyone! My friend owns Equitas Tax Service LLC, where you can file your taxes at the best prices. They make sure your personal information stays safe and secure. If you need a trustworthy and hassle-free tax service, this is a great choice!\n\nFeel free to share this with your friends and colleagues.\n\nReferral: Vamshi\nWebsite: equitastax.com\nContact: +91 70139 19912',
      status: 'Completed',
      notes: ''
    },
    {
      id: 2,
      name: 'Walter White',
      email: 'krishkikkyster@gmail.com',
      mobile: '5106260213',
      message: 'Is this real how much do you charge for filing taxes?',
      status: 'New Request',
      notes: ''
    },
    {
      id: 3,
      name: 'Karthik',
      email: 'karthik.greply@gmail.com',
      mobile: '9526529106',
      message: 'Will you be filing for 1040NR ?',
      status: 'Completed',
      notes: 'yes We Do, Pls Contact at 456-200-4611,4655'
    },
    {
      id: 4,
      name: 'jay',
      email: 'jhanu.py@gmail.com',
      mobile: '5164507612',
      message: 'call me',
      status: 'New Request',
      notes: ''
    },
    {
      id: 5,
      name: 'sHwetha Guthikonda',
      email: 'shwetha2730idp@gmail.com',
      mobile: '3464299720',
      message: 'Wrong taxes filed for 2022',
      status: 'Completed',
      notes: ''
    },
    {
      id: 6,
      name: 'Sudha Narayanan',
      email: '91.sudha@gmail.com',
      mobile: '4256287833',
      message: 'Would like to discuss NRI tax filing',
      status: 'New Request',
      notes: ''
    },
    {
      id: 7,
      name: 'Jay',
      email: 'jayasaikrishnareddy93@gmail.com',
      mobile: '5164507612',
      message: 'I would like to discuss about my tax returns',
      status: 'Completed',
      notes: 'testing'
    },
    {
      id: 8,
      name: 'Shipra',
      email: 'shipra15bhandari@gmail.com',
      mobile: '7202914252',
      message: 'Tax enquiry',
      status: 'Completed',
      notes: ''
    }
  ]);

  const [notesText, setNotesText] = useState({});

  const handleStatusChange = (requestId, newStatus) => {
    setRequests(requests.map(request => 
      request.id === requestId ? { ...request, status: newStatus } : request
    ));
  };

  const handleNotesChange = (requestId, text) => {
    setNotesText({
      ...notesText,
      [requestId]: text
    });
  };

  const handleEnterNotes = (requestId) => {
    setRequests(requests.map(request => 
      request.id === requestId 
        ? { ...request, notes: notesText[requestId] || request.notes }
        : request
    ));
    setNotesText({
      ...notesText,
      [requestId]: ''
    });
  };

  const filteredRequests = requests.filter(request =>
    request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.mobile.includes(searchTerm) ||
    request.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="dashboard-contact">
          <div className="dashboard-contact--header">
            <h1>Support Requests</h1>
            <p>View and manage user inquiries from the contact form.</p>
          </div>
          
          <input
            type="text"
            placeholder="Search by name, email, mobile or message..."
            className="support-requests-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <table className="scheduled-calls-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Message</th>
                <th>Status</th>
                <th>My Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.name}</td>
                  <td>{request.email}</td>
                  <td>{request.mobile}</td>
                  <td className="message-cell">
                    <div className="message-content">
                      {request.message.split('\n').map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < request.message.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <select 
                      className="request-status-select"
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                    >
                      <option value="Completed">Completed</option>
                      <option value="New Request">New Request</option>
                    </select>
                  </td>
                  <td>
                    <textarea 
                      className="request-textarea"
                      placeholder="Add notes..."
                      value={notesText[request.id] || request.notes}
                      onChange={(e) => handleNotesChange(request.id, e.target.value)}
                    />
                    <button 
                      className="enter-button"
                      onClick={() => handleEnterNotes(request.id)}
                      disabled={!notesText[request.id] || notesText[request.id].trim() === ''}
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

export default SupportRequests; 