import ApiService from '../../services/api';
import { uploadDocumentToGCS } from '../../services/gcsService';
import { UploadedDocument } from './types';

class PersonalInfoService {
  private apiService: typeof ApiService;

  constructor() {
    this.apiService = ApiService;
  }

  /**
   * Update Social Security Number for a specific application
   */
  async updateSsn(applicationId: string, ssn: string, token: string): Promise<void> {
    try {
      console.log('🔍 PersonalInfoService.updateSsn called with:', {
        applicationId: applicationId,
        ssnLength: ssn?.length,
        tokenExists: !!token
      });

      // Validate SSN format (9 digits)
      const cleanSsn = ssn.replace(/\D/g, '');
      if (cleanSsn.length !== 9) {
        throw new Error('Social Security Number must be exactly 9 digits');
      }

      const updateData = {
        socialSecurityNumber: cleanSsn
      };

      const response = await this.apiService.makeRequest(
        `/tax-forms/${applicationId}/update-personal-info`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to update Social Security Number');
      }

      console.log('✅ SSN updated successfully');
    } catch (error) {
      console.error('Error updating SSN:', error);
      throw new Error('Failed to update Social Security Number');
    }
  }

  /**
   * Get current Social Security Number for an application
   */
  async getSsn(applicationId: string, token: string): Promise<string> {
    try {
      const response = await this.apiService.makeRequest(`/tax-forms/${applicationId}/personal-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success && response.data) {
        return response.data.socialSecurityNumber || '';
      }
      
      return '';
    } catch (error) {
      console.error('Error fetching SSN:', error);
      throw new Error('Failed to fetch Social Security Number');
    }
  }

  /**
   * Upload a document for personal information
   */
  async uploadDocument(
    userId: string,
    file: any, // React Native file object with uri, name, type, size
    token: string
  ): Promise<UploadedDocument> {
    try {
      console.log('🔍 PersonalInfoService.uploadDocument called with:', {
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
        'personal_info',
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
        category: 'personal_info',
        gcsPath: uploadResult.gcsPath || '',
        publicUrl: uploadResult.publicUrl || '',
        status: 'completed' as const,
        uploadedAt: uploadResult.uploadedAt || new Date().toISOString()
      };

      console.log('📄 Created document object:', document);
      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Get all personal information documents for a user
   */
  async getPersonalInfoDocuments(userId: string, token: string): Promise<UploadedDocument[]> {
    try {
      const response = await this.apiService.makeRequest('/documents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success && response.data) {
        // Filter documents by personal_info category
        return response.data.filter((doc: any) => doc.category === 'personal_info');
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching personal info documents:', error);
      throw new Error('Failed to fetch personal information documents');
    }
  }

  /**
   * Delete a document
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
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  /**
   * Validate SSN format
   */
  validateSsn(ssn: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!ssn || ssn.trim() === '') {
      errors.push('Social Security Number is required');
    } else {
      const cleanSsn = ssn.replace(/\D/g, '');
      if (cleanSsn.length !== 9) {
        errors.push('Social Security Number must be exactly 9 digits');
      }
      
      // Check for invalid patterns
      if (cleanSsn === '000000000' || cleanSsn === '111111111' || cleanSsn === '123456789') {
        errors.push('Please enter a valid Social Security Number (not placeholder values)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new PersonalInfoService();
