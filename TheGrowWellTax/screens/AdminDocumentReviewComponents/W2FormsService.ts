import ApiService from '../../services/api';
import { uploadDocumentToGCS } from '../../services/gcsService';
import { UploadedDocument } from './types';

class W2FormsService {
  private apiService: typeof ApiService;

  constructor() {
    this.apiService = ApiService;
  }

  /**
   * Upload a W-2 form document
   */
  async uploadDocument(
    userId: string,
    file: any, // React Native file object with uri, name, type, size
    token: string
  ): Promise<UploadedDocument> {
    try {
      console.log('🔍 W2FormsService.uploadDocument called with:', {
        userId: userId,
        userIdType: typeof userId,
        userIdLength: userId?.length,
        fileName: file?.name,
        fileType: file?.type,
        tokenExists: !!token,
        tokenLength: token?.length
      });

      // Validate parameters
      if (!userId) {
        throw new Error('userId is required for document upload');
      }
      if (!file) {
        throw new Error('file is required for document upload');
      }
      if (!token) {
        throw new Error('token is required for document upload');
      }

      console.log('📤 Calling uploadDocumentToGCS...');
      // Use the existing GCS service for document upload
      const uploadResult = await uploadDocumentToGCS(
        file,
        userId,
        'w2_forms',
        (progress) => {
          console.log(`Upload progress: ${progress}%`);
        },
        token
      );

      console.log('📤 uploadDocumentToGCS result:', uploadResult);

      if (!uploadResult.success) {
        console.error('❌ Upload failed:', uploadResult.error);
        throw new Error(uploadResult.error || 'Failed to upload document');
      }

      console.log('✅ Upload successful, creating document object...');
      const document: UploadedDocument = {
        id: uploadResult.id || Date.now().toString(),
        name: uploadResult.name || file.name,
        type: uploadResult.type || file.type,
        size: uploadResult.size || file.size,
        category: 'w2_forms',
        gcsPath: uploadResult.gcsPath || '',
        publicUrl: uploadResult.publicUrl || '',
        status: 'completed' as const,
        uploadedAt: uploadResult.uploadedAt || new Date().toISOString()
      };

      console.log('📄 Created document object:', document);
      return document;
    } catch (error) {
      console.error('Error uploading W-2 form:', error);
      throw new Error('Failed to upload W-2 form');
    }
  }

  /**
   * Get all W-2 form documents for a user
   */
  async getW2FormsDocuments(userId: string, token: string): Promise<UploadedDocument[]> {
    try {
      const response = await this.apiService.makeRequest('/documents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success && response.data) {
        // Filter documents by w2_forms category
        return response.data.filter((doc: any) => doc.category === 'w2_forms');
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching W-2 form documents:', error);
      throw new Error('Failed to fetch W-2 form documents');
    }
  }

  /**
   * Delete a W-2 form document
   */
  async deleteDocument(documentId: string, token: string): Promise<void> {
    try {
      const response = await this.apiService.makeRequest(`/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting W-2 form:', error);
      throw new Error('Failed to delete W-2 form');
    }
  }

  /**
   * Validate W-2 form file
   */
  validateW2FormFile(file: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!file) {
      errors.push('File is required');
    } else {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        errors.push('File must be PDF, JPG, or PNG format');
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size && file.size > maxSize) {
        errors.push('File size must be less than 10MB');
      }

      // Check file name
      if (!file.name || file.name.trim() === '') {
        errors.push('File name is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new W2FormsService();

