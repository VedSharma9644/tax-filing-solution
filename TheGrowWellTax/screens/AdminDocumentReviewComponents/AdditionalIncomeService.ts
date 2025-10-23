import ApiService from '../../services/api';
import { uploadDocumentToGCS } from '../../services/gcsService';
import { AdditionalIncomeSource, UploadedDocument } from './types';

class AdditionalIncomeService {
  private apiService: typeof ApiService;

  constructor() {
    this.apiService = ApiService;
  }

  /**
   * Fetch additional income sources for a specific application
   */
  async getAdditionalIncomeSources(applicationId: string): Promise<AdditionalIncomeSource[]> {
    try {
      const response = await this.apiService.makeRequest(`/tax-forms/${applicationId}`);
      
      if (response.success && response.data) {
        return response.data.additionalIncomeSources || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching additional income sources:', error);
      throw new Error('Failed to fetch additional income sources');
    }
  }

  /**
   * Update additional income sources for an application
   */
  async updateAdditionalIncomeSources(
    applicationId: string,
    incomeSources: AdditionalIncomeSource[],
    token: string
  ): Promise<void> {
    try {
      const updateData = {
        additionalIncomeSources: incomeSources.map(source => ({
          id: source.id,
          source: source.source,
          amount: source.amount,
          description: source.description || '',
          documents: source.documents || []
        }))
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
        throw new Error(response.error || 'Failed to update additional income sources');
      }
    } catch (error) {
      console.error('Error updating additional income sources:', error);
      throw new Error('Failed to update additional income sources');
    }
  }

  /**
   * Upload a document for additional income (linked to application, not specific income source)
   */
  async uploadDocument(
    userId: string,
    file: any, // React Native file object with uri, name, type, size
    token: string
  ): Promise<UploadedDocument> {
    try {
      console.log('🔍 AdditionalIncomeService.uploadDocument called with:', {
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

      // Use the existing GCS service for document upload
      const uploadResult = await uploadDocumentToGCS(
        file,
        userId,
        'additional_income',
        (progress) => {
          // Handle progress if needed
          console.log(`Upload progress: ${progress}%`);
        },
        token
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload document');
      }

      return {
        id: uploadResult.id || Date.now().toString(),
        name: uploadResult.name || file.name,
        type: uploadResult.type || file.type,
        size: uploadResult.size || file.size,
        category: 'additional_income',
        gcsPath: uploadResult.gcsPath || '',
        publicUrl: uploadResult.publicUrl || '',
        status: 'completed',
        uploadedAt: uploadResult.uploadedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  /**
   * Get all additional income documents for an application
   */
  async getAdditionalIncomeDocuments(userId: string, token: string): Promise<UploadedDocument[]> {
    try {
      const response = await this.apiService.makeRequest('/documents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success && response.data) {
        // Filter documents by additional_income category
        return response.data.filter((doc: any) => doc.category === 'additional_income');
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching additional income documents:', error);
      throw new Error('Failed to fetch additional income documents');
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
   * Validate income source data
   */
  validateIncomeSource(data: Partial<AdditionalIncomeSource>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.source || data.source.trim() === '') {
      errors.push('Income source is required');
    }

    if (!data.amount || data.amount.trim() === '') {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount < 0) {
        errors.push('Amount must be a valid positive number');
      }
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a unique ID for new income sources
   */
  generateIncomeSourceId(): string {
    return `income_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new AdditionalIncomeService();
