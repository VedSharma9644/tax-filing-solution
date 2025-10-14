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
export const uploadDocumentToGCS = async (file, userId, category, onProgress, token) => {
  try {
    console.log(`📤 Uploading document: ${file.name} (${category})`);
    
    // For React Native, we'll upload to our backend which handles GCS
    if (isGCSAvailable) {
      return await uploadViaBackend(file, userId, category, onProgress, token);
    } else {
      // Web environment - throw error instead of simulation
      throw new Error('File upload not supported in web environment. Please use the mobile app.');
    }
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

/**
 * Upload document via backend API
 */
const uploadViaBackend = async (file, userId, category, onProgress, token) => {
  try {
    // Debug logging
    logUserFlow('GCS Service Upload', userId, { category, fileName: file.name });
    validateUserId(userId, 'GCS Service');
    
    console.log(`🔄 Starting backend upload - User: ${userId}, Category: ${category}, File: ${file.name}`);
    console.log('🔐 Debug - Token in gcsService:', token ? `Token exists (${token.length} chars)` : 'Token is null/undefined');
    
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
    const fileData = {
      uri: file.uri,
      type: file.type || file.mimeType || 'image/jpeg', // Default to image/jpeg for photos
      name: file.name || file.fileName || 'document.jpg',
    };
    
    console.log('📤 File data for FormData:', fileData);
    formData.append('file', fileData);
    
    // Add metadata
    formData.append('userId', userId);
    formData.append('category', category);
    
    // Calculate estimated FormData size
    const estimatedSize = (fileData.size || 0) + (userId?.length || 0) + (category?.length || 0) + 1000; // Rough estimate
    console.log(`📊 Estimated upload size: ${(estimatedSize / 1024).toFixed(2)} KB`);
    
    console.log(`📤 Uploading to: ${API_BASE_URL}/upload/document`);
    
    // Upload to backend
    const startTime = Date.now();
    console.log('🌐 Starting fetch request to:', `${API_BASE_URL}/upload/document`);
    console.log('⏱️ Upload started at:', new Date().toISOString());
    
    const response = await fetch(`${API_BASE_URL}/upload/document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      timeout: 60000, // 60 seconds for large photo uploads
      // Let fetch() automatically set Content-Type with boundary for multipart/form-data
    });
    
    const endTime = Date.now();
    const uploadDuration = (endTime - startTime) / 1000;
    
    console.log('📡 Upload response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${uploadDuration.toFixed(2)}s`
    });
    
    if (!response.ok) {
      console.error('❌ Upload failed with status:', response.status);
      console.error('❌ Response status text:', response.statusText);
      
      // Try to get detailed error message from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || errorData.details || '';
        console.error('❌ Server error details:', errorDetails);
      } catch (e) {
        console.error('❌ Could not parse error response');
      }
      
      if (response.status === 0) {
        console.error('❌ Network connectivity issue - server unreachable');
        throw new Error(`🌐 NETWORK ERROR: Cannot reach server. Check your internet connection.`);
      } else if (response.status === 401) {
        console.error('❌ Authentication error');
        throw new Error(`🔐 AUTH ERROR: ${response.status} - Authentication failed. Please login again. ${errorDetails}`);
      } else if (response.status === 403) {
        console.error('❌ Permission error');
        throw new Error(`🚫 PERMISSION ERROR: ${response.status} - Access denied. ${errorDetails}`);
      } else if (response.status >= 400 && response.status < 500) {
        console.error('❌ Client error - likely file format or size issue');
        throw new Error(`📱 CLIENT ERROR: ${response.status} - ${response.statusText}. ${errorDetails}`);
      } else {
        console.error('❌ Server error - backend processing issue');
        throw new Error(`🖥️ SERVER ERROR: ${response.status} - ${response.statusText}. ${errorDetails}`);
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
    console.error('❌ Backend upload error:', error);
    console.error('❌ Error type:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Provide specific error messages based on error type
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      console.error('❌ Network connectivity issue - server unreachable');
      throw new Error('Network error: Cannot reach server. Please check your internet connection and ensure the backend server is running.');
    } else if (error.message.includes('timeout')) {
      console.error('❌ Upload timeout - file too large or slow connection');
      throw new Error('Upload timeout: File is too large or connection is too slow. Please try a smaller file.');
    } else {
      console.error('❌ Upload failed:', error.message);
      // Re-throw the error instead of falling back to simulation
      throw error;
    }
  }
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
      // Web environment - throw error instead of simulation
      throw new Error('File deletion not supported in web environment. Please use the mobile app.');
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
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
