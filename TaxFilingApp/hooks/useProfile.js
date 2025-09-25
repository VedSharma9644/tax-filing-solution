import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ProfileService from '../services/profileService';

export const useProfile = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePicture: null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load profile data when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated() && user) {
      loadProfile();
    }
  }, [user, isAuthenticated]);

  const loadProfile = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await ProfileService.getProfile(token);
      if (response.success) {
        const userData = response.user;
        setProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profilePicture: userData.profilePicture || null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return false;
    }

    // Validate profile data
    const validation = ProfileService.validateProfileData(profileData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    setSaving(true);
    setErrors({});

    try {
      const response = await ProfileService.updateProfile(token, profileData);
      if (response.success) {
        setProfile(prev => ({ ...prev, ...profileData }));
        Alert.alert('Success', 'Profile updated successfully');
        return true;
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
        return false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateProfilePicture = async (imageUri) => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to update your profile picture');
      return false;
    }

    setSaving(true);
    try {
      const response = await ProfileService.updateProfilePicture(token, imageUri);
      if (response.success) {
        setProfile(prev => ({ ...prev, profilePicture: response.profilePicture }));
        Alert.alert('Success', 'Profile picture updated successfully');
        return true;
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile picture');
        return false;
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetProfile = () => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || null,
      });
    }
    setErrors({});
  };

  return {
    profile,
    loading,
    saving,
    errors,
    updateProfile,
    updateProfilePicture,
    resetProfile,
    loadProfile,
  };
};
