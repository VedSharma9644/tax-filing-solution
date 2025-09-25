import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ModalProvider } from './contexts/ModalContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Homepage from './pages/Homepage';
import Users from './pages/Users';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Payments from './pages/Payments';
import ScheduledCalls from './pages/ScheduledCalls';
import Feedbacks from './pages/Feedbacks';
import SupportRequests from './pages/SupportRequests';
import Logout from './pages/Logout';
import Profile from './pages/Profile';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppContent() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();
  const { admin, login, logout } = useAdminAuth();

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Show login page if not authenticated
  if (location.pathname === '/login') {
    return <Login onLogin={login} />;
  }

  return (
    <div className={`App ${!sidebarExpanded ? 'sidebar-collapsed' : ''}`}>
      <Header toggleSidebar={toggleSidebar} admin={admin} />
      <Sidebar isExpanded={sidebarExpanded} activePage={location.pathname} toggleSidebar={toggleSidebar} />
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Homepage />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/admin/applications" element={
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        } />
        <Route path="/admin/applications/:id" element={
          <ProtectedRoute>
            <ApplicationDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } />
        <Route path="/admin/scheduled-calls" element={
          <ProtectedRoute>
            <ScheduledCalls />
          </ProtectedRoute>
        } />
        <Route path="/admin/feedbacks" element={
          <ProtectedRoute>
            <Feedbacks />
          </ProtectedRoute>
        } />
        <Route path="/admin/support-requests" element={
          <ProtectedRoute>
            <SupportRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/logout" element={
          <ProtectedRoute>
            <Logout onLogout={logout} />
          </ProtectedRoute>
        } />
        <Route path="/admin/profile" element={
          <ProtectedRoute>
            <Profile admin={admin} />
          </ProtectedRoute>
        } />
        {/* Legacy routes for backward compatibility */}
        <Route path="/home" element={<Navigate to="/admin" replace />} />
        <Route path="/users" element={<Navigate to="/admin/users" replace />} />
        <Route path="/applications" element={<Navigate to="/admin/applications" replace />} />
        <Route path="/payments" element={<Navigate to="/admin/payments" replace />} />
        <Route path="/scheduled-calls" element={<Navigate to="/admin/scheduled-calls" replace />} />
        <Route path="/feedbacks" element={<Navigate to="/admin/feedbacks" replace />} />
        <Route path="/support-requests" element={<Navigate to="/admin/support-requests" replace />} />
        <Route path="/logout" element={<Navigate to="/admin/logout" replace />} />
        <Route path="/profile" element={<Navigate to="/admin/profile" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <ModalProvider>
        <Router>
          <AppContent />
        </Router>
      </ModalProvider>
    </AdminAuthProvider>
  );
}

export default App; 