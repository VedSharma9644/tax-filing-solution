import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Colors from '../utils/colors';
import ApiService, { API_BASE_URL } from '../config/api';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [taxForms, setTaxForms] = useState([]);
  const [userDocuments, setUserDocuments] = useState([]);
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get user and token from localStorage
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    
    // If either token or user is missing, redirect to login
    if (!token || !userData) {
      // Clear any stale data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/');
      return;
    }
    
    // Check if profile is complete - redirect to profile setup if not
    if (userData.profileComplete !== true) {
      navigate('/profile-setup');
      return;
    }
    
    setUser(userData);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let fetchedTaxForms = [];
      
      // Fetch tax forms
      try {
        const formsResponse = await ApiService.getTaxFormHistory(token);
        if (formsResponse.success) {
          fetchedTaxForms = formsResponse.data || [];
          setTaxForms(fetchedTaxForms);
        } else {
          console.warn('Tax forms response not successful:', formsResponse);
        }
      } catch (err) {
        console.error('Error fetching tax forms:', err);
        // Check if it's an authentication error
        if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('token'))) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          navigate('/');
          return;
        }
        // Don't set error for tax forms failure, just log it
      }

      // Fetch user documents
      try {
        const docsResponse = await ApiService.getUserDocuments(token);
        if (docsResponse.success) {
          setUserDocuments(docsResponse.data || []);
        } else {
          console.warn('User documents response not successful:', docsResponse);
        }
      } catch (err) {
        console.error('Error fetching user documents:', err);
        // Check if it's an authentication error
        if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('token'))) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          navigate('/');
          return;
        }
        // Don't set error for documents failure, just log it
      }

      // Fetch admin documents if application is submitted
      if (fetchedTaxForms.length > 0) {
        const currentYear = new Date().getFullYear();
        const currentYearForm = fetchedTaxForms.find(form => form.taxYear === currentYear);
        if (currentYearForm) {
          const submittedStatuses = ['submitted', 'under_review', 'processing', 'approved', 'completed'];
          if (submittedStatuses.includes(currentYearForm.status)) {
            try {
              const adminDocsResponse = await ApiService.getAdminDocuments(token);
              if (adminDocsResponse.success) {
                setAdminDocuments(adminDocsResponse.data || []);
              }
            } catch (err) {
              console.error('Error fetching admin documents:', err);
              // Admin documents are optional, so we don't show error
            }
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching dashboard data:', err);
      // Only show error if it's a critical issue
      if (err.message && !err.message.includes('401') && !err.message.includes('Unauthorized')) {
        setError('Failed to load dashboard data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.name) return user.name;
    
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'User';
  };

  const getCurrentYearTaxForm = () => {
    if (taxForms.length === 0) {
      return {
        year: new Date().getFullYear(),
        status: "no_data",
        progress: 0,
        refund: 0
      };
    }

    const currentYear = new Date().getFullYear();
    const currentYearForm = taxForms.find(form => form.taxYear === currentYear) || taxForms[0];
    
    return {
      year: currentYearForm.taxYear || currentYear,
      status: currentYearForm.status === 'completed' || currentYearForm.status === 'approved' ? 'completed' : 'in_progress',
      progress: currentYearForm.status === 'completed' || currentYearForm.status === 'approved' ? 100 : 65,
      refund: currentYearForm.expectedReturn || 0
    };
  };

  const hasSubmittedApplication = () => {
    if (taxForms.length === 0) return false;
    
    const currentYear = new Date().getFullYear();
    const currentYearForm = taxForms.find(form => form.taxYear === currentYear);
    
    if (!currentYearForm) return false;
    
    const submittedStatuses = ['submitted', 'under_review', 'processing', 'approved', 'completed'];
    return submittedStatuses.includes(currentYearForm.status);
  };

  const hasDraftDocument = () => {
    if (!adminDocuments || adminDocuments.length === 0) return false;
    return adminDocuments.some(doc => doc.type === 'draft_return');
  };

  const hasFinalDocument = () => {
    if (!adminDocuments || adminDocuments.length === 0) return false;
    return adminDocuments.some(doc => doc.type === 'final_return');
  };

  const getFinalDocument = () => {
    if (!adminDocuments || adminDocuments.length === 0) return null;
    return adminDocuments.find(doc => doc.type === 'final_return') || null;
  };

  const handleDownloadFinalDocument = async () => {
    if (!hasSubmittedApplication()) {
      alert('Please submit the application first');
      return;
    }

    const finalDoc = getFinalDocument();
    if (!finalDoc) {
      alert('Final document has not been uploaded yet. Please wait for the admin to upload it.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Authentication error. Please log in again.');
      return;
    }

    try {
      // Get the application ID from tax forms
      const currentYear = new Date().getFullYear();
      const currentYearForm = taxForms.find(form => form.taxYear === currentYear);
      const applicationId = currentYearForm?.id;

      if (!applicationId) {
        alert('Could not find application ID');
        return;
      }

      // Get public URL from backend (this endpoint returns the decryption URL)
      const urlResponse = await ApiService.getFinalDocumentUrl(applicationId, token);
      if (!urlResponse.success || !urlResponse.url) {
        throw new Error('Could not get download URL');
      }

      const publicUrl = urlResponse.url;
      console.log('🔓 Opening decrypted final document URL:', publicUrl);
      
      // Open in new tab - browser will handle download/viewing
      window.open(publicUrl, '_blank');
    } catch (error) {
      console.error('Error downloading final document:', error);
      
      // Fallback: try to construct decryption URL from gcsPath
      if (finalDoc.gcsPath) {
        const decryptionUrl = `${API_BASE_URL}/upload/view/${encodeURIComponent(finalDoc.gcsPath)}`;
        console.log('🔓 Using fallback decryption URL:', decryptionUrl);
        window.open(decryptionUrl, '_blank');
      } else if (finalDoc.publicUrl) {
        console.log('🔓 Using publicUrl:', finalDoc.publicUrl);
        window.open(finalDoc.publicUrl, '_blank');
      } else {
        alert(`Failed to download final document: ${error.message}`);
      }
    }
  };

  const getStepCompletion = () => {
    const documents = userDocuments || [];
    
    const hasIncomeDocs = documents.some(doc => 
      doc.category === 'w2Forms' || doc.category === 'previousYearTax'
    );
    
    const hasDeductionDocs = documents.some(doc => 
      doc.category === 'medical' || 
      doc.category === 'education' || 
      doc.category === 'homeownerDeduction' || 
      doc.category === 'dependentChildren'
    );
    
    const hasPersonalInfo = documents.some(doc => 
      doc.category === 'personalId'
    );

    return {
      incomeDocuments: hasIncomeDocs,
      deductionDocuments: hasDeductionDocs,
      personalInformation: hasPersonalInfo
    };
  };

  const getOverallProgress = () => {
    const completion = getStepCompletion();
    let completedSteps = 0;
    let totalSteps = 3;
    
    if (completion.incomeDocuments) completedSteps++;
    if (completion.deductionDocuments) completedSteps++;
    if (completion.personalInformation) completedSteps++;
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      console.log('✅ Signed out from Firebase');
    } catch (error) {
      console.error('Error signing out from Firebase:', error);
      // Continue with logout even if Firebase signout fails
    }
    
    // Clear all local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Navigate to login page using React Router
    navigate('/');
  };

  const currentYearForm = getCurrentYearTaxForm();

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-page" style={{ backgroundColor: Colors.background.secondary }}>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-hero-header">
          <div className="dashboard-hero-content">
            <div className="dashboard-hero-text">
              <h1 className="dashboard-hero-title">Welcome back, {getUserDisplayName()}!</h1>
              <p className="dashboard-hero-subtitle">Let's get your taxes done</p>
            </div>
            <div className="dashboard-hero-icons">
              <button className="dashboard-hero-icon-button" title="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && <span className="notification-dot"></span>}
              </button>
              <button className="dashboard-hero-icon-button" title="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
                </svg>
              </button>
              <button className="dashboard-hero-icon-button" onClick={handleLogout} title="Logout">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="12" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="dashboard-hero-stats-row">
            <div className="dashboard-hero-stat-card">
              <div className="dashboard-hero-stat-content">
                <div>
                  <p className="dashboard-hero-stat-label">Tax Year {new Date().getFullYear()}</p>
                  <p className="dashboard-hero-stat-value">
                    {loading ? '...' : `${currentYearForm.progress}% Complete`}
                  </p>
                </div>
              </div>
            </div>
            <div className="dashboard-hero-stat-card">
              <div className="dashboard-hero-stat-content">
                <div>
                  <p className="dashboard-hero-stat-label">Expected Refund</p>
                  <p className="dashboard-hero-stat-value">
                    {loading ? '...' : `$${currentYearForm.refund.toFixed(0)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-actions-container">
          <div className="dashboard-actions-row">
            <button 
              className={`dashboard-action-button ${hasSubmittedApplication() ? 'disabled' : ''}`}
              onClick={() => {
                if (hasSubmittedApplication()) {
                  alert('Tax Return Already Submitted\n\nYou have already filled out your tax return. Please wait for your tax consultant to share update.');
                } else {
                  navigate('/tax-wizard');
                }
              }}
              disabled={hasSubmittedApplication()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {hasSubmittedApplication() ? (
                  <polyline points="20 6 9 17 4 12"/>
                ) : (
                  <>
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </>
                )}
              </svg>
              <span>{hasSubmittedApplication() ? 'Application Submitted' : 'Start New Return'}</span>
            </button>
            <button 
              className={`dashboard-action-button ${!hasSubmittedApplication() ? 'disabled' : ''}`}
              onClick={() => {
                if (!hasSubmittedApplication()) {
                  alert('Please submit the application first');
                } else {
                  navigate('/review-documents');
                }
              }}
              disabled={!hasSubmittedApplication()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Review Documents</span>
            </button>
            
            {/* Admin Review Buttons - Show in same row */}
            {hasSubmittedApplication() && hasDraftDocument() && !hasFinalDocument() && (
              <button 
                className="dashboard-action-button admin-review-button"
                onClick={() => navigate('/draft-review')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Review Draft Document</span>
              </button>
            )}
            
            {hasSubmittedApplication() && hasFinalDocument() && (
              <button 
                className="dashboard-action-button admin-review-button"
                onClick={handleDownloadFinalDocument}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Download Final Document</span>
              </button>
            )}
          </div>
        </div>

        {/* Tax Return Progress Section */}
        <div className="dashboard-progress-section">
          <div className="dashboard-progress-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <h2 className="dashboard-progress-title">Tax Return Progress</h2>
          </div>
          <p className="dashboard-progress-subtitle">Complete your {new Date().getFullYear()} tax return</p>
          
          {/* Overall Progress */}
          <div className="dashboard-overall-progress">
            <div className="dashboard-progress-label-row">
              <span className="dashboard-progress-label">Overall Progress</span>
              <span className="dashboard-progress-percentage">{getOverallProgress()}%</span>
            </div>
            <div className="dashboard-progress-bar-container">
              <div 
                className="dashboard-progress-bar" 
                style={{ width: `${getOverallProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Step Progress List */}
          <div className="dashboard-steps-list">
            {(() => {
              const completion = getStepCompletion();
              const steps = [
                {
                  title: "Income Documents",
                  completed: completion.incomeDocuments,
                  icon: completion.incomeDocuments ? "checkmark" : "time"
                },
                {
                  title: "Deduction Documents", 
                  completed: completion.deductionDocuments,
                  icon: completion.deductionDocuments ? "checkmark" : "time"
                },
                {
                  title: "Personal Information",
                  completed: completion.personalInformation,
                  icon: completion.personalInformation ? "checkmark" : "time"
                }
              ];

              return steps.map((step, index) => (
                <div key={index} className="dashboard-step-item">
                  <div 
                    className={`dashboard-step-icon ${step.completed ? 'completed' : step.icon === 'time' ? 'in-progress' : 'pending'}`}
                  >
                    {step.completed ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    )}
                  </div>
                  <span className="dashboard-step-title">{step.title}</span>
                  <div className={`dashboard-step-status ${step.completed ? 'complete' : step.icon === 'time' ? 'in-progress' : 'pending'}`}>
                    {step.completed ? 'Complete' : step.icon === 'time' ? 'In Progress' : 'Pending'}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
