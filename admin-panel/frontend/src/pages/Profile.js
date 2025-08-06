import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'equitas',
    email: 'it-admin@equitastax.com',
    phone: '9876543210',
    address: 'hyderbad'
  });

  const [editData, setEditData] = useState({ ...profileData });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
  };

  const handleSave = () => {
    setProfileData({ ...editData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({ ...profileData });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value
    });
  };

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="dashboard-profile-container">
          <div className="dashboard-profile-header">
            <h2>Admin Profile</h2>
            <div className="dashboard-profile-image">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" height="3em" width="3em" xmlns="http://www.w3.org/2000/svg">
                <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path>
              </svg>
            </div>
          </div>
          
          <div className="dashboard-profile-details">
            <div className="dashboard-profile-item">
              <strong>Name:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="profile-edit-input"
                />
              ) : (
                <span>{profileData.name}</span>
              )}
            </div>
            
            <div className="dashboard-profile-item">
              <strong>Email:</strong>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="profile-edit-input"
                />
              ) : (
                <span>{profileData.email}</span>
              )}
            </div>
            
            <div className="dashboard-profile-item">
              <strong>Phone:</strong>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="profile-edit-input"
                />
              ) : (
                <span>{profileData.phone}</span>
              )}
            </div>
            
            <div className="dashboard-profile-item">
              <strong>Address:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="profile-edit-input"
                />
              ) : (
                <span>{profileData.address}</span>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            {!isEditing ? (
              <button className="dashboard-toggle-button" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-button" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile; 