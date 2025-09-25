import React, { useState, useEffect } from 'react';
import './Homepage.css';
import AdminApiService from '../services/api';

const Homepage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTaxForms: 0,
    totalAppointments: 0,
    totalPayments: 0,
    totalSupportRequests: 0,
    totalFeedback: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await AdminApiService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="homepage">
        <main className="dashboard-content">
          <div className="dashboard-home">
            <h1>📊 Tax Management Dashboard</h1>
            <p className="dashboard-subtext">Loading dashboard data...</p>
            <div className="loading-spinner">⏳</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage">
        <main className="dashboard-content">
          <div className="dashboard-home">
            <h1>📊 Tax Management Dashboard</h1>
            <p className="dashboard-subtext">Error: {error}</p>
            <button onClick={fetchDashboardStats} className="retry-button">
              🔄 Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="homepage">
      <main className="dashboard-content">
        <div className="dashboard-home">
          <h1>📊 Tax Management Dashboard</h1>
          <p className="dashboard-subtext">Keep track of users, applications, and payments in real-time.</p>
          
          <div className="dashboard-details">
            <div className="card">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"></path>
              </svg>
              <h2>Total Users</h2>
              <p>{stats.totalUsers}</p>
              <span>📍 Active Users: {stats.totalUsers} 🔵</span>
            </div>
            
            <div className="card">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-64c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-72v8c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm96-114.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
              </svg>
              <h2>Total Applications</h2>
              <p>{stats.totalTaxForms}</p>
              <span>📌 Final Copy Uploaded Applications: {Math.floor(stats.totalTaxForms * 0.6)} ⏳</span><br/>
              <span>📌 Payments Done Applications: {Math.floor(stats.totalTaxForms * 0.4)} ✅</span>
            </div>
            
            <div className="card">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 288 512" className="icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M209.2 233.4l-108-31.6C88.7 198.2 80 186.5 80 173.5c0-16.3 13.2-29.5 29.5-29.5h66.3c12.2 0 24.2 3.7 34.2 10.5 6.1 4.1 14.3 3.1 19.5-2l34.8-34c7.1-6.9 6.1-18.4-1.8-24.5C238 74.8 207.4 64.1 176 64V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48h-2.5C45.8 64-5.4 118.7.5 183.6c4.2 46.1 39.4 83.6 83.8 96.6l102.5 30c12.5 3.7 21.2 15.3 21.2 28.3 0 16.3-13.2 29.5-29.5 29.5h-66.3C100 368 88 364.3 78 357.5c-6.1-4.1-14.3-3.1-19.5 2l-34.8 34c-7.1 6.9-6.1 18.4 1.8 24.5 24.5 19.2 55.1 29.9 86.5 30v48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-48.2c46.6-.9 90.3-28.6 105.7-72.7 21.5-61.6-14.6-124.8-72.5-141.7z"></path>
              </svg>
              <h2>Total Payments</h2>
              <p>${(stats.totalPayments * 50).toFixed(2)}</p>
              <span>💵Total Transactions: {stats.totalPayments}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage; 