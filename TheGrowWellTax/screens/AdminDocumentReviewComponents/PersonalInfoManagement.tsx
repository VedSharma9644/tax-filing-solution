import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { PersonalInfoManagementProps, UploadedDocument } from './types';
import PersonalInfoService from './PersonalInfoService';
import DocumentManagement from './DocumentManagement';

const PersonalInfoManagement: React.FC<PersonalInfoManagementProps> = ({
  applicationId,
  userId,
  token,
  initialSsn,
  initialDocuments,
  onSsnUpdate,
  onDocumentsUpdate
}) => {
  const [ssn, setSsn] = useState(initialSsn || '');
  const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [showSsnModal, setShowSsnModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [ssnInput, setSsnInput] = useState('');

  useEffect(() => {
    setSsn(initialSsn || '');
  }, [initialSsn]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleEditSsn = () => {
    setSsnInput(ssn);
    setShowSsnModal(true);
  };

  const handleSaveSsn = async () => {
    if (!ssnInput.trim()) {
      Alert.alert('Error', 'Please enter a valid Social Security Number.');
      return;
    }

    try {
      setLoading(true);
      await PersonalInfoService.updateSsn(applicationId, ssnInput, token);
      setSsn(ssnInput);
      onSsnUpdate(ssnInput);
      setShowSsnModal(false);
      Alert.alert('Success', 'Social Security Number updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update Social Security Number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSsn = () => {
    setShowSsnModal(false);
    setSsnInput(ssn);
  };

  const handleManageDocuments = () => {
    setShowDocumentModal(true);
  };

  const handleUploadDocument = async (file: any) => {
    try {
      console.log('🔍 PersonalInfoManagement.handleUploadDocument called with:', {
        userId: userId,
        fileName: file?.name,
        fileType: file?.type
      });

      const uploadedDoc = await PersonalInfoService.uploadDocument(userId, file, token);
      
      const updatedDocuments = [...documents, uploadedDoc];
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
      
      Alert.alert('Success', 'Document uploaded successfully.');
    } catch (error) {
      console.error('❌ Upload failed in PersonalInfoManagement:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await PersonalInfoService.deleteDocument(documentId, token);
      
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove document. Please try again.');
    }
  };

  const formatSsn = (ssn: string): string => {
    if (!ssn) return 'Not provided';
    
    // Handle placeholder/invalid SSNs
    if (ssn === '000000000' || ssn === '111111111' || ssn === '123456789') {
      return 'Not provided';
    }
    
    // Show only last 4 digits for security
    return `***-**-${ssn.slice(-4)}`;
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>
          Manage your Social Security Number and supporting documents
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SSN Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="card-outline" size={24} color="#007bff" />
              <Text style={styles.sectionTitle}>Social Security Number</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditSsn}
            >
              <Ionicons name="pencil" size={16} color="#007bff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.ssnCard}>
            <Text style={styles.ssnLabel}>Current SSN:</Text>
            <Text style={styles.ssnValue}>{formatSsn(ssn)}</Text>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="document-outline" size={24} color="#28a745" />
              <Text style={styles.sectionTitle}>Supporting Documents</Text>
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
              Upload personal documents like driver's license, passport, etc.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* SSN Edit Modal */}
      <Modal
        visible={showSsnModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelSsn}
      >
        <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCancelSsn}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Social Security Number</Text>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Social Security Number *</Text>
                <TextInput
                  style={styles.input}
                  value={ssnInput}
                  onChangeText={setSsnInput}
                  placeholder="XXX-XX-XXXX"
                  keyboardType="numeric"
                  maxLength={11}
                />
                <Text style={styles.description}>
                  Enter your 9-digit Social Security Number
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSsn}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveSsn}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save SSN'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
      </Modal>

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
              Personal Information Documents
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 4,
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
  ssnCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  ssnLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ssnValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  documentsCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
});

export default PersonalInfoManagement;
