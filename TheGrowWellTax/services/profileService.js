import ApiService from './api';

class ProfileService {
  // Get current user profile
  async getProfile(token) {
    try {
      const response = await ApiService.makeRequest('/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(token, profileData) {
    try {
      const response = await ApiService.makeRequest('/profile/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Update profile picture
  async updateProfilePicture(token, imageUri) {
    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const response = await ApiService.makeRequest('/profile/picture', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      return response;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }

  // Validate profile data
  validateProfileData(data) {
    const errors = {};

    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!data.email || !data.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.phone || data.phone.length < 10) {
      errors.phone = 'Please enter a valid phone number';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export default new ProfileService();
