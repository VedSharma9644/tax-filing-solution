import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileSetup.css';
import Colors from '../utils/colors';
import ApiService from '../config/api';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: '',
    occupation: '',
    employer: '',
  });
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/');
      return;
    }

    // Check if profile is already complete - redirect to dashboard
    try {
      const userData = JSON.parse(userStr);
      if (userData && userData.profileComplete === true) {
        // Profile already complete, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      // Pre-fill form with existing user data if available
      if (userData) {
        setFormData(prev => ({
          ...prev,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          dateOfBirth: userData.dateOfBirth || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          zipCode: userData.zipCode || '',
          filingStatus: userData.filingStatus || '',
          occupation: userData.occupation || '',
          employer: userData.employer || '',
        }));
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }, [navigate]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return false;
      }
      if (formData.firstName.trim().length < 2) {
        setError('First name must be at least 2 characters');
        return false;
      }
      if (formData.lastName.trim().length < 2) {
        setError('Last name must be at least 2 characters');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(step)) {
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - save profile data
      await handleSaveProfile();
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        setLoading(false);
        return;
      }

      // Prepare profile data
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        filingStatus: formData.filingStatus || undefined,
        occupation: formData.occupation || undefined,
        employer: formData.employer || undefined,
      };

      // Save to backend
      const response = await ApiService.updateProfile(token, profileData);
      
      if (response.success) {
        // Update user data in localStorage - ensure it's updated synchronously
        if (response.user) {
          // Ensure profileComplete is set correctly
          const updatedUser = {
            ...response.user,
            profileComplete: response.user.profileComplete !== undefined 
              ? response.user.profileComplete 
              : true
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Verify localStorage was updated (for mobile browser compatibility)
          const verifyUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (verifyUser.profileComplete !== true) {
            // Force update if not set correctly
            verifyUser.profileComplete = true;
            localStorage.setItem('user', JSON.stringify(verifyUser));
          }
        } else {
          // If response doesn't include full user object, update with form data
          const userStr = localStorage.getItem('user');
          const userData = userStr ? JSON.parse(userStr) : {};
          const updatedUser = {
            ...userData,
            ...profileData,
            profileComplete: true
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Use window.location.replace() for mobile browser compatibility
        // This prevents back button issues and ensures a clean redirect
        // No setTimeout needed - localStorage is synchronous
        window.location.replace('/dashboard');
      } else {
        setError(response.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="profile-step-container">
            <div className="profile-icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h2 className="profile-step-title">Personal Information</h2>
            <p className="profile-step-description">Tell us about yourself</p>
            <div className="profile-input-group">
              <label className="profile-label">First Name *</label>
              <input
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => updateFormData('firstName', e.target.value)}
                className="profile-input"
              />
              <label className="profile-label">Last Name *</label>
              <input
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateFormData('lastName', e.target.value)}
                className="profile-input"
              />
              <label className="profile-label">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                className="profile-input"
                max={new Date().toISOString().split('T')[0]}
              />
              <label className="profile-label">Filing Status</label>
              <input
                type="text"
                placeholder="Single, Married, or Head of Household"
                value={formData.filingStatus}
                onChange={(e) => updateFormData('filingStatus', e.target.value)}
                className="profile-input"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="profile-step-container">
            <div className="profile-icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h2 className="profile-step-title">Address Information</h2>
            <p className="profile-step-description">Where do you live?</p>
            <div className="profile-input-group">
              <label className="profile-label">Street Address</label>
              <input
                type="text"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className="profile-input"
              />
              <label className="profile-label">City</label>
              <input
                type="text"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                className="profile-input"
              />
              <label className="profile-label">State</label>
              <input
                type="text"
                placeholder="State (e.g., NY, CA, TX, FL)"
                value={formData.state}
                onChange={(e) => updateFormData('state', e.target.value)}
                className="profile-input"
              />
              <label className="profile-label">ZIP Code</label>
              <input
                type="text"
                placeholder="10001"
                value={formData.zipCode}
                onChange={(e) => updateFormData('zipCode', e.target.value)}
                className="profile-input"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="profile-step-container">
            <div className="profile-icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <h2 className="profile-step-title">Employment Information</h2>
            <p className="profile-step-description">Tell us about your work</p>
            <div className="profile-input-group">
              <label className="profile-label">Occupation</label>
              <input
                type="text"
                placeholder="Software Engineer"
                value={formData.occupation}
                onChange={(e) => updateFormData('occupation', e.target.value)}
                className="profile-input"
              />
              <label className="profile-label">Employer Name</label>
              <input
                type="text"
                placeholder="ABC Company Inc."
                value={formData.employer}
                onChange={(e) => updateFormData('employer', e.target.value)}
                className="profile-input"
              />
              <div className="profile-info-box">
                <h4 className="profile-info-title">What's Next?</h4>
                <ul className="profile-info-list">
                  <li>Upload your tax documents (W-2, 1099, etc.)</li>
                  <li>Review and complete your tax return</li>
                  <li>E-file directly with the IRS</li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-setup-page" style={{ backgroundColor: Colors.background.secondary }}>
      <div className="profile-setup-container">
        {/* Progress Bar */}
        <div className="profile-progress-container">
          <div className="profile-progress-bar">
            <div 
              className="profile-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="profile-progress-text">Step {step} of {totalSteps}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="profile-error-message">
            {error}
          </div>
        )}

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="profile-button-row">
          <button
            className="profile-button profile-button-back"
            onClick={handleBack}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <button
            className="profile-button profile-button-primary"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? (
              'Saving...'
            ) : (
              <>
                {step === totalSteps ? 'Finish' : 'Next'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;

