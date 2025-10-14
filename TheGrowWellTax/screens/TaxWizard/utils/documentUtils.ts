import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
// ImagePicker import removed (camera functionality removed)
import { uploadDocumentToGCS, deleteDocumentFromGCS } from '../../../services/gcsService';

// Camera permission functionality removed

export const pickDocument = async (): Promise<DocumentPicker.DocumentPickerResult> => {
  return await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
};

// Camera functionality removed


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
export const uploadToGCS = async (file: any, userId: string, category: string, onProgress?: (progress: number) => void, token?: string) => {
  try {
    const result = await uploadDocumentToGCS(file, userId, category, onProgress, token);
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
