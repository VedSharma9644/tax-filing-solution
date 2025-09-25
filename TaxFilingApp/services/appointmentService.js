// Appointment service for mobile app
import { API_BASE_URL } from './api';
import { secureStorage } from '../utils/secureStorage';

class AppointmentService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from secure storage
  async getAuthToken() {
    try {
      const { accessToken } = await secureStorage.getAuthTokens();
      return accessToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Submit appointment request
  async submitAppointment(appointmentData) {
    try {
      const token = await this.getAuthToken();
      
      console.log(`📅 Submitting appointment:`, appointmentData);
      console.log(`🌐 API URL: ${this.baseURL}/appointments/submit`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/appointments/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentData),
        timeout: 10000,
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Appointment API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Appointment submitted successfully`);
      return data;
    } catch (error) {
      console.error('❌ Appointment submission error:', error);
      throw error;
    }
  }

  // Get user's appointment history
  async getAppointmentHistory() {
    try {
      const token = await this.getAuthToken();
      
      console.log(`📋 Getting appointment history`);
      console.log(`🌐 API URL: ${this.baseURL}/appointments/history`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/appointments/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Appointment History API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Appointment history retrieved successfully`);
      return data;
    } catch (error) {
      console.error('❌ Appointment history error:', error);
      throw error;
    }
  }

  // Get available time slots for a specific date
  async getAvailableTimeSlots(date) {
    try {
      const token = await this.getAuthToken();
      
      console.log(`🕐 Getting available time slots for: ${date}`);
      console.log(`🌐 API URL: ${this.baseURL}/appointments/available-slots`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/appointments/available-slots?date=${date}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Available Slots API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Available time slots retrieved successfully`);
      return data;
    } catch (error) {
      console.error('❌ Available time slots error:', error);
      throw error;
    }
  }

  // Cancel an appointment
  async cancelAppointment(appointmentId) {
    try {
      const token = await this.getAuthToken();
      
      console.log(`❌ Cancelling appointment: ${appointmentId}`);
      console.log(`🌐 API URL: ${this.baseURL}/appointments/cancel`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/appointments/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId }),
        timeout: 10000,
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Cancel Appointment API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Appointment cancelled successfully`);
      return data;
    } catch (error) {
      console.error('❌ Cancel appointment error:', error);
      throw error;
    }
  }
}

export default new AppointmentService();
