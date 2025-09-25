import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { UploadedDocument } from '../types';
import { pickDocument, takePhoto } from '../utils/documentUtils';
import DocumentPreview from './DocumentPreview';

interface Dependent {
  id: string;
  name: string;
  age: string;
  relationship: string;
}

interface Step2DeductionDocumentsProps {
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

const Step2DeductionDocuments: React.FC<Step2DeductionDocumentsProps> = ({
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

  const handleTakePhoto = async (category: string) => {
    try {
      const result = await takePhoto();
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        onUploadDocument(file, category);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

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
        <Text style={styles.title}>Deduction Related Documents</Text>
        <Text style={styles.description}>
          Upload documents related to deductions and tax credits to maximize your refund.
        </Text>
      </View>

      {/* Tax Credits (Dependent Children) Section */}
      <Card style={styles.sectionCard}>
        <CardHeader>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#fd7e14' }]}>
              <FontAwesome name="child" size={20} color="#fff" />
            </View>
            <View style={styles.sectionInfo}>
              <CardTitle style={styles.sectionTitle}>Tax Credits (Dependent Children)</CardTitle>
              <CardDescription>Enter information about your dependents for tax credits</CardDescription>
            </View>
          </View>
        </CardHeader>
        <CardContent>
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
                  <CardContent>
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
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleTakePhoto('dependentChildren')}
                  style={[styles.actionButton, { borderColor: '#fd7e14' }] as any}
                >
                  <Ionicons name="camera-outline" size={16} color="#fd7e14" />
                  <Text style={[styles.actionButtonText, { color: '#fd7e14' }]}>Take Photo</Text>
                </Button>
              </View>

              {/* Uploaded Documents for Dependents */}
              {formData.dependentChildrenDocuments.length > 0 && (
                <View style={styles.documentsList}>
                  <Text style={styles.documentsTitle}>Uploaded Documents ({formData.dependentChildrenDocuments.length})</Text>
                  {formData.dependentChildrenDocuments.map((doc) => (
                    <DocumentPreview
                      key={doc.id}
                      document={doc}
                      onDelete={() => handleDeleteDocument(doc.id, 'dependentChildren')}
                      onReplace={() => {
                        Alert.alert(
                          'Replace Document',
                          'How would you like to replace this document?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Select File', onPress: () => handlePickDocument('dependentChildren') },
                            { text: 'Take Photo', onPress: () => handleTakePhoto('dependentChildren') },
                          ]
                        );
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
            <CardHeader>
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
            <CardContent>
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
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleTakePhoto(category.id)}
                  style={[styles.actionButton, { borderColor: category.color }] as any}
                >
                  <Ionicons name="camera-outline" size={16} color={category.color} />
                  <Text style={[styles.actionButtonText, { color: category.color }]}>Take Photo</Text>
                </Button>
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
                        Alert.alert(
                          'Replace Document',
                          'How would you like to replace this document?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Select File', onPress: () => handlePickDocument(category.id) },
                            { text: 'Take Photo', onPress: () => handleTakePhoto(category.id) },
                          ]
                        );
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
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryCard: {
    marginBottom: 16,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
  },
  documentsList: {
    marginTop: 16,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
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
  sectionCard: {
    marginBottom: 24,
  },
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dependentsList: {
    marginTop: 16,
  },
  dependentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  dependentCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#fd7e14',
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
    color: '#fd7e14',
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  documentUploadSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  documentUploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
});

export default Step2DeductionDocuments;
