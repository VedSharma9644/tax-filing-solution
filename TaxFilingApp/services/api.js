import { Platform } from 'react-native';

// Dynamic API URL detection for development and production
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development URLs
    if (Platform.OS === 'android') {
      // Check if running in Android Studio emulator
      // Emulator uses 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:5000';  // Android Studio emulator
    }
    
    // For Expo Go, physical devices, and other platforms
    // Use the new backend in the correct Firebase project
    return 'https://tax-filing-backend-693306869303.us-central1.run.app';
  }
  
  // Production URL - New backend in correct Firebase project
  return 'https://tax-filing-backend-693306869303.us-central1.run.app';
};

export const API_BASE_URL = getApiBaseUrl();

// Log the detected API URL for debugging
if (__DEV__) {
  console.log(`🌐 API Base URL detected: ${API_BASE_URL}`);
  console.log(`📱 Platform: ${Platform.OS}, Dev Mode: ${__DEV__}`);
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    if (__DEV__) {
      console.log(`🔗 ApiService initialized with base URL: ${this.baseURL}`);
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
        console.log(`🌐 Making request to: ${url}`);
        console.log(`📡 Method: ${config.method || 'GET'}`);
      }

      const response = await fetch(url, config);
      
      if (__DEV__) {
        console.log(`📡 Response status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        if (__DEV__) {
          console.error(`❌ API Error: ${data.error || response.status}`);
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (__DEV__) {
        console.log(`✅ Request successful`);
      }
      return data;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ API Request error:', error);
      }
      throw error;
    }
  }



  // Firebase Phone Auth Login
  async firebasePhoneLogin(idToken) {
    try {
      console.log('📱 Sending Firebase ID token to backend');
      
      const response = await fetch(`${this.baseURL}/auth/firebase-phone-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Firebase Phone Auth successful`);
      return data;
    } catch (error) {
      console.error('❌ Firebase Phone Auth error:', error);
      throw error;
    }
  }

  // Google OAuth Login
  async googleLogin(authCode, accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode,
          accessToken
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Google login error:', error);
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
      console.error('Get current user error:', error);
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
      console.log('📋 Submitting tax form...');
      
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
      
      console.log('✅ Tax form submitted successfully');
      return data;
    } catch (error) {
      console.error('Submit tax form error:', error);
      throw error;
    }
  }

  // Get user documents from GCS
  async getUserDocuments(token) {
    try {
      console.log('🌐 Making request to:', `${this.baseURL}/documents`);
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${this.baseURL}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Get user documents error:', error);
      throw error;
    }
  }

  // Delete document from GCS
  async deleteDocument(documentId, token) {
    try {
      console.log('🌐 Making request to:', `${this.baseURL}/documents/${documentId}`);
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${this.baseURL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  // Get admin documents and notes for user
  async getAdminDocuments(token) {
    try {
      console.log('🌐 Making request to:', `${this.baseURL}/user/admin-documents`);
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${this.baseURL}/user/admin-documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Get admin documents error:', error);
      throw error;
    }
  }

  // Get tax form history
  async getTaxFormHistory(token) {
    try {
      console.log('🌐 Making request to:', `${this.baseURL}/tax-forms/history`);
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${this.baseURL}/tax-forms/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Tax form history request successful');
      return data;
    } catch (error) {
      console.error('❌ Get tax form history error:', error);
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
      console.log('📄 Fetching user documents...');
      
      const response = await fetch(`${this.baseURL}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ API Error:', data.error || `HTTP error! status: ${response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ User documents request successful');
      return data;
    } catch (error) {
      console.error('❌ Get user documents error:', error);
      throw error;
    }
  }
}

export default new ApiService();