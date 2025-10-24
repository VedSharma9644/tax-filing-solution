import ApiService from '../../services/api';
import { uploadDocumentToGCS } from '../../services/gcsService';
import { Dependent, UploadedDocument } from './types';

class DependentsService {
  private apiService: typeof ApiService;

  constructor() {
    this.apiService = ApiService;
  }

  // Get all dependents for a specific application
  async getDependents(applicationId: string, token: string): Promise<Dependent[]> {
    try {
      const response = await this.apiService.makeRequest(`/tax-forms/${applicationId}/personal-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success && response.data) {
        return response.data.dependents.map((dependent: any) => ({
          id: dependent.id,
          name: dependent.name,
          relationship: dependent.relationship,
          dateOfBirth: dependent.dateOfBirth || dependent.dob,
          age: dependent.age,
          ssn: dependent.ssn,
          createdAt: dependent.createdAt || new Date().toISOString(),
          updatedAt: dependent.updatedAt
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching dependents:', error);
      throw new Error('Failed to fetch dependents');
    }
  }

  // Update dependents for a specific application
  async updateDependents(applicationId: string, dependents: Dependent[], token: string): Promise<void> {
    try {
      // Transform dependents to match backend expectations
      const backendDependents = dependents.map(dep => ({
        id: dep.id,
        name: dep.name,
        relationship: dep.relationship,
        dob: dep.dateOfBirth, // Backend expects 'dob' field
        age: dep.age,
        ssn: dep.ssn
      }));

      const response = await this.apiService.makeRequest(`/tax-forms/${applicationId}/update-personal-info`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dependents: backendDependents })
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update dependents');
      }
    } catch (error) {
      console.error('Error updating dependents:', error);
      throw new Error('Failed to update dependents');
    }
  }

  // Upload document for dependents
  async uploadDocument(
    userId: string,
    file: any, // React Native file object with uri, name, type, size
    token: string
  ): Promise<UploadedDocument> {
    try {
      console.log('🔍 DependentsService.uploadDocument called with:', {
        userId: userId,
        userIdType: typeof userId,
        userIdLength: userId?.length,
        fileName: file?.name,
        fileType: file?.type,
        tokenExists: !!token,
        tokenLength: token?.length
      });

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
      const uploadResult = await uploadDocumentToGCS(
        file,
        userId,
        'dependents',
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
        category: 'dependents',
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

  // Get dependents documents
  async getDependentsDocuments(userId: string, token: string): Promise<UploadedDocument[]> {
    try {
      const response = await this.apiService.makeRequest('/documents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.success && response.data) {
        return response.data.filter((doc: any) => doc.category === 'dependents');
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching dependents documents:', error);
      throw new Error('Failed to fetch dependents documents');
    }
  }

  // Delete document
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

  // Validate dependent data
  validateDependent(dependent: Partial<Dependent>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dependent.name?.trim()) {
      errors.push('Name is required');
    }

    if (!dependent.relationship?.trim()) {
      errors.push('Relationship is required');
    }

    if (!dependent.dateOfBirth?.trim()) {
      errors.push('Date of birth is required');
    }

    if (!dependent.age?.trim()) {
      errors.push('Age is required');
    }

    if (dependent.age && isNaN(parseInt(dependent.age))) {
      errors.push('Age must be a valid number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate unique dependent ID
  generateDependentId(): string {
    return `dependent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new DependentsService();
