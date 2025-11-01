import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../screens/ui/button';
import { uploadDocumentToGCS } from '../services/gcsService';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const ProfileForm = ({ 
  profile, 
  onProfileChange, 
  errors = {}, 
  loading = false, 
  onSave, 
  onReset,
  onProfilePictureUpdated // New callback to reload profile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [profileImage, setProfileImage] = useState(profile?.profilePicture || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { user, token, updateUser } = useAuth();

  // Update form data when profile changes
  React.useEffect(() => {
    setFormData(profile);
    setProfileImage(profile?.profilePicture || null);
  }, [profile]);

  // Request camera permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload profile pictures.');
      return false;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadProfileImage(asset);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Upload profile image to GCS
  const uploadProfileImage = async (imageAsset) => {
    if (!user?.id || !token) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    setIsUploadingImage(true);

    try {
      const fileData = {
        uri: imageAsset.uri,
        name: `profile-${user.id}-${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: imageAsset.fileSize || 0,
      };

      // Upload to GCS via backend
      const result = await uploadDocumentToGCS(
        fileData,
        user.id,
        'profile_images',
        (progress) => {
          console.log(`Profile image upload progress: ${progress}%`);
        },
        token
      );

      // Update profile image state
      setProfileImage(result.publicUrl);
      
      // Save to database via API
      try {
        const response = await ApiService.makeRequest('/profile/update-image', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profilePicture: result.publicUrl
          })
        });

        console.log('✅ Profile picture saved to database:', response);

        // If API returns updated user data, use it
        if (response.success && response.user) {
          // Update AuthContext user so header shows new picture
          // Preserve profileComplete status to prevent redirect
          await updateUser({
            ...user,
            ...response.user,
            profileComplete: user.profileComplete !== undefined ? user.profileComplete : true
          });
        } else if (response.success) {
          // If only success flag, update user with new profile picture
          // Preserve profileComplete status to prevent redirect
          await updateUser({
            ...user,
            profilePicture: result.publicUrl,
            profileComplete: user.profileComplete !== undefined ? user.profileComplete : true
          });
        }
      } catch (apiError) {
        console.error('❌ Database update failed:', apiError);
        Alert.alert('Warning', 'Profile picture uploaded but failed to save to database. Please try again.');
        return;
      }
      
      // Notify parent component of the change
      onProfileChange('profilePicture', result.publicUrl);
      
      // Update local form data to reflect the new image immediately
      setFormData(prev => ({ ...prev, profilePicture: result.publicUrl }));

      // Reload profile from server if callback provided
      if (onProfilePictureUpdated) {
        onProfilePictureUpdated();
      }

      // Don't show alert here - it will be shown after save
      // Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile image upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onProfileChange(field, value);
  };

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const success = await onSave({
      ...formData,
      profilePicture: profileImage || formData.profilePicture // Ensure profile image is included
    });
    if (success) {
      setIsEditing(false);
      // Reload profile to sync with latest data
      if (onProfilePictureUpdated) {
        onProfilePictureUpdated();
      }
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    onReset();
  };

  const getDisplayName = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName} ${formData.lastName}`;
    }
    return formData.firstName || formData.lastName || 'User';
  };

  const getUserInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.charAt(0).toUpperCase()}${formData.lastName.charAt(0).toUpperCase()}`;
    }
    if (formData.firstName) {
      return formData.firstName.charAt(0).toUpperCase();
    }
    if (formData.lastName) {
      return formData.lastName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {getUserInitials()}
              </Text>
            )}
          </View>
          {isEditing && (
            <Button 
              variant="secondary" 
              style={[styles.avatarEditButton, isUploadingImage && styles.uploadingButton]}
              onPress={pickImage}
              disabled={isUploadingImage}
            >
              <Ionicons 
                name={isUploadingImage ? "hourglass-outline" : "camera"} 
                size={16} 
                color={isUploadingImage ? "#999" : "#007bff"} 
              />
            </Button>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{getDisplayName()}</Text>
          <Text style={styles.profileEmail}>{formData.email}</Text>
          <Text style={styles.profileSince}>Member since 2024</Text>
        </View>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* First Name & Last Name Row */}
        <View style={styles.inputRow}>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Enter first name"
              editable={isEditing}
              autoCapitalize="words"
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>
          <View style={styles.inputColumn}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Enter last name"
              editable={isEditing}
              autoCapitalize="words"
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>
        </View>

        {/* Email Address */}
        <View style={styles.inputField}>
          <Text style={styles.label}>Email Address *</Text>
          <View style={[styles.inputWithIcon, errors.email && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconText}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter email address"
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        {/* Phone Number */}
        <View style={styles.inputField}>
          <Text style={styles.label}>Phone Number *</Text>
          <View style={[styles.inputWithIcon, errors.phone && styles.inputError]}>
            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconText}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isEditing ? (
          <View style={styles.buttonRow}>
            <Button
              variant="outline"
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Button>
            <Button
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </Button>
          </View>
        ) : (
          <Button
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0E502B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 2,
  },
  uploadingButton: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  profileSince: {
    fontSize: 12,
    color: '#999',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputColumn: {
    flex: 1,
  },
  inputField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIconText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#0E502B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#0E502B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    borderColor: '#6c757d',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileForm;
