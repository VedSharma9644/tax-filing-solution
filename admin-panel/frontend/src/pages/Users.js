import React, { useState, useEffect } from 'react';
import './Users.css';
import AdminApiService from '../services/api';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useModal } from '../contexts/ModalContext';

const Users = () => {
  const { showAlert } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminApiService.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteModal({
      isOpen: true,
      user: user
    });
  };

  const confirmDeleteUser = async () => {
    try {
      await AdminApiService.deleteUser(deleteModal.user.id);
      
      // Remove user from local state
      setUsers(users.filter(user => user.id !== deleteModal.user.id));
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        user: null
      });
      
      // Show success message
      showAlert({
        title: 'Success',
        message: 'User deleted successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      user: null
    });
  };

  const filteredUsers = users.filter(user => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const email = user.email || '';
    const phone = user.phone || '';
    
    return firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getUserDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  if (loading) {
    return (
      <div className="homepage">
        <main className="dashboard-content">
          <div className="dashboard-users">
            <div className="dashboard-users--header">
              <h1 className="applications-title">Users</h1>
              <p className="applications-description">Loading users...</p>
              <div className="loading-spinner">⏳</div>
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
          <div className="dashboard-users">
            <div className="dashboard-users--header">
              <h1 className="applications-title">Users</h1>
              <p className="applications-description">Error: {error}</p>
              <button onClick={fetchUsers} className="retry-button">
                🔄 Retry
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
        <div className="dashboard-users">
          <div className="dashboard-users--header">
            <h1 className="applications-title">Users</h1>
            <p className="applications-description">Manage and view users in the system. Total: {users.length} users</p>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                      {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{user.firstName || '-'}</td>
                      <td>{user.lastName || '-'}</td>
                      <td>{user.email || '-'}</td>
                      <td>{user.phone || '-'}</td>
                      <td>{formatDate(user.createdAt)}</td>
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
                          onClick={() => handleDeleteUser(user)}
                          style={{ cursor: 'pointer' }}
                        >
                          <title>Delete User</title>
                          <path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path>
                        </svg>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              Previous
            </button>
            <span>Page {currentPage} of {Math.ceil(filteredUsers.length / 10)}</span>
            <button disabled={currentPage >= Math.ceil(filteredUsers.length / 10)} onClick={() => setCurrentPage(currentPage + 1)}>
              Next
            </button>
          </div>
        </div>
      </main>
      
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        userName={deleteModal.user ? getUserDisplayName(deleteModal.user) : ''}
        userEmail={deleteModal.user ? deleteModal.user.email : ''}
      />
    </div>
  );
};

export default Users; 