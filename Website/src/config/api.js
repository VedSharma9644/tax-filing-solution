// API Service for Website
// Uses the same backend as mobile app

// Using production backend (Cloud Run)
// To switch back to local: change to 'http://localhost:5000'
const API_BASE_URL = 'https://tax-filing-backend-693306869303.us-central1.run.app';

console.log('🌐 API Base URL:', API_BASE_URL);

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Firebase Email/Password Auth Login
  async firebaseEmailLogin(idToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/firebase-email-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Google Sign-In Login (with Google ID token)
  async googleLogin(idToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
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

  // Firebase Google Login (with Firebase ID token - uses Firebase Admin SDK)
  async firebaseGoogleLogin(firebaseIdToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/firebase-google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ idToken: firebaseIdToken }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      const data = await response.json();
      
      if (!response.ok) {
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from tax forms:', text);
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || data.message || `HTTP error! status: ${response.status}`;
        console.error('Tax forms API error:', errorMsg, 'Status:', response.status);
        throw new Error(errorMsg);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getTaxFormHistory:', error);
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from documents:', text);
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || data.message || `HTTP error! status: ${response.status}`;
        console.error('Documents API error:', errorMsg, 'Status:', response.status);
        throw new Error(errorMsg);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserDocuments:', error);
      throw error;
    }
  }

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

  // Get tax form personal information (SSN, dependents, additional income)
  async getTaxFormPersonalInfo(taxFormId, token) {
    try {
      const response = await fetch(`${this.baseURL}/tax-forms/${taxFormId}/personal-info`, {
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

  // Update tax form personal information (SSN, dependents, additional income)
  async updateTaxFormPersonalInfo(taxFormId, personalInfo, token) {
    try {
      const response = await fetch(`${this.baseURL}/tax-forms/${taxFormId}/update-personal-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(personalInfo),
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

  // Delete document
  async deleteDocument(documentId, token) {
    try {
      // Encode the documentId (GCS path) properly for URL
      const encodedDocumentId = encodeURIComponent(documentId);
      console.log('🗑️ Deleting document:', documentId, 'Encoded:', encodedDocumentId);
      
      const response = await fetch(`${this.baseURL}/documents/${encodedDocumentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Delete failed:', data);
        throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }

  // Get admin documents (draft returns, final returns, admin notes)
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
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(token, profileData) {
    try {
      const response = await fetch(`${this.baseURL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from profile update:', text);
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || `HTTP error! status: ${response.status}`;
        console.error('Profile update API error:', errorMsg, 'Status:', response.status);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }
}

export default new ApiService();

