import { Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadDocumentToGCS, deleteDocumentFromGCS } from '../../../services/gcsService';

export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return false;
    }
  }
  return true;
};

export const pickDocument = async (): Promise<DocumentPicker.DocumentPickerResult> => {
  return await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
};

export const takePhoto = async (): Promise<ImagePicker.ImagePickerResult> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    throw new Error('Camera permission denied');
  }

  return await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    aspect: [4, 3],
  });
};


export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isValidImageUri = (uri: string | undefined): boolean => {
  if (!uri) return false;
  return uri.startsWith('file://') || 
         uri.startsWith('content://') || 
         uri.startsWith('http://') || 
         uri.startsWith('https://');
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return '#28a745';
    case 'uploading': return '#007bff';
    case 'error': return '#dc3545';
    default: return '#6c757d';
  }
};

/**
 * Upload document to Google Cloud Storage
 * @param {Object} file - File object with uri, name, type, size
 * @param {string} userId - User ID for folder organization
 * @param {string} category - Document category
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export const uploadToGCS = async (file: any, userId: string, category: string, onProgress?: (progress: number) => void) => {
  try {
    const result = await uploadDocumentToGCS(file, userId, category, onProgress);
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete document from Google Cloud Storage
 * @param {string} gcsPath - GCS file path
 * @returns {Promise<boolean>} Success status
 */
export const deleteFromGCS = async (gcsPath: string) => {
  try {
    const result = await deleteDocumentFromGCS(gcsPath);
    return result;
  } catch (error) {
    throw error;
  }
};
