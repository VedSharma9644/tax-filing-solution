import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { UploadedDocument } from '../types';
import { pickDocument } from '../utils/documentUtils';
import DocumentPreview from './DocumentPreview';
import { TaxWizardStyles, ContainerStyles, ButtonStyles, InputStyles } from '../../../utils/taxWizardStyles';

interface Step4PersonalInfoProps {
  formData: {
    socialSecurityNumber: string;
    personalIdDocuments: UploadedDocument[];
  };
  isUploading: boolean;
  imageLoadingStates: { [key: string]: boolean };
  imageErrorStates: { [key: string]: boolean };
  onUpdateFormData: (field: string, value: string) => void;
  onUploadDocument: (file: any, category: string) => void;
  onDeleteDocument: (id: string, category: string) => void;
  onImageLoad: (documentId: string) => void;
  onImageError: (documentId: string) => void;
  onInitializeImageStates: (documentId: string) => void;
}

const Step4PersonalInfo: React.FC<Step4PersonalInfoProps> = ({
  formData,
  isUploading,
  imageLoadingStates,
  imageErrorStates,
  onUpdateFormData,
  onUploadDocument,
  onDeleteDocument,
  onImageLoad,
  onImageError,
  onInitializeImageStates,
}) => {
  const [ssnError, setSsnError] = useState<string>('');

  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    }
  };

  const handleSSNChange = (value: string) => {
    const formatted = formatSSN(value);
    onUpdateFormData('socialSecurityNumber', formatted);
    
    // Validate SSN
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 9) {
      setSsnError('SSN must be 9 digits');
    } else if (digits.length === 9) {
      setSsnError('');
    } else {
      setSsnError('');
    }
  };

  const handlePickDocument = async (category: string) => {
    try {
      const result = await pickDocument();
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        onUploadDocument(file, category);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Camera functionality removed

  const handleDeleteDocument = (id: string, category: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteDocument(id, category) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.description}>
          Provide your Social Security Number and upload personal identification documents.
        </Text>
      </View>

      {/* Social Security Number Section */}
      <Card style={styles.sectionCard}>
        <CardHeader style={styles.cardHeader}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#007bff' }]}>
              <FontAwesome name="id-card" size={20} color="#fff" />
            </View>
            <View style={styles.sectionInfo}>
              <CardTitle style={styles.sectionTitle}>Social Security Number</CardTitle>
              <CardDescription>Required for tax filing identification</CardDescription>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>SSN *</Text>
            <TextInput
              style={[styles.textInput, ssnError ? styles.inputError : null]}
              value={formData.socialSecurityNumber}
              onChangeText={handleSSNChange}
              placeholder="XXX-XX-XXXX"
              keyboardType="numeric"
              maxLength={11}
              secureTextEntry={true}
            />
            {ssnError ? <Text style={styles.errorText}>{ssnError}</Text> : null}
          </View>
        </CardContent>
      </Card>

      {/* Personal Documents Section */}
      <Card style={styles.sectionCard}>
        <CardHeader style={styles.cardHeader}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#28a745' }]}>
              <FontAwesome name="file-text-o" size={20} color="#fff" />
            </View>
            <View style={styles.sectionInfo}>
              <CardTitle style={styles.sectionTitle}>Personal Documents (ID)</CardTitle>
              <CardDescription>Upload your driver's license, passport, or other government ID</CardDescription>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.categoryActions}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handlePickDocument('personalId')}
              style={[styles.actionButton, { borderColor: '#28a745' }] as any}
            >
              <Ionicons name="document-outline" size={16} color="#28a745" />
              <Text style={[styles.actionButtonText, { color: '#28a745' }]}>Select File(s)</Text>
            </Button>
            {/* Camera button removed */}
          </View>

          {/* Uploaded Personal Documents */}
          {(formData.personalIdDocuments || []).length > 0 && (
            <View style={styles.documentsList}>
              <Text style={styles.documentsTitle}>Uploaded Documents ({(formData.personalIdDocuments || []).length})</Text>
              {(formData.personalIdDocuments || []).map((doc) => (
                <DocumentPreview
                  key={doc.id}
                  document={doc}
                  onDelete={() => handleDeleteDocument(doc.id, 'personalId')}
                  onReplace={() => {
                    handlePickDocument('personalId');
                  }}
                  showActions={true}
                />
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <Text style={styles.uploadingText}>Uploading documents...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: TaxWizardStyles.scrollContainer,
  header: TaxWizardStyles.header,
  title: TaxWizardStyles.headerTitle,
  description: TaxWizardStyles.headerSubtitle,
  sectionCard: TaxWizardStyles.taxFormComponentCommand,
  cardHeader: TaxWizardStyles.cardHeader,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  inputContainer: TaxWizardStyles.inputContainer,
  inputLabel: TaxWizardStyles.inputLabel,
  textInput: TaxWizardStyles.input,
  inputError: TaxWizardStyles.inputError,
  errorText: TaxWizardStyles.errorText,
  categoryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
  },
  documentsList: {
    marginTop: 16,
  },
  documentsTitle: TaxWizardStyles.cardTitle,
  documentCard: {
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 14,
    color: '#666',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deleteButton: {
    padding: 8,
  },
  progressContainer: TaxWizardStyles.progressContainer,
  progressBar: TaxWizardStyles.progressBar,
  progressFill: TaxWizardStyles.progressFill,
  progressText: TaxWizardStyles.progressText,
  imageContainer: {
    marginTop: 12,
    position: 'relative',
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(220,53,69,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Step4PersonalInfo;
