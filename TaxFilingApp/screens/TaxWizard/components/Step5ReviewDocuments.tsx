import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { UploadedDocument } from '../types';
import { pickDocument } from '../utils/documentUtils';
import DocumentPreview from './DocumentPreview';
import { TaxWizardStyles, ContainerStyles, ButtonStyles, InputStyles } from '../../../utils/taxWizardStyles';

interface Step5ReviewDocumentsProps {
  formData: {
    socialSecurityNumber: string;
    previousYearTaxDocuments: UploadedDocument[];
    w2Forms: UploadedDocument[];
    hasAdditionalIncome: boolean;
    additionalIncomeSources: any[];
    medicalDocuments: UploadedDocument[];
    educationDocuments: UploadedDocument[];
    dependentChildrenDocuments: UploadedDocument[];
    homeownerDeductionDocuments: UploadedDocument[];
    personalIdDocuments: UploadedDocument[];
  };
  isUploading: boolean;
  imageLoadingStates: { [key: string]: boolean };
  imageErrorStates: { [key: string]: boolean };
  onUploadDocument: (file: any, category: string) => void;
  onDeleteDocument: (id: string, category: string) => void;
  onImageLoad: (documentId: string) => void;
  onImageError: (documentId: string) => void;
  onInitializeImageStates: (documentId: string) => void;
}

const Step5ReviewDocuments: React.FC<Step5ReviewDocumentsProps> = ({
  formData,
  isUploading,
  imageLoadingStates,
  imageErrorStates,
  onUploadDocument,
  onDeleteDocument,
  onImageLoad,
  onImageError,
  onInitializeImageStates,
}) => {
  const documentCategories = [
    { 
      id: 'previousYearTax', 
      name: 'Previous Year Tax Documents', 
      icon: 'file-text-o', 
      color: '#007bff',
      documents: formData.previousYearTaxDocuments
    },
    { 
      id: 'w2Forms', 
      name: 'W-2 Forms', 
      icon: 'briefcase', 
      color: '#28a745',
      documents: formData.w2Forms
    },
    { 
      id: 'medical', 
      name: 'Medical Documents', 
      icon: 'heartbeat', 
      color: '#dc3545',
      documents: formData.medicalDocuments
    },
    { 
      id: 'education', 
      name: 'Education Documents', 
      icon: 'graduation-cap', 
      color: '#6f42c1',
      documents: formData.educationDocuments
    },
    { 
      id: 'dependentChildren', 
      name: 'Tax Credits (Dependent Children)', 
      icon: 'child', 
      color: '#fd7e14',
      documents: formData.dependentChildrenDocuments
    },
    { 
      id: 'homeownerDeduction', 
      name: 'Homeowner Deductions', 
      icon: 'home', 
      color: '#20c997',
      documents: formData.homeownerDeductionDocuments
    },
    { 
      id: 'personalId', 
      name: 'Personal Documents (ID)', 
      icon: 'id-card', 
      color: '#17a2b8',
      documents: formData.personalIdDocuments
    },
  ];

  // Calculate total additional income
  const getTotalAdditionalIncome = () => {
    const sources = formData.additionalIncomeSources || [];
    return sources.reduce((total, source) => {
      const amount = parseFloat(source.amount) || 0;
      return total + amount;
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const handleReplaceDocument = (id: string, category: string) => {
    Alert.alert(
      'Replace Document',
      'How would you like to replace this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Select File', onPress: () => handlePickDocument(category) },
        { text: 'Take Photo', onPress: () => handleTakePhoto(category) },
      ]
    );
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.description}>
          Review all uploaded documents. You can replace or delete any document before submitting.
        </Text>
      </View>


      {/* Personal Information Summary */}
      <Card style={styles.sectionCard}>
        <CardHeader style={styles.cardHeader}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#007bff' }]}>
              <FontAwesome name="user" size={20} color="#fff" />
            </View>
            <View style={styles.sectionInfo}>
              <CardTitle style={styles.sectionTitle}>Personal Information</CardTitle>
              <CardDescription>Social Security Number: {formData.socialSecurityNumber || 'Not provided'}</CardDescription>
            </View>
          </View>
        </CardHeader>
      </Card>

      {/* Additional Income Summary */}
      {formData.hasAdditionalIncome && (
        <Card style={styles.sectionCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#28a745' }]}>
                <FontAwesome name="dollar" size={20} color="#fff" />
              </View>
              <View style={styles.sectionInfo}>
                <CardTitle style={styles.sectionTitle}>Additional Income Sources</CardTitle>
                <CardDescription>
                  {(formData.additionalIncomeSources || []).length} income source{(formData.additionalIncomeSources || []).length !== 1 ? 's' : ''} • 
                  Total: {formatCurrency(getTotalAdditionalIncome())}
                </CardDescription>
              </View>
            </View>
          </CardHeader>
          <CardContent>
            {(formData.additionalIncomeSources || []).map((source, index) => (
              <View key={source.id} style={styles.incomeSourceItem}>
                <View style={styles.incomeSourceHeader}>
                  <Text style={styles.incomeSourceNumber}>#{index + 1}</Text>
                  <Text style={styles.incomeSourceAmount}>{formatCurrency(parseFloat(source.amount) || 0)}</Text>
                </View>
                <Text style={styles.incomeSourceName}>{source.source}</Text>
                {source.description && (
                  <Text style={styles.incomeSourceDescription}>{source.description}</Text>
                )}
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Document Categories */}
      {documentCategories.map((category) => (
        <View key={category.id} style={styles.categorySection}>
          <Card style={styles.categoryCard}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <FontAwesome name={category.icon as any} size={20} color="#fff" />
                </View>
                <View style={styles.categoryInfo}>
                  <CardTitle style={styles.categoryTitle}>{category.name}</CardTitle>
                  <CardDescription>{category.documents.length} document(s) uploaded</CardDescription>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              {/* Uploaded Documents for this category */}
              {category.documents.length > 0 ? (
                <View style={styles.documentsList}>
                  {category.documents.map((doc) => (
                    <DocumentPreview
                      key={doc.id}
                      document={doc}
                      onDelete={() => handleDeleteDocument(doc.id, category.id)}
                      onReplace={() => handleReplaceDocument(doc.id, category.id)}
                      showActions={true}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No documents uploaded for this category</Text>
                  <View style={styles.emptyStateActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handlePickDocument(category.id)}
                      style={[styles.actionButton, { borderColor: category.color }] as any}
                    >
                      <Ionicons name="document-outline" size={16} color={category.color} />
                      <Text style={[styles.actionButtonText, { color: category.color }]}>Add Document</Text>
                    </Button>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      ))}

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
  categorySection: {
    marginBottom: 24,
  },
  categoryCard: TaxWizardStyles.taxFormComponentCommand,
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  documentsList: {
    marginTop: 16,
  },
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
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
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
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: 12,
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
  incomeSourceItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  incomeSourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  incomeSourceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  incomeSourceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  incomeSourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  incomeSourceDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default Step5ReviewDocuments;
