import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminApiService from '../services/api';
import { usePermissions } from '../contexts/PermissionContext';
import './AdminUsers.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, PERMISSIONS, hasPermission } = usePermissions();
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    pages: [],
    isActive: true
  });
  const [availablePages, setAvailablePages] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/admin');
      return;
    }
    fetchAdminUsers();
    fetchAvailablePages();
  }, [isSuperAdmin, navigate]);

  const fetchAvailablePages = async () => {
    try {
      const response = await AdminApiService.getAvailablePages();
      if (response.success) {
        setAvailablePages(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching available pages:', err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await AdminApiService.getAdminUsers();
      if (response.success) {
        setAdminUsers(response.data || []);
      } else {
        setError('Failed to fetch admin users');
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      pages: [],
      isActive: true
    });
    setFormErrors({});
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      name: user.name,
      pages: user.pages || [],
      isActive: user.isActive
    });
    setFormErrors({});
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (showCreateModal && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.name) {
      errors.name = 'Name is required';
    }
    
    if (!formData.pages || formData.pages.length === 0) {
      errors.pages = 'At least one page must be selected';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePageToggle = (pageValue) => {
    setFormData(prev => {
      const currentPages = prev.pages || [];
      if (currentPages.includes(pageValue)) {
        return { ...prev, pages: currentPages.filter(p => p !== pageValue) };
      } else {
        return { ...prev, pages: [...currentPages, pageValue] };
      }
    });
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setUpdating(true);
      const response = await AdminApiService.createAdminUser(formData);
      
      if (response.success) {
        setShowCreateModal(false);
        await fetchAdminUsers();
        alert('Admin user created successfully!');
      } else {
        alert(response.error || 'Failed to create admin user');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      alert('Failed to create admin user: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setUpdating(true);
      const updateData = {
        name: formData.name,
        pages: formData.pages,
        isActive: formData.isActive
      };
      
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      const response = await AdminApiService.updateAdminUser(selectedUser.id, updateData);
      
      if (response.success) {
        setShowEditModal(false);
        await fetchAdminUsers();
        alert('Admin user updated successfully!');
      } else {
        alert(response.error || 'Failed to update admin user');
      }
    } catch (error) {
      console.error('Error updating admin user:', error);
      alert('Failed to update admin user: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setUpdating(true);
      const response = await AdminApiService.deleteAdminUser(selectedUser.id);
      
      if (response.success) {
        setShowDeleteModal(false);
        await fetchAdminUsers();
        alert('Admin user deleted successfully!');
      } else {
        alert(response.error || 'Failed to delete admin user');
      }
    } catch (error) {
      console.error('Error deleting admin user:', error);
      alert('Failed to delete admin user: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Invalid Date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getRoleBadgeClass = (pages) => {
    if (!pages || !Array.isArray(pages)) return 'role-badge';
    if (pages.includes('admin-users') && pages.length === availablePages.length) {
      return 'role-badge super-admin';
    }
    return 'role-badge admin';
  };

  const getRoleLabel = (pages) => {
    if (!pages || !Array.isArray(pages)) return 'N/A';
    if (pages.includes('admin-users') && pages.length === availablePages.length) {
      return 'Super Admin';
    }
    return `${pages.length} Page${pages.length !== 1 ? 's' : ''}`;
  };

  if (!isSuperAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-users-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin users...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="admin-users-header">
        <h1>Admin Users</h1>
        <button className="create-button" onClick={handleCreate}>
          + Create Admin User
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="admin-users-table-container">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No admin users found
                </td>
              </tr>
            ) : (
              adminUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.pages)} title={user.pages?.join(', ') || 'No pages'}>
                      {getRoleLabel(user.pages)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(user.lastLoginAt)}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(user)}
                        title="Edit admin user"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(user)}
                        title="Delete admin user"
                        disabled={user.id === JSON.parse(localStorage.getItem('adminUser') || '{}').id}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Admin User</h2>
            <form onSubmit={handleSubmitCreate}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={formErrors.password ? 'error' : ''}
                />
                {formErrors.password && <span className="field-error">{formErrors.password}</span>}
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>Accessible Pages *</label>
                <div className="pages-checkbox-container">
                  {availablePages.map((page) => (
                    <label key={page.value} className="page-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.pages.includes(page.value)}
                        onChange={() => handlePageToggle(page.value)}
                      />
                      <span>{page.label}</span>
                    </label>
                  ))}
                </div>
                {formErrors.pages && <span className="field-error">{formErrors.pages}</span>}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" disabled={updating}>
                  {updating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={updating}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Admin User</h2>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="disabled"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={formErrors.password ? 'error' : ''}
                  placeholder="Enter new password"
                />
                {formErrors.password && <span className="field-error">{formErrors.password}</span>}
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label>Accessible Pages *</label>
                <div className="pages-checkbox-container">
                  {availablePages.map((page) => (
                    <label key={page.value} className="page-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.pages.includes(page.value)}
                        onChange={() => handlePageToggle(page.value)}
                      />
                      <span>{page.label}</span>
                    </label>
                  ))}
                </div>
                {formErrors.pages && <span className="field-error">{formErrors.pages}</span>}
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} disabled={updating}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Admin User</h2>
            <p>Are you sure you want to delete <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="delete-button" onClick={handleConfirmDelete} disabled={updating}>
                {updating ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} disabled={updating}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

