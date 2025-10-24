import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { DependentFormProps, COMMON_RELATIONSHIPS, UploadedDocument } from './types';

const DependentForm: React.FC<DependentFormProps> = ({
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
    name: '',
    relationship: '',
    dateOfBirth: '',
    age: '',
    ssn: '',
    customRelationship: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        relationship: initialData.relationship || '',
        dateOfBirth: initialData.dateOfBirth || '',
        age: initialData.age || '',
        ssn: initialData.ssn || '',
        customRelationship: initialData.customRelationship || ''
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }

    if (formData.relationship === 'Other' && !formData.customRelationship.trim()) {
      newErrors.customRelationship = 'Please specify the relationship';
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(parseInt(formData.age))) {
      newErrors.age = 'Age must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const finalRelationship = formData.relationship === 'Other' 
        ? formData.customRelationship 
        : formData.relationship;

      await onSubmit({
        name: formData.name.trim(),
        relationship: finalRelationship,
        dateOfBirth: formData.dateOfBirth.trim(),
        age: formData.age.trim(),
        ssn: formData.ssn.trim() || undefined
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save dependent. Please try again.');
    }
  };

  const handleDateChange = (text: string) => {
    // Basic date formatting (MM/DD/YYYY)
    let formatted = text.replace(/\D/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
    }
    if (formatted.length >= 5) {
      formatted = formatted.substring(0, 5) + '/' + formatted.substring(5, 9);
    }
    setFormData(prev => ({ ...prev, dateOfBirth: formatted }));
  };

  return (
    <SafeAreaWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Name Field */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Dependent's Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter dependent's full name"
          autoCapitalize="words"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Relationship Field */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Relationship *</Text>
        <View style={[styles.pickerContainer, errors.relationship && styles.inputError]}>
          <Picker
            selectedValue={formData.relationship}
            onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
            style={styles.picker}
          >
            <Picker.Item label="Select relationship" value="" />
            {COMMON_RELATIONSHIPS.map((relationship) => (
              <Picker.Item key={relationship} label={relationship} value={relationship} />
            ))}
          </Picker>
        </View>
        {errors.relationship && <Text style={styles.errorText}>{errors.relationship}</Text>}
      </View>

      {/* Custom Relationship Field */}
      {formData.relationship === 'Other' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Specify Relationship *</Text>
          <TextInput
            style={[styles.input, errors.customRelationship && styles.inputError]}
            value={formData.customRelationship}
            onChangeText={(text) => setFormData(prev => ({ ...prev, customRelationship: text }))}
            placeholder="Enter relationship (e.g., cousin, uncle, etc.)"
            autoCapitalize="words"
          />
          {errors.customRelationship && <Text style={styles.errorText}>{errors.customRelationship}</Text>}
        </View>
      )}

      {/* Date of Birth Field */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={[styles.input, errors.dateOfBirth && styles.inputError]}
          value={formData.dateOfBirth}
          onChangeText={handleDateChange}
          placeholder="MM/DD/YYYY"
          keyboardType="numeric"
          maxLength={10}
        />
        {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
      </View>

      {/* Age Field */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={[styles.input, errors.age && styles.inputError]}
          value={formData.age}
          onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
          placeholder="Enter age"
          keyboardType="numeric"
          maxLength={3}
        />
        {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
      </View>

      {/* SSN Field (Optional) */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Social Security Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.ssn}
          onChangeText={(text) => setFormData(prev => ({ ...prev, ssn: text }))}
          placeholder="XXX-XX-XXXX"
          keyboardType="numeric"
          maxLength={11}
        />
        <Text style={styles.description}>
          SSN is optional but recommended for tax purposes
        </Text>
      </View>

      {/* Document Upload Section */}
      {onUploadDocument && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Supporting Documents</Text>
          <Text style={styles.description}>
            Upload documents that support this dependent (birth certificate, adoption papers, etc.)
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
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Update Dependent' : 'Add Dependent'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  formGroup: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  documentsSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
    flex: 1,
  },
  documentSize: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  removeDocumentButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fff5f5',
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
    marginTop: 8,
  },
  uploadButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
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
    backgroundColor: '#28a745',
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

export default DependentForm;

