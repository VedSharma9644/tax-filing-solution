import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentManagementProps, UploadedDocument } from './types';

const DocumentManagement: React.FC<DocumentManagementProps> = ({
  documents,
  onUploadDocument,
  onRemoveDocument,
  isLoading = false
}) => {
  const [uploading, setUploading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Create a File-like object for the API
        const file = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
          size: asset.size,
        } as any;

        setUploading(true);
        await onUploadDocument(file);
        setUploading(false);
      }
    } catch (error) {
      setUploading(false);
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveDocument(documentId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove document. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return 'document-text-outline';
    if (type.includes('image')) return 'image-outline';
    return 'document-outline';
  };

  const renderDocumentItem = (doc: UploadedDocument) => (
    <View key={doc.id} style={styles.documentItem}>
      <View style={styles.documentInfo}>
        <View style={styles.documentIcon}>
          <Ionicons 
            name={getFileIcon(doc.type) as any} 
            size={24} 
            color="#007bff" 
          />
        </View>
        <View style={styles.documentDetails}>
          <Text style={styles.documentName} numberOfLines={1}>
            {doc.name}
          </Text>
          <Text style={styles.documentMeta}>
            {formatFileSize(doc.size)} • {doc.status}
          </Text>
        </View>
      </View>
      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveDocument(doc.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supporting Documents</Text>
        <Text style={styles.subtitle}>
          Upload documents that support this income source (W-2s, 1099s, receipts, etc.)
        </Text>
      </View>

      {/* Documents List */}
      {documents.length > 0 && (
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>
            Documents ({documents.length})
          </Text>
          <ScrollView style={styles.documentsList} showsVerticalScrollIndicator={false}>
            {documents.map(renderDocumentItem)}
          </ScrollView>
        </View>
      )}

      {/* Upload Button */}
      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={[styles.uploadButton, (isLoading || uploading) && styles.uploadButtonDisabled]}
          onPress={handlePickDocument}
          disabled={isLoading || uploading}
        >
          {(isLoading || uploading) ? (
            <ActivityIndicator color="#007bff" size="small" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color="#007bff" />
          )}
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.uploadHint}>
          Supported formats: PDF, JPG, PNG (Max 10MB)
        </Text>
      </View>

      {/* Empty State */}
      {documents.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No documents uploaded yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Upload supporting documents for this income source
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  documentsSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  documentsList: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  uploadSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
    marginBottom: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DocumentManagement;
