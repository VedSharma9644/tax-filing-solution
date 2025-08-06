import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css';

const Logout = () => {
  const [countdown, setCountdown] = useState(5);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggingOut && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Perform actual logout here
      handleLogout();
    }
  }, [countdown, isLoggingOut]);

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    sessionStorage.clear();
    
    // Redirect to login page or home
    navigate('/login');
  };

  const startLogout = () => {
    setIsLoggingOut(true);
  };

  const cancelLogout = () => {
    setIsLoggingOut(false);
    setCountdown(5);
  };

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="logout-container">
          <div className="logout-card">
            <div className="logout-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h1 className="logout-title">Logout</h1>
            <p className="logout-description">
              Are you sure you want to logout from the admin panel?
            </p>
            
            {!isLoggingOut ? (
              <div className="logout-actions">
                <button 
                  className="logout-button"
                  onClick={startLogout}
                >
                  Yes, Logout
                </button>
                <button 
                  className="cancel-button"
                  onClick={() => navigate('/home')}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="logout-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="countdown-text">
                  Logging out in {countdown} seconds...
                </p>
                <button 
                  className="cancel-logout-button"
                  onClick={cancelLogout}
                >
                  Cancel Logout
                </button>
              </div>
            )}
            
            <div className="logout-info">
              <h3>What happens when you logout?</h3>
              <ul>
                <li>Your session will be terminated</li>
                <li>You'll need to login again to access the admin panel</li>
                <li>Any unsaved changes will be lost</li>
                <li>You'll be redirected to the login page</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Logout; 