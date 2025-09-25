// Support Request service for mobile app
import { API_BASE_URL } from './api';
import { secureStorage } from '../utils/secureStorage';

class SupportService {
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

  // Submit support request
  async submitSupportRequest(requestData) {
    try {
      const token = await this.getAuthToken();
      
      console.log(`📝 Submitting support request:`, requestData);
      console.log(`🌐 API URL: ${this.baseURL}/support/submit`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/support/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
        timeout: 10000,
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ Support Request API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Support request submitted successfully`);
      return data;
    } catch (error) {
      console.error('❌ Support request submission error:', error);
      throw error;
    }
  }

  // Get user's support request history
  async getSupportRequestHistory() {
    try {
      const token = await this.getAuthToken();
      
      console.log(`📋 Getting support request history`);
      console.log(`🌐 API URL: ${this.baseURL}/support/history`);
      console.log(`🔑 Token available: ${token ? 'Yes' : 'No'}`);
      
      const response = await fetch(`${this.baseURL}/support/history`, {
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
        console.error(`❌ Support History API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Support request history retrieved successfully`);
      return data;
    } catch (error) {
      console.error('❌ Support request history error:', error);
      throw error;
    }
  }
}

export default new SupportService();
