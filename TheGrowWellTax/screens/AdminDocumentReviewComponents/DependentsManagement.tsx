import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DependentsManagementProps, Dependent, UploadedDocument } from './types';
import DependentsService from './DependentsService';
import DependentForm from './DependentForm';
import DocumentManagement from './DocumentManagement';

const DependentsManagement: React.FC<DependentsManagementProps> = ({
  applicationId,
  userId,
  token,
  initialDependents,
  initialDocuments,
  onDependentsUpdate,
  onDocumentsUpdate
}) => {
  const [dependents, setDependents] = useState<Dependent[]>(initialDependents);
  const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);

  useEffect(() => {
    setDependents(initialDependents);
  }, [initialDependents]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleAddDependent = () => {
    setEditingDependent(null);
    setShowFormModal(true);
  };

  const handleEditDependent = (dependent: Dependent) => {
    setEditingDependent(dependent);
    setShowFormModal(true);
  };

  const handleDeleteDependent = (dependent: Dependent) => {
    Alert.alert(
      'Delete Dependent',
      `Are you sure you want to delete ${dependent.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedDependents = dependents.filter(dep => dep.id !== dependent.id);
              await DependentsService.updateDependents(applicationId, updatedDependents, token);
              setDependents(updatedDependents);
              onDependentsUpdate(updatedDependents);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete dependent. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      const newDependent: Dependent = {
        id: editingDependent?.id || DependentsService.generateDependentId(),
        name: formData.name,
        relationship: formData.relationship,
        dateOfBirth: formData.dateOfBirth,
        age: formData.age,
        ssn: formData.ssn,
        createdAt: editingDependent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedDependents: Dependent[];
      
      if (editingDependent) {
        updatedDependents = dependents.map(dep => 
          dep.id === editingDependent.id ? newDependent : dep
        );
      } else {
        updatedDependents = [...dependents, newDependent];
      }

      await DependentsService.updateDependents(applicationId, updatedDependents, token);
      setDependents(updatedDependents);
      onDependentsUpdate(updatedDependents);
      setShowFormModal(false);
      setEditingDependent(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save dependent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setEditingDependent(null);
  };

  const handleManageDocuments = () => {
    setShowDocumentModal(true);
  };

  const handleUploadDocument = async (file: any) => {
    try {
      console.log('🔍 DependentsManagement.handleUploadDocument called with:', {
        userId: userId,
        userIdType: typeof userId,
        userIdLength: userId?.length,
        token: token,
        tokenType: typeof token,
        tokenLength: token?.length,
        fileName: file?.name,
        fileType: file?.type
      });

      console.log('📤 Calling DependentsService.uploadDocument...');
      const uploadedDoc = await DependentsService.uploadDocument(userId, file, token);
      
      console.log('✅ Upload successful, updating documents state...');
      console.log('📄 Uploaded document:', uploadedDoc);
      
      const updatedDocuments = [...documents, uploadedDoc];
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
      
      console.log('✅ Documents state updated successfully');
      Alert.alert('Success', 'Document uploaded successfully.');
    } catch (error) {
      console.error('❌ Upload failed in DependentsManagement:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await DependentsService.deleteDocument(documentId, token);
      
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove document. Please try again.');
    }
  };

  const renderDependentItem = (dependent: Dependent) => (
    <View key={dependent.id} style={styles.dependentItem}>
      <View style={styles.dependentInfo}>
        <View style={styles.dependentHeader}>
          <Text style={styles.dependentName}>{dependent.name}</Text>
          <Text style={styles.dependentRelationship}>{dependent.relationship}</Text>
        </View>
        <View style={styles.dependentDetails}>
          <Text style={styles.dependentDetail}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            {' '}DOB: {dependent.dateOfBirth}
          </Text>
          <Text style={styles.dependentDetail}>
            <Ionicons name="person-outline" size={14} color="#666" />
            {' '}Age: {dependent.age}
          </Text>
          {dependent.ssn && (
            <Text style={styles.dependentDetail}>
              <Ionicons name="card-outline" size={14} color="#666" />
              {' '}SSN: {dependent.ssn}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.dependentActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditDependent(dependent)}
        >
          <Ionicons name="pencil" size={16} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDependent(dependent)}
        >
          <Ionicons name="trash" size={16} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dependents Management</Text>
        <Text style={styles.subtitle}>
          Manage your dependents information and supporting documents
        </Text>
      </View>

      {/* Add Dependent Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddDependent}>
        <Ionicons name="add-circle" size={20} color="#28a745" />
        <Text style={styles.addButtonText}>Add Dependent</Text>
      </TouchableOpacity>

      {/* Dependents List */}
      <View style={styles.dependentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Dependents ({dependents.length})
          </Text>
          <TouchableOpacity
            style={styles.manageDocumentsButton}
            onPress={handleManageDocuments}
          >
            <Ionicons name="document-outline" size={16} color="#007bff" />
            <Text style={styles.manageDocumentsText}>Manage Documents</Text>
          </TouchableOpacity>
        </View>

        {dependents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No dependents added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first dependent to get started
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.dependentsList} showsVerticalScrollIndicator={false}>
            {dependents.map(renderDependentItem)}
          </ScrollView>
        )}
      </View>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <DependentForm
          initialData={editingDependent ? {
            name: editingDependent.name,
            relationship: editingDependent.relationship,
            dateOfBirth: editingDependent.dateOfBirth,
            age: editingDependent.age,
            ssn: editingDependent.ssn || ''
          } : undefined}
          isEditMode={!!editingDependent}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={loading}
          onUploadDocument={handleUploadDocument}
          documents={documents.filter(doc => doc.category === 'dependents')}
          onRemoveDocument={handleRemoveDocument}
        />
      </Modal>

      {/* Document Management Modal */}
      <Modal
        visible={showDocumentModal}
        animationType="slide"
        presentationStyle="pageSheet"
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
              Dependents Documents
            </Text>
          </View>
          
          <DocumentManagement
            documents={documents.filter(doc => doc.category === 'dependents')}
            onUploadDocument={handleUploadDocument}
            onRemoveDocument={handleRemoveDocument}
            isLoading={loading}
          />
        </View>
      </Modal>
    </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28a745',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginLeft: 8,
  },
  dependentsSection: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  dependentsList: {
    maxHeight: 400,
  },
  dependentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dependentInfo: {
    flex: 1,
  },
  dependentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dependentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  dependentRelationship: {
    fontSize: 14,
    color: '#007bff',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dependentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dependentDetail: {
    fontSize: 12,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dependentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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

export default DependentsManagement;
