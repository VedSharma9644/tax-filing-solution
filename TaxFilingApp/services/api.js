// API configuration for mobile app - Expo Go compatible
// For Expo Go, we need to use the computer's IP address, not localhost
export const API_BASE_URL = 'http://192.168.1.34:5000';

// Fallback for localhost (if needed)
// export const API_BASE_URL = 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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

      console.log(`🌐 Making request to: ${url}`);
      console.log(`📡 Method: ${config.method || 'GET'}`);

      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Request successful`);
      return data;
    } catch (error) {
      console.error('❌ API Request error:', error);
      throw error;
    }
  }

  // Send OTP to email
  async sendEmailOTP(email) {
    try {
      console.log(`📧 Sending OTP to: ${email}`);
      console.log(`🌐 API URL: ${this.baseURL}/auth/send-otp/email`);
      
      const response = await fetch(`${this.baseURL}/auth/send-otp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email }),
        // Expo Go specific configuration
        timeout: 10000, // 10 second timeout
      });

      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API Error: ${data.error || response.status}`);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ OTP sent successfully`);
      return data;
    } catch (error) {
      console.error('❌ Send email OTP error:', error);
      throw error;
    }
  }

  // Send OTP to phone
  async sendPhoneOTP(phone) {
    try {
      const response = await fetch(`${this.baseURL}/auth/send-otp/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone }),
        timeout: 10000,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Send phone OTP error:', error);
      throw error;
    }
  }

  // Verify OTP
  async verifyOTP(email, phone, otp) {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: email || null, 
          phone: phone || null, 
          otp 
        }),
        timeout: 10000,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
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