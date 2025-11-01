import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ toggleSidebar, admin }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
    <nav className="dashboard-navbar">
      <div className="dashboard-navbar-logo">
        <img 
          src="/logo.jpg" 
          alt="logo"
        />
      </div>
      <div className="dashboard-navbar-profile" ref={dropdownRef}>
        <div 
          className="profile-icon-container"
          onClick={toggleProfileDropdown}
        >
          <svg 
            stroke="currentColor" 
            fill="currentColor" 
            strokeWidth="0" 
            viewBox="0 0 496 512" 
            height="1em" 
            width="1em" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path>
          </svg>
        </div>
        
        {showProfileDropdown && (
          <div className="dashboard-profile-popup">
            <div className="profile-info">
              <div className="profile-name">{admin?.name || 'Admin User'}</div>
              <div className="profile-email">{admin?.email || 'admin@taxfiling.com'}</div>
              <div className="profile-role">{admin?.role || 'Administrator'}</div>
            </div>
            <ul className="dashboard-sidebar-menu">
              <Link to="/admin/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <li className="active" onClick={() => setShowProfileDropdown(false)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path>
                  </svg>
                  <span>My Profile</span>
                </li>
              </Link>
              <Link to="/admin/logout" style={{ textDecoration: 'none', color: 'inherit' }}>
                <li onClick={() => setShowProfileDropdown(false)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12L16 7M21 12H9"></path>
                  </svg>
                  <span>Logout</span>
                </li>
              </Link>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header; 