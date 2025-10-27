import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { DocumentManagementProps, UploadedDocument } from './types';
import DocumentManagement from './DocumentManagement';

interface MedicalDeductionManagementProps {
  applicationId: string;
  userId: string;
  token: string;
  initialDocuments: UploadedDocument[];
  onDocumentsUpdate: (documents: UploadedDocument[]) => void;
}

const MedicalDeductionManagement: React.FC<MedicalDeductionManagementProps> = ({
  applicationId,
  userId,
  token,
  initialDocuments,
  onDocumentsUpdate
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleManageDocuments = () => {
    setShowDocumentModal(true);
  };

  const handleUploadDocument = async (file: any) => {
    try {
      console.log('🔍 MedicalDeductionManagement.handleUploadDocument called with:', {
        userId: userId,
        fileName: file?.name,
        fileType: file?.type
      });

      // Use the existing uploadDocumentToGCS function
      const { uploadDocumentToGCS } = require('../../services/gcsService');
      
      const uploadResult = await uploadDocumentToGCS(
        file,
        userId,
        'medical_deduction',
        (progress) => {
          console.log(`Upload progress: ${progress}%`);
        },
        token
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload document');
      }

      const uploadedDoc: UploadedDocument = {
        id: uploadResult.id || Date.now().toString(),
        name: uploadResult.name || file.name,
        type: uploadResult.type || file.type,
        size: uploadResult.size || file.size,
        category: 'medical_deduction',
        gcsPath: uploadResult.gcsPath || '',
        publicUrl: uploadResult.publicUrl || '',
        status: 'completed' as const,
        uploadedAt: uploadResult.uploadedAt || new Date().toISOString()
      };
      
      const updatedDocuments = [...documents, uploadedDoc];
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
      
      Alert.alert('Success', 'Medical deduction document uploaded successfully.');
    } catch (error) {
      console.error('❌ Upload failed in MedicalDeductionManagement:', error);
      Alert.alert('Error', 'Failed to upload medical deduction document. Please try again.');
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      const ApiService = require('../../services/api').default;
      const response = await ApiService.makeRequest(`/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete document');
      }
      
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove medical deduction document. Please try again.');
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Medical Deductions</Text>
          <Text style={styles.subtitle}>
            Upload documents related to medical expenses and deductions
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Medical Deduction Documents Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="medical-outline" size={24} color="#e74c3c" />
                <Text style={styles.sectionTitle}>Medical Deduction Documents</Text>
              </View>
              <TouchableOpacity
                style={styles.manageDocumentsButton}
                onPress={handleManageDocuments}
              >
                <Ionicons name="document-outline" size={16} color="#007bff" />
                <Text style={styles.manageDocumentsText}>Manage Documents</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.documentsCard}>
              <Text style={styles.documentsCount}>
                {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
              </Text>
              <Text style={styles.documentsDescription}>
                Upload receipts, invoices, and other documents for medical expenses, prescription medications, doctor visits, and medical procedures.
              </Text>
            </View>

            {/* Quick Upload Button */}
            <TouchableOpacity
              style={styles.quickUploadButton}
              onPress={async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: ['image/*', 'application/pdf'],
                    copyToCacheDirectory: true,
                  });

                  if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    const file = {
                      uri: asset.uri,
                      name: asset.name,
                      type: asset.mimeType,
                      size: asset.size,
                    };
                    await handleUploadDocument(file);
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to pick document. Please try again.');
                }
              }}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#007bff" />
              <Text style={styles.quickUploadText}>Quick Upload Medical Document</Text>
            </TouchableOpacity>
          </View>

          {/* Information Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#e74c3c" />
              <Text style={styles.infoTitle}>About Medical Deductions</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                • Medical expenses may be deductible if they exceed 7.5% of your AGI{'\n'}
                • Keep receipts for all medical expenses{'\n'}
                • Include doctor visits, prescriptions, medical equipment{'\n'}
                • Health insurance premiums may also qualify
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Document Management Modal */}
        <Modal
          visible={showDocumentModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDocumentModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDocumentModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Medical Deduction Documents
              </Text>
            </View>
            
            <DocumentManagement
              documents={documents}
              onUploadDocument={handleUploadDocument}
              onRemoveDocument={handleRemoveDocument}
              isLoading={loading}
            />
          </View>
        </Modal>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  manageDocumentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageDocumentsText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 4,
  },
  documentsCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  documentsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentsDescription: {
    fontSize: 14,
    color: '#666',
  },
  quickUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe8e8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  quickUploadText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoContent: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 8,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MedicalDeductionManagement;
