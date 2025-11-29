import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import TaxWizard from './components/TaxWizard/TaxWizard';
import ReviewDocuments from './components/ReviewDocuments';
import AdminDocuments from './components/AdminDocuments';
import DraftDocumentReview from './components/DraftDocumentReview';
import ProfileSetup from './components/ProfileSetup';
import './App.css';

function App() {
  // Check if user is logged in - verify both token and user data exist
  const isAuthenticated = () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    // User is authenticated only if both token and user data exist
    return !!(token && user);
  };

  // Check if user profile is complete
  const isProfileComplete = () => {
    if (!isAuthenticated()) return false;
    
    try {
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      
      // Profile is complete if profileComplete is explicitly true
      return userData?.profileComplete === true;
    } catch (err) {
      console.error('Error checking profile completion:', err);
      return false;
    }
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (isAuthenticated()) {
      return children;
    } else {
      // Clear any stale data if token or user is missing
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return <Navigate to="/" replace />;
    }
  };

  // Profile Setup Route Component - redirects to dashboard if profile is complete
  const ProfileSetupRoute = () => {
    if (!isAuthenticated()) {
      return <Navigate to="/" replace />;
    }
    
    if (isProfileComplete()) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <ProfileSetup />;
  };

  // Dashboard Route Component - redirects to profile setup if profile is incomplete
  const DashboardRoute = () => {
    if (!isAuthenticated()) {
      return <Navigate to="/" replace />;
    }
    
    if (!isProfileComplete()) {
      return <Navigate to="/profile-setup" replace />;
    }
    
    return <Dashboard />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated() 
                ? (isProfileComplete() ? <Navigate to="/dashboard" replace /> : <Navigate to="/profile-setup" replace />)
                : <LoginPage />
            } 
          />
          <Route 
            path="/profile-setup" 
            element={<ProfileSetupRoute />}
          />
          <Route 
            path="/dashboard" 
            element={<DashboardRoute />}
          />
          <Route 
            path="/tax-wizard" 
            element={
              <ProtectedRoute>
                {isProfileComplete() ? <TaxWizard /> : <Navigate to="/profile-setup" replace />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/review-documents" 
            element={
              <ProtectedRoute>
                {isProfileComplete() ? <ReviewDocuments /> : <Navigate to="/profile-setup" replace />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-documents" 
            element={
              <ProtectedRoute>
                {isProfileComplete() ? <AdminDocuments /> : <Navigate to="/profile-setup" replace />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/draft-review" 
            element={
              <ProtectedRoute>
                {isProfileComplete() ? <DraftDocumentReview /> : <Navigate to="/profile-setup" replace />}
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

