import React, { useState } from 'react';
import './Applications.css';

const Applications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const applications = [
    {
      id: 1,
      applicationId: '678038b1fe953205e25d0f42',
      firstName: 'N/A',
      lastName: 'N/A',
      userEmail: 'N/A',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 2,
      applicationId: '67825930fe953205e25d10cb',
      firstName: 'ADITHYA',
      lastName: 'KOMAKULA',
      userEmail: 'ABC@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 3,
      applicationId: '678a7da02bb052ef566a2a6d',
      firstName: 'N/A',
      lastName: 'N/A',
      userEmail: 'N/A',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 4,
      applicationId: '678ad04c2bb052ef566a2af7',
      firstName: 'Rakesh',
      lastName: 'Kotha',
      userEmail: 'rakeshkotha27@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 5,
      applicationId: '678fbc462bb052ef566a3006',
      firstName: 'Diana',
      lastName: 'Samuel',
      userEmail: 'samdice32@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 6,
      applicationId: '6796b632f4efbbabc1d1f9d7',
      firstName: 'Aman',
      lastName: 'Jain',
      userEmail: 'amanjaincu@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 7,
      applicationId: '6797c5a2d4db71fa3f53fc56',
      firstName: 'Monishkumar Reddy',
      lastName: 'Chintha',
      userEmail: 'monishkumarreddy17@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 8,
      applicationId: '679cfe8025936ee194a6c06a',
      firstName: 'saikrishna reddy',
      lastName: 'Arukala',
      userEmail: 'aru.krishna05@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 9,
      applicationId: '67a0ec435e7fac8e9045f5da',
      firstName: 'Nischal',
      lastName: 'Gudehindler Lingeswara',
      userEmail: 'glnischal24@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    },
    {
      id: 10,
      applicationId: '67a0edb55e7fac8e9045f629',
      firstName: 'Sravya',
      lastName: 'Alla',
      userEmail: 'sravsal2103@gmail.com',
      taxYear: '2024',
      status: 'View Status'
    }
  ];

  const handleViewStatus = (applicationId) => {
    console.log('View status for application:', applicationId);
  };

  const handleViewApplication = (applicationId) => {
    console.log('View application:', applicationId);
  };

  const filteredApplications = applications.filter(app =>
    app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="applications-container">
          <h1 className="applications-title">Applications</h1>
          <p className="applications-description">Review and manage submitted applications.</p>
          
          <div className="applications-actions">
            <input
              type="text"
              placeholder="Search by email, application ID, first name, or last name"
              className="applications-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <table className="applications-table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th>Application ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>User Email</th>
                <th>Tax Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app, index) => (
                <tr key={app.id}>
                  <td>{index + 1}</td>
                  <td>{app.applicationId}</td>
                  <td>{app.firstName}</td>
                  <td>{app.lastName}</td>
                  <td>{app.userEmail}</td>
                  <td>{app.taxYear}</td>
                  <td>
                    <button 
                      className="view-status-button"
                      onClick={() => handleViewStatus(app.applicationId)}
                    >
                      View Status
                    </button>
                  </td>
                  <td>
                    <button 
                      className="applications-action-button"
                      onClick={() => handleViewApplication(app.applicationId)}
                    >
                      View
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
            <span className="pagination-info">Page {currentPage} of 4</span>
            <button 
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Applications; 