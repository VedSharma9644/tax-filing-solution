import React, { useState } from 'react';
import './Users.css';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const users = [
    {
      id: 1,
      firstName: '',
      lastName: '',
      email: 'jayasaikrishnareddy93@gmail.com',
      mobile: '5164507612',
      joinDate: '12/30/2024',
      emailVerified: true
    },
    {
      id: 2,
      firstName: '',
      lastName: '',
      email: 'rajendar4444@gmail.com',
      mobile: '7204568074',
      joinDate: '1/4/2025',
      emailVerified: true
    },
    {
      id: 3,
      firstName: '',
      lastName: '',
      email: 'shwetha2730idp@gmail.com',
      mobile: '3464299720',
      joinDate: '1/6/2025',
      emailVerified: true
    },
    {
      id: 4,
      firstName: '',
      lastName: '',
      email: 'shivathallapally07@gmail.com',
      mobile: '6304295513',
      joinDate: '1/11/2025',
      emailVerified: true
    },
    {
      id: 5,
      firstName: 'Naruto',
      lastName: 'Uzumaki',
      email: 'narutouzumaki143457@gmail.com',
      mobile: '6304295513',
      joinDate: '1/17/2025',
      emailVerified: true
    },
    {
      id: 6,
      firstName: 'Rakesh',
      lastName: 'Kotha',
      email: 'rakeshkotha27@gmail.com',
      mobile: '7209193954',
      joinDate: '1/18/2025',
      emailVerified: true
    },
    {
      id: 7,
      firstName: 'Diana',
      lastName: 'Samuel',
      email: 'samdice32@gmail.com',
      mobile: '2145871034',
      joinDate: '1/21/2025',
      emailVerified: true
    },
    {
      id: 8,
      firstName: 'Aman',
      lastName: 'Jain',
      email: 'amanjaincu@gmail.com',
      mobile: '7203885760',
      joinDate: '1/27/2025',
      emailVerified: true
    },
    {
      id: 9,
      firstName: 'Monish',
      lastName: 'Chintha',
      email: 'monishkumarreddy17@gmail.com',
      mobile: '9132063356',
      joinDate: '1/27/2025',
      emailVerified: true
    },
    {
      id: 10,
      firstName: 'saikrishna',
      lastName: 'Arukala',
      email: 'aru.krishna05@gmail.com',
      mobile: '+1 (216) 258- 2095',
      joinDate: '1/31/2025',
      emailVerified: true
    }
  ];

  const handleDeleteUser = (userId) => {
    // Handle delete user functionality
    console.log('Delete user:', userId);
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile.includes(searchTerm)
  );

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="dashboard-users">
          <div className="dashboard-users--header">
            <h1 className="applications-title">Users</h1>
            <p className="applications-description">Manage and view users in the system.</p>
            <div className="search-form">
              <input
                type="text"
                placeholder="Enter First Name, Last Name, Email, or number ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="dashboard-users--list">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Sl.No</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Join Date</th>
                  <th>Email Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{user.mobile}</td>
                    <td>{user.joinDate}</td>
                    <td>
                      <span className="email-verification-icon" data-tooltip="Email Verified">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="verified" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                          <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path>
                        </svg>
                      </span>
                    </td>
                    <td>
                      <svg 
                        stroke="currentColor" 
                        fill="currentColor" 
                        strokeWidth="0" 
                        viewBox="0 0 448 512" 
                        className="delete-icon" 
                        height="1em" 
                        width="1em" 
                        xmlns="http://www.w3.org/2000/svg"
                        onClick={() => handleDeleteUser(user.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <title>Delete User</title>
                        <path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path>
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              Previous
            </button>
            <span>Page {currentPage} of 4</span>
            <button onClick={() => setCurrentPage(currentPage + 1)}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Users; 