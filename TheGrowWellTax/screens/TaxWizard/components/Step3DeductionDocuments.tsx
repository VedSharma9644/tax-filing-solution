import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { UploadedDocument } from '../types';
import { pickDocument } from '../utils/documentUtils';
import DocumentPreview from './DocumentPreview';
import { TaxWizardStyles, ContainerStyles, ButtonStyles, InputStyles } from '../../../utils/taxWizardStyles';

interface Dependent {
  id: string;
  name: string;
  age: string;
  relationship: string;
}

interface Step3DeductionDocumentsProps {
  formData: {
    medicalDocuments: UploadedDocument[];
    educationDocuments: UploadedDocument[];
    dependentChildrenDocuments: UploadedDocument[];
    homeownerDeductionDocuments: UploadedDocument[];
  };
  dependents: Dependent[];
  numberOfDependents: string;
  isUploading: boolean;
  imageLoadingStates: { [key: string]: boolean };
  imageErrorStates: { [key: string]: boolean };
  onUploadDocument: (file: any, category: string) => void;
  onDeleteDocument: (id: string, category: string) => void;
  onImageLoad: (documentId: string) => void;
  onImageError: (documentId: string) => void;
  onInitializeImageStates: (documentId: string) => void;
  onUpdateNumberOfDependents: (value: string) => void;
  onUpdateDependent: (id: string, field: keyof Dependent, value: string) => void;
  onRemoveDependent: (id: string) => void;
}

const Step3DeductionDocuments: React.FC<Step3DeductionDocumentsProps> = ({
  formData,
  dependents,
  numberOfDependents,
  isUploading,
  imageLoadingStates,
  imageErrorStates,
  onUploadDocument,
  onDeleteDocument,
  onImageLoad,
  onImageError,
  onInitializeImageStates,
  onUpdateNumberOfDependents,
  onUpdateDependent,
  onRemoveDependent,
}) => {
  const documentCategories = [
    { 
      id: 'medical', 
      name: 'Medical Documents', 
      description: 'Medical bills, prescriptions, and health insurance statements', 
      icon: 'heartbeat', 
      color: '#dc3545',
      documents: formData.medicalDocuments
    },
    { 
      id: 'education', 
      name: 'Education Documents', 
      description: 'Tuition statements, student loan interest, and education expenses', 
      icon: 'graduation-cap', 
      color: '#6f42c1',
      documents: formData.educationDocuments
    },
    { 
      id: 'homeownerDeduction', 
      name: 'Homeowner Deductions', 
      description: 'Mortgage interest statements, property tax receipts, and home improvement receipts', 
      icon: 'home', 
      color: '#20c997',
      documents: formData.homeownerDeductionDocuments
    },
  ];

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
          Upload documents related to deductions and tax credits to maximize your refund.
        </Text>
      </View>

      {/* Tax Credits (Dependent Children) Section */}
      <Card style={styles.dependentSectionCard}>
        <CardHeader style={styles.cardHeader}>
          <View style={styles.dependentSectionHeader}>
            <View style={[styles.dependentSectionIcon, { backgroundColor: '#fd7e14' }]}>
              <FontAwesome name="child" size={20} color="#fff" />
            </View>
            <View style={styles.dependentSectionInfo}>
              <CardTitle style={styles.dependentSectionTitle}>Tax Credits (Dependent Children)</CardTitle>
              <CardDescription>Enter information about your dependents for tax credits</CardDescription>
            </View>
          </View>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          {/* Number of Dependents Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Number of Dependents *</Text>
            <TextInput
              style={styles.textInput}
              value={numberOfDependents}
              onChangeText={onUpdateNumberOfDependents}
              placeholder="Enter number of dependents"
              keyboardType="numeric"
              maxLength={2}
            />
          </View>


          {/* Dependent Forms */}
          {dependents.length > 0 && (
            <View style={styles.dependentsList}>
              <Text style={styles.dependentsTitle}>Dependent Information ({dependents.length})</Text>
              {dependents.map((dependent, index) => (
                <Card key={dependent.id} style={styles.dependentCard}>
                  <CardContent style={styles.dependentContent}>
                    <View style={styles.dependentHeader}>
                      <Text style={styles.dependentNumber}>Dependent {index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => onRemoveDependent(dependent.id)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#dc3545" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.dependentFields}>
                      <View style={styles.fieldRow}>
                        <View style={styles.fieldContainer}>
                          <Text style={styles.fieldLabel}>Name *</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={dependent.name}
                            onChangeText={(value) => onUpdateDependent(dependent.id, 'name', value)}
                            placeholder="Enter dependent's name"
                          />
                        </View>
                        <View style={styles.fieldContainer}>
                          <Text style={styles.fieldLabel}>Age *</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={dependent.age}
                            onChangeText={(value) => onUpdateDependent(dependent.id, 'age', value)}
                            placeholder="Age"
                            keyboardType="numeric"
                            maxLength={2}
                          />
                        </View>
                      </View>
                      
                      <View style={styles.fieldRow}>
                        <View style={[styles.fieldContainer, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Relationship *</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={dependent.relationship}
                            onChangeText={(value) => onUpdateDependent(dependent.id, 'relationship', value)}
                            placeholder="e.g., Son, Daughter, etc."
                          />
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}

          {/* Document Upload for Dependents */}
          {dependents.length > 0 && (
            <View style={styles.documentUploadSection}>
              <Text style={styles.documentUploadTitle}>Upload Dependent Documents</Text>
              <View style={styles.categoryActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handlePickDocument('dependentChildren')}
                  style={[styles.actionButton, { borderColor: '#fd7e14' }] as any}
                >
                  <Ionicons name="document-outline" size={16} color="#fd7e14" />
                  <Text style={[styles.actionButtonText, { color: '#fd7e14' }]}>Select File</Text>
                </Button>
                {/* Camera button removed */}
              </View>

              {/* Uploaded Documents for Dependents */}
              {(formData.dependentChildrenDocuments || []).length > 0 && (
                <View style={styles.documentsList}>
                  <Text style={styles.documentsTitle}>Uploaded Documents ({(formData.dependentChildrenDocuments || []).length})</Text>
                  {(formData.dependentChildrenDocuments || []).map((doc) => (
                    <DocumentPreview
                      key={doc.id}
                      document={doc}
                      onDelete={() => handleDeleteDocument(doc.id, 'dependentChildren')}
                      onReplace={() => {
                        handlePickDocument('dependentChildren');
                      }}
                      showActions={true}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </CardContent>
      </Card>

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
                  <CardDescription>{category.description}</CardDescription>
                </View>
              </View>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.categoryActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handlePickDocument(category.id)}
                  style={[styles.actionButton, { borderColor: category.color }] as any}
                >
                  <Ionicons name="document-outline" size={16} color={category.color} />
                  <Text style={[styles.actionButtonText, { color: category.color }]}>Select File</Text>
                </Button>
                {/* Camera button removed */}
              </View>

              {/* Uploaded Documents for this category */}
              {category.documents.length > 0 && (
                <View style={styles.documentsList}>
                  <Text style={styles.documentsTitle}>Uploaded Documents ({category.documents.length})</Text>
                  {category.documents.map((doc) => (
                    <DocumentPreview
                      key={doc.id}
                      document={doc}
                      onDelete={() => handleDeleteDocument(doc.id, category.id)}
                      onReplace={() => {
                        handlePickDocument(category.id);
                      }}
                      showActions={true}
                    />
                  ))}
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
  categorySection: {
    marginBottom: 24,
  },
  categoryCard: TaxWizardStyles.taxFormComponentCommand,
  cardHeader: TaxWizardStyles.cardHeader,
  cardContent: {
    paddingTop: 0, // Remove top padding from card content
  },
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
  errorText: {
    color: '#fff',
    fontSize: 16,
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
  // New styles for dependent form
  dependentSectionCard: TaxWizardStyles.taxFormComponentCommand,
  dependentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dependentSectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dependentSectionInfo: {
    flex: 1,
  },
  dependentSectionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  inputContainer: TaxWizardStyles.inputContainer,
  inputLabel: TaxWizardStyles.inputLabel,
  textInput: TaxWizardStyles.input,
  dependentsList: {
    marginTop: 16,
  },
  dependentsTitle: TaxWizardStyles.cardTitle,
  dependentCard: {
    ...TaxWizardStyles.taxFormComponentCommand,
    marginHorizontal: -8, // Extend beyond container padding
    marginBottom: 16,
  },
  dependentContent: {
    padding: 16,
  },
  dependentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dependentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  removeButton: {
    padding: 8,
  },
  dependentFields: {
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: TaxWizardStyles.inputLabel,
  fieldInput: TaxWizardStyles.input,
  documentUploadSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  documentUploadTitle: TaxWizardStyles.cardTitle,
});

export default Step3DeductionDocuments;
