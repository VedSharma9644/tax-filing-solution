import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Homepage from './pages/Homepage';
import Users from './pages/Users';
import Applications from './pages/Applications';
import Payments from './pages/Payments';
import ScheduledCalls from './pages/ScheduledCalls';
import Feedbacks from './pages/Feedbacks';
import SupportRequests from './pages/SupportRequests';
import Logout from './pages/Logout';
import Profile from './pages/Profile';
import './App.css';

function AppContent() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  return (
    <div className={`App ${!sidebarExpanded ? 'sidebar-collapsed' : ''}`}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isExpanded={sidebarExpanded} activePage={location.pathname} toggleSidebar={toggleSidebar} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/users" element={<Users />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/scheduled-calls" element={<ScheduledCalls />} />
        <Route path="/feedbacks" element={<Feedbacks />} />
        <Route path="/support-requests" element={<SupportRequests />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App; 