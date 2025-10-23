import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { IncomeSourceFormProps, COMMON_INCOME_SOURCES } from './types';

const IncomeSourceForm: React.FC<IncomeSourceFormProps> = ({
  initialData,
  isEditMode,
  onSubmit,
  onCancel,
  isLoading = false,
  onUploadDocument,
  documents = [],
  onRemoveDocument
}) => {
  const [formData, setFormData] = useState({
    source: initialData?.source || '',
    amount: initialData?.amount || '',
    description: initialData?.description || '',
    customSource: initialData?.customSource || ''
  });

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        source: initialData.source || '',
        amount: initialData.amount || '',
        description: initialData.description || '',
        customSource: initialData.customSource || ''
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.source.trim()) {
      newErrors.source = 'Income source is required';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount < 0) {
        newErrors.amount = 'Amount must be a valid positive number';
      }
    }

    if (formData.source === 'Other' && !formData.customSource.trim()) {
      newErrors.customSource = 'Custom income source is required';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const finalSource = formData.source === 'Other' ? formData.customSource : formData.source;
      
      await onSubmit({
        source: finalSource,
        amount: formData.amount,
        description: formData.description,
        customSource: formData.customSource
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save income source. Please try again.');
    }
  };

  const handleSourceSelect = (source: string) => {
    setFormData(prev => ({ ...prev, source }));
    setShowSourcePicker(false);
    
    // Clear custom source if not "Other"
    if (source !== 'Other') {
      setFormData(prev => ({ ...prev, customSource: '' }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Income Source' : 'Add Income Source'}
        </Text>
        <Text style={styles.subtitle}>
          {isEditMode ? 'Update the income source details' : 'Enter details for the new income source'}
        </Text>
      </View>

      {/* Income Source */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Income Source *</Text>
        <TouchableOpacity
          style={[styles.pickerContainer, errors.source && styles.errorInput]}
          onPress={() => setShowSourcePicker(true)}
        >
          <Text style={[styles.pickerText, !formData.source && styles.placeholderText]}>
            {formData.source || 'Select income source'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {errors.source && <Text style={styles.errorText}>{errors.source}</Text>}
      </View>

      {/* Custom Income Source */}
      {formData.source === 'Other' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Custom Income Source *</Text>
          <TextInput
            style={[styles.input, errors.customSource && styles.errorInput]}
            value={formData.customSource}
            onChangeText={(text) => setFormData(prev => ({ ...prev, customSource: text }))}
            placeholder="Enter custom income source"
            placeholderTextColor="#999"
          />
          {errors.customSource && <Text style={styles.errorText}>{errors.customSource}</Text>}
        </View>
      )}

      {/* Income Amount */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Amount *</Text>
        <TextInput
          style={[styles.input, errors.amount && styles.errorInput]}
          value={formData.amount}
          onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
          placeholder="Enter amount (e.g., 5000)"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
        {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
      </View>

      {/* Income Description */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description && styles.errorInput]}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Enter description (optional)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        <Text style={styles.characterCount}>
          {formData.description.length}/500 characters
        </Text>
      </View>

      {/* Document Upload Section */}
      {onUploadDocument && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Supporting Documents</Text>
          <Text style={styles.description}>
            Upload documents that support this income source (W-2s, 1099s, receipts, etc.)
          </Text>
          
          {/* Documents List */}
          {documents.length > 0 && (
            <View style={styles.documentsSection}>
              <Text style={styles.sectionTitle}>
                Documents ({documents.length})
              </Text>
              {documents.map(doc => (
                <View key={doc.id} style={styles.documentItem}>
                  <View style={styles.documentInfo}>
                    <Ionicons name="document-outline" size={20} color="#007bff" />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={styles.documentSize}>
                      {doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                    </Text>
                  </View>
                  {onRemoveDocument && (
                    <TouchableOpacity
                      onPress={() => onRemoveDocument(doc.id)}
                      style={styles.removeDocumentButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#dc3545" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            style={styles.formUploadButton}
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
                  await onUploadDocument(file);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to pick document. Please try again.');
              }
            }}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#007bff" />
            <Text style={styles.uploadButtonText}>Upload Document</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Update' : 'Add'} Income Source
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Source Picker Modal */}
      {showSourcePicker && (
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Income Source</Text>
            <ScrollView style={styles.pickerList}>
              {COMMON_INCOME_SOURCES.map((source) => (
                <TouchableOpacity
                  key={source}
                  style={styles.pickerItem}
                  onPress={() => handleSourceSelect(source)}
                >
                  <Text style={styles.pickerItemText}>{source}</Text>
                  {formData.source === source && (
                    <Ionicons name="checkmark" size={20} color="#007bff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setShowSourcePicker(false)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formGroup: {
    padding: 20,
    paddingBottom: 0,
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
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  errorInput: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  documentsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  removeDocumentButton: {
    marginLeft: 8,
  },
  formUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  uploadButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerCancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  pickerCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IncomeSourceForm;
