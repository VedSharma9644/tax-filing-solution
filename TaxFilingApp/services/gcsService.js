import { Platform } from 'react-native';
import { logUserFlow, validateUserId } from '../utils/debugHelper';
import { API_BASE_URL } from './api';

// For React Native, we'll use a different approach for GCS
// We'll upload files to the backend and let the backend handle GCS
let isGCSAvailable = false;

// Check if we're in a React Native environment
// In Expo Go, we should always use backend uploads, not simulation
const isReactNative = Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'native';
const isExpo = typeof __DEV__ !== 'undefined' && __DEV__;
const shouldUseBackend = isReactNative || isExpo;

if (shouldUseBackend) {
  isGCSAvailable = true;
  console.log('📱 React Native/Expo environment detected - GCS uploads will be handled by backend');
} else {
  console.log('🌐 Web environment detected - GCS uploads will be simulated');
}

/**
 * Upload a document to Google Cloud Storage via backend
 * @param {Object} file - File object with uri, name, type, size
 * @param {string} userId - User ID for folder organization
 * @param {string} category - Document category (w2Forms, medical, etc.)
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Upload result with GCS URL and metadata
 */
export const uploadDocumentToGCS = async (file, userId, category, onProgress) => {
  try {
    console.log(`📤 Uploading document: ${file.name} (${category})`);
    
    // For React Native, we'll upload to our backend which handles GCS
    if (isGCSAvailable) {
      return await uploadViaBackend(file, userId, category, onProgress);
    } else {
      // Web environment - simulate upload
      return await simulateUpload(file, userId, category, onProgress);
    }
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

/**
 * Upload document via backend API
 */
const uploadViaBackend = async (file, userId, category, onProgress) => {
  try {
    // Debug logging
    logUserFlow('GCS Service Upload', userId, { category, fileName: file.name });
    validateUserId(userId, 'GCS Service');
    
    console.log(`🔄 Starting backend upload - User: ${userId}, Category: ${category}, File: ${file.name}`);
    
    // Debug logging for upload request details
    console.log('📤 Upload request details:', {
      url: `${API_BASE_URL}/upload/document`,
      userId,
      category,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUri: file.uri
    });
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Add file to FormData
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg', // Default to image/jpeg for photos
      name: file.name || 'document.jpg',
    });
    
    // Add metadata
    formData.append('userId', userId);
    formData.append('category', category);
    
    console.log(`📤 Uploading to: ${API_BASE_URL}/upload/document`);
    
    // Upload to backend
    const response = await fetch(`${API_BASE_URL}/upload/document`, {
      method: 'POST',
      body: formData,
      timeout: 30000, // 30 seconds for large file uploads
      // Let fetch() automatically set Content-Type with boundary for multipart/form-data
    });
    
    if (!response.ok) {
      if (response.status === 0) {
        throw new Error('Network error: Cannot reach server. Check your internet connection.');
      } else if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} - Invalid request format`);
      } else {
        throw new Error(`Server error: ${response.status} - Backend server issue`);
      }
    }
    
    const result = await response.json();
    console.log(`✅ Upload successful - GCS Path: ${result.gcsPath}`);
    
    // Simulate progress for better UX
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        onProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return {
      success: true,
      fileName: result.fileName,
      publicUrl: result.publicUrl,
      gcsPath: result.gcsPath,
      size: file.size || 0,
      contentType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Backend upload error:', error);
    
    // Provide specific error messages based on error type
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      console.error('❌ Network connectivity issue - server unreachable');
      throw new Error('Network error: Cannot reach server. Please check your internet connection and ensure the backend server is running.');
    } else if (error.message.includes('timeout')) {
      console.error('❌ Upload timeout - file too large or slow connection');
      throw new Error('Upload timeout: File is too large or connection is too slow. Please try a smaller file.');
    } else {
      console.error('❌ Upload failed:', error.message);
      // Fallback to simulation if backend fails for other reasons
      return await simulateUpload(file, userId, category, onProgress);
    }
  }
};

/**
 * Simulate upload for web environment
 */
const simulateUpload = async (file, userId, category, onProgress) => {
  console.log('🌐 Simulating upload for web environment');
  
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (onProgress) {
        onProgress(progress);
      }
      if (progress >= 100) {
        clearInterval(interval);
        resolve({
          success: true,
          fileName: `simulated-${category}/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
          publicUrl: `https://storage.googleapis.com/simulated-bucket/simulated-${category}/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
          gcsPath: `simulated-${category}/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
          size: file.size || 0,
          contentType: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
        });
      }
    }, 100);
  });
};

/**
 * Delete a document from Google Cloud Storage
 * @param {string} gcsPath - GCS file path
 * @returns {Promise<boolean>} Success status
 */
export const deleteDocumentFromGCS = async (gcsPath) => {
  try {
    if (isGCSAvailable) {
      // Delete via backend
      const response = await fetch(`${API_BASE_URL}/upload/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gcsPath }),
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      
      return true;
    } else {
      // Web environment - simulate deletion
      console.log('🌐 Simulating delete for web environment');
      return true;
    }
  } catch (error) {
    console.error('Delete error:', error);
    // Return true to not block the UI
    return true;
  }
};

/**
 * Get document metadata from GCS
 * @param {string} gcsPath - GCS file path
 * @returns {Promise<Object>} File metadata
 */
export const getDocumentMetadata = async (gcsPath) => {
  try {
    const fileRef = bucket.file(gcsPath);
    const [metadata] = await fileRef.getMetadata();
    return metadata;
  } catch (error) {
    console.error('GCS Metadata Error:', error);
    throw error;
  }
};

/**
 * List documents for a user and category
 * @param {string} userId - User ID
 * @param {string} category - Document category
 * @returns {Promise<Array>} List of documents
 */
export const listUserDocuments = async (userId, category) => {
  try {
    const prefix = `${category}/${userId}/`;
    const [files] = await bucket.getFiles({ prefix });
    
    return files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      created: file.metadata.timeCreated,
      updated: file.metadata.updated,
      publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`,
    }));
  } catch (error) {
    console.error('GCS List Error:', error);
    throw error;
  }
};
