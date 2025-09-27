// Admin Panel API Service
const API_BASE_URL = 'http://localhost:5001';

class AdminApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.baseUrl = API_BASE_URL; // Add this for consistency
  }

  // Get authentication token
  getAuthToken() {
    return localStorage.getItem('adminToken');
  }

  // Generic API call method with authentication
  async makeRequest(endpoint, options = {}) {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Access token required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401) {
        // Try to refresh token
        try {
          const refreshToken = localStorage.getItem('adminRefreshToken');
          if (refreshToken) {
            const refreshResponse = await fetch(`${this.baseURL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('adminToken', refreshData.data.accessToken);
              
              // Retry original request with new token
              config.headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
              const retryResponse = await fetch(url, config);
              const retryData = await retryResponse.json();
              
              if (!retryResponse.ok) {
                throw new Error(retryData.error || `HTTP error! status: ${retryResponse.status}`);
              }
              
              return retryData;
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear invalid tokens
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('adminUser');
          // Redirect to login
          window.location.href = '/login';
          return;
        }
        
        // If refresh failed, redirect to login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Admin API Error:', error);
      throw error;
    }
  }

  // Get dashboard statistics
  async getDashboardStats() {
    return this.makeRequest('/api/dashboard-stats');
  }

  // Get all users
  async getUsers() {
    return this.makeRequest('/api/users');
  }

  // Get all tax forms
  async getTaxForms() {
    return this.makeRequest('/api/tax-forms');
  }

  // Get detailed tax form by ID
  async getTaxFormDetails(formId) {
    return this.makeRequest(`/api/tax-forms/${formId}`);
  }

  // Update tax form status and expected return
  async updateTaxFormStatus(formId, status, expectedReturn, adminNotes) {
    return this.makeRequest(`/api/tax-forms/${formId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        expectedReturn,
        adminNotes
      })
    });
  }

  // Get secure file URL for viewing
  async getSecureFileUrl(gcsPath) {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      // Get fresh signed URL from main backend
      const response = await fetch(`http://localhost:5000/api/files/signed-url/${encodeURIComponent(gcsPath)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get signed URL: ${response.status}`);
      }
      
      const data = await response.json();
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }

  // Get secure file URL for downloading
  getSecureDownloadUrl(gcsPath) {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    // Use the correct admin backend port (5001) and properly encode the GCS path
    return `http://localhost:5001/admin/files/${encodeURIComponent(gcsPath)}/download?token=${token}`;
  }

  // Get all appointments with pagination and filters
  async getAppointments(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/appointments?${queryString}` : '/api/appointments';
    
    return this.makeRequest(endpoint);
  }

  // Update appointment status
  async updateAppointmentStatus(appointmentId, status, adminNotes = '') {
    return this.makeRequest('/api/appointments/status', {
      method: 'PUT',
      body: JSON.stringify({
        appointmentId,
        status,
        adminNotes
      })
    });
  }

  // Reschedule appointment with new date and time
  async rescheduleAppointment(appointmentId, newDate, newTime, adminNotes = '') {
    return this.makeRequest('/api/appointments/reschedule', {
      method: 'PUT',
      body: JSON.stringify({
        appointmentId,
        newDate,
        newTime,
        adminNotes
      })
    });
  }

  // Update admin notes for appointment
  async updateAppointmentNotes(appointmentId, adminNotes) {
    return this.makeRequest('/api/appointments/notes', {
      method: 'PUT',
      body: JSON.stringify({
        appointmentId,
        adminNotes
      })
    });
  }

  // Delete appointment
  async deleteAppointment(appointmentId) {
    return this.makeRequest(`/api/appointments/${appointmentId}`, {
      method: 'DELETE'
    });
  }

  // Get appointment statistics
  async getAppointmentStats() {
    return this.makeRequest('/api/appointments/stats');
  }

  // Get all payments
  async getPayments() {
    return this.makeRequest('/api/payments');
  }

  // Get all support requests
  async getSupportRequests() {
    return this.makeRequest('/api/support-requests');
  }

  // Get all feedback with pagination and filters
  async getFeedback(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/feedback?${queryString}` : '/api/feedback';
    
    return this.makeRequest(endpoint);
  }

  // Reply to feedback
  async replyToFeedback(feedbackId, reply, adminName = 'Admin') {
    return this.makeRequest('/api/feedback/reply', {
      method: 'POST',
      body: JSON.stringify({
        feedbackId,
        reply,
        adminName
      })
    });
  }

  // Update feedback status
  async updateFeedbackStatus(feedbackId, status) {
    return this.makeRequest('/api/feedback/status', {
      method: 'PUT',
      body: JSON.stringify({
        feedbackId,
        status
      })
    });
  }

  // Delete feedback
  async deleteFeedback(feedbackId) {
    return this.makeRequest(`/api/feedback/${feedbackId}`, {
      method: 'DELETE'
    });
  }

  // Delete user
  async deleteUser(userId) {
    return this.makeRequest(`/api/users/${userId}`, {
      method: 'DELETE'
    });
  }

  // Admin file upload methods (using admin backend on port 5001)
  async uploadReturn(applicationId, returnType, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('returnType', returnType);

    const url = `${this.baseUrl}/admin/upload/return`;
    console.log('Upload URL:', url);
    console.log('Base URL:', this.baseUrl);
    console.log('Application ID:', applicationId);

    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: formData
    }).then(response => {
      console.log('Response status:', response.status);
      console.log('Response URL:', response.url);
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    });
  }

  async getReturns(applicationId) {
    return this.makeRequest(`/admin/returns/${applicationId}`);
  }

  async downloadReturn(applicationId, returnType) {
    return this.makeRequest(`/admin/returns/${applicationId}/${returnType}`);
  }
}

export default new AdminApiService();
