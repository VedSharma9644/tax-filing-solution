// Feedback service for mobile app
import { API_BASE_URL } from './api';
import { secureStorage } from '../utils/secureStorage';

class FeedbackService {
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

  // Submit feedback
  async submitFeedback(feedbackData) {
    try {
      const token = await this.getAuthToken();
      
      console.log(`📝 Submitting feedback:`, feedbackData);
      console.log(`🌐 API URL: ${this.baseURL}/feedback/submit`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
        timeout: 10000,
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Feedback API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Feedback submitted successfully`);
      return data;
    } catch (error) {
      console.error('❌ Feedback submission error:', error);
      throw error;
    }
  }

  // Get user's feedback history
  async getFeedbackHistory() {
    try {
      const token = await this.getAuthToken();
      
      console.log(`📋 Getting feedback history`);
      console.log(`🌐 API URL: ${this.baseURL}/feedback/history`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/feedback/history`, {
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
        console.error(`❌ Feedback History API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Feedback history retrieved successfully`);
      return data;
    } catch (error) {
      console.error('❌ Feedback history error:', error);
      throw error;
    }
  }
}

export default new FeedbackService();
