import { Platform } from 'react-native';
import apiInterceptor from '../utils/apiInterceptor';

// Dynamic API URL detection for development and production
const getApiBaseUrl = () => {
  // Always use production URL for native builds
  return 'https://tax-filing-backend-693306869303.us-central1.run.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the detected API URL for debugging

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    if (__DEV__) {
    }
  }

  // Enhanced fetch method with token refresh interceptor
  async fetchWithInterceptor(url, options = {}) {
    try {
      // Intercept request to add token
      const interceptedRequest = await apiInterceptor.interceptRequest({
        url,
        ...options
      });

      // Make the request
      const response = await fetch(interceptedRequest.url, {
        method: interceptedRequest.method || 'GET',
        headers: interceptedRequest.headers,
        body: interceptedRequest.body
      });

      // Intercept response to handle token refresh
      const interceptedResponse = await apiInterceptor.interceptResponse(response, interceptedRequest);
      
      return interceptedResponse;
    } catch (error) {
      console.error('Fetch with interceptor error:', error);
      throw error;
    }
  }

  // Generic API request method for ProfileService compatibility
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      // Remove body from config if it's undefined
      if (config.body === undefined) {
        delete config.body;
      }

      if (__DEV__) {
      }

      const response = await fetch(url, config);
      
      if (__DEV__) {
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        if (__DEV__) {
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (__DEV__) {
      }
      return data;
    } catch (error) {
      if (__DEV__) {
      }
      throw error;
    }
  }



  // Firebase Phone Auth Login
  async firebasePhoneLogin(idToken) {
    try {
      
      const response = await fetch(`${this.baseURL}/auth/firebase-phone-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Google Sign-In Login
  async googleLogin(authCode, idToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode, // Keep for backward compatibility
          idToken,  // New: Google ID token from native sign-in
          accessToken: idToken // Map idToken to accessToken for backend compatibility
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Validate if a stored token is still valid
  async validateToken(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(profileData, token) {
    try {
      const response = await fetch(`${this.baseURL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Tax Form endpoints

  // Submit tax form
  async submitTaxForm(formData, token) {
    try {
      
      const response = await fetch(`${this.baseURL}/tax-forms/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
        timeout: 30000, // 30 second timeout for large submissions
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get user documents from GCS
  async getUserDocuments(token) {
    try {
      
      const response = await fetch(`${this.baseURL}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Delete document from GCS
  async deleteDocument(documentId, token) {
    try {
      
      const response = await fetch(`${this.baseURL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get admin documents and notes for user
  async getAdminDocuments(token) {
    try {
      
      const response = await fetch(`${this.baseURL}/user/admin-documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get public URL for final document (for browser download)
  async getFinalDocumentUrl(applicationId, token) {
    try {
      const response = await fetch(`${this.baseURL}/user/final-document-url/${applicationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get tax form history
  async getTaxFormHistory(token) {
    try {
      
      const response = await fetch(`${this.baseURL}/tax-forms/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

   
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get specific tax form details
  async getTaxFormDetails(formId, token) {
    try {
      const response = await fetch(`${this.baseURL}/tax-forms/${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Get tax form details error:', error);
      throw error;
    }
  }

  // Get user uploaded documents
  async getUserDocuments(token) {
    try {
      
      const response = await fetch(`${this.baseURL}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ApiService();