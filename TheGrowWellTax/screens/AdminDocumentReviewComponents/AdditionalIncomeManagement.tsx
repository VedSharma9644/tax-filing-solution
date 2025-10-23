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
import { AdditionalIncomeManagementProps, AdditionalIncomeSource } from './types';
import AdditionalIncomeService from './AdditionalIncomeService';
import IncomeSourceForm from './IncomeSourceForm';
import DocumentManagement from './DocumentManagement';

const AdditionalIncomeManagement: React.FC<AdditionalIncomeManagementProps> = ({
  applicationId,
  userId,
  token,
  initialIncomeSources,
  initialDocuments,
  onIncomeSourcesUpdate,
  onDocumentsUpdate
}) => {
  const [incomeSources, setIncomeSources] = useState<AdditionalIncomeSource[]>(initialIncomeSources);
  const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingIncomeSource, setEditingIncomeSource] = useState<AdditionalIncomeSource | null>(null);

  useEffect(() => {
    setIncomeSources(initialIncomeSources);
  }, [initialIncomeSources]);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleAddIncomeSource = () => {
    setEditingIncomeSource(null);
    setShowFormModal(true);
  };

  const handleEditIncomeSource = (incomeSource: AdditionalIncomeSource) => {
    setEditingIncomeSource(incomeSource);
    setShowFormModal(true);
  };

  const handleDeleteIncomeSource = (incomeSource: AdditionalIncomeSource) => {
    Alert.alert(
      'Delete Income Source',
      `Are you sure you want to delete "${incomeSource.source}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const updatedSources = incomeSources.filter(source => source.id !== incomeSource.id);
              await AdditionalIncomeService.updateAdditionalIncomeSources(applicationId, updatedSources, token);
              setIncomeSources(updatedSources);
              onIncomeSourcesUpdate(updatedSources);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete income source. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setLoading(true);
      
      const newIncomeSource: AdditionalIncomeSource = {
        id: editingIncomeSource?.id || AdditionalIncomeService.generateIncomeSourceId(),
        source: formData.source,
        amount: formData.amount,
        description: formData.description,
        createdAt: editingIncomeSource?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedSources: AdditionalIncomeSource[];
      
      if (editingIncomeSource) {
        // Update existing
        updatedSources = incomeSources.map(source => 
          source.id === editingIncomeSource.id ? newIncomeSource : source
        );
      } else {
        // Add new
        updatedSources = [...incomeSources, newIncomeSource];
      }

      await AdditionalIncomeService.updateAdditionalIncomeSources(applicationId, updatedSources, token);
      setIncomeSources(updatedSources);
      onIncomeSourcesUpdate(updatedSources);
      setShowFormModal(false);
      setEditingIncomeSource(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save income source. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowFormModal(false);
    setEditingIncomeSource(null);
  };

  const handleManageDocuments = (incomeSource: AdditionalIncomeSource) => {
    setSelectedIncomeSource(incomeSource);
    setShowDocumentModal(true);
  };

  const handleUploadDocument = async (file: any) => {
    try {
      console.log('🔍 AdditionalIncomeManagement.handleUploadDocument called with:', {
        userId: userId,
        userIdType: typeof userId,
        userIdLength: userId?.length,
        token: token,
        tokenType: typeof token,
        tokenLength: token?.length,
        fileName: file?.name,
        fileType: file?.type
      });

      const uploadedDoc = await AdditionalIncomeService.uploadDocument(userId, file, token);
      
      const updatedDocuments = [...documents, uploadedDoc];
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await AdditionalIncomeService.deleteDocument(documentId, token);
      
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsUpdate(updatedDocuments);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove document. Please try again.');
    }
  };

  const formatAmount = (amount: string): string => {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? '$0.00' : `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const renderIncomeSourceItem = (incomeSource: AdditionalIncomeSource) => (
    <View key={incomeSource.id} style={styles.incomeSourceItem}>
      <View style={styles.incomeSourceHeader}>
        <View style={styles.incomeSourceInfo}>
          <Text style={styles.incomeSourceTitle} numberOfLines={1}>
            {incomeSource.source}
          </Text>
          <Text style={styles.incomeSourceAmount}>
            {formatAmount(incomeSource.amount)}
          </Text>
        </View>
        <View style={styles.incomeSourceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditIncomeSource(incomeSource)}
          >
            <Ionicons name="pencil-outline" size={18} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleManageDocuments(incomeSource)}
          >
            <Ionicons name="document-outline" size={18} color="#28a745" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteIncomeSource(incomeSource)}
          >
            <Ionicons name="trash-outline" size={18} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>
      
      {incomeSource.description && (
        <Text style={styles.incomeSourceDescription} numberOfLines={2}>
          {incomeSource.description}
        </Text>
      )}
      
      <View style={styles.incomeSourceFooter}>
        <Text style={styles.createdDate}>
          Added {new Date(incomeSource.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Additional Income Sources</Text>
        <Text style={styles.subtitle}>
          Manage additional income sources and their supporting documents
        </Text>
      </View>

      {/* Income Sources List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {incomeSources.length > 0 ? (
          <View style={styles.incomeSourcesList}>
            {incomeSources.map(renderIncomeSourceItem)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No additional income sources</Text>
            <Text style={styles.emptyStateSubtext}>
              Add income sources to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddIncomeSource}
          disabled={loading}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Income Source</Text>
        </TouchableOpacity>
      </View>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <IncomeSourceForm
          initialData={editingIncomeSource ? {
            source: editingIncomeSource.source,
            amount: editingIncomeSource.amount,
            description: editingIncomeSource.description || ''
          } : undefined}
          isEditMode={!!editingIncomeSource}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={loading}
          onUploadDocument={handleUploadDocument}
          documents={documents}
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
              Additional Income Documents
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  incomeSourcesList: {
    gap: 12,
  },
  incomeSourceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  incomeSourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  incomeSourceInfo: {
    flex: 1,
    marginRight: 12,
  },
  incomeSourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  incomeSourceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  incomeSourceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  incomeSourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  incomeSourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentCount: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
});

export default AdditionalIncomeManagement;
