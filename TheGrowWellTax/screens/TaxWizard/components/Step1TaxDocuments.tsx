import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { UploadedDocument } from '../types';
import { pickDocument } from '../utils/documentUtils';
import DocumentPreview from './DocumentPreview';
import { BackgroundColors } from '../../../utils/colors';
import { TaxWizardStyles, ContainerStyles, ButtonStyles, UploadStyles } from '../../../utils/taxWizardStyles';

interface Step1TaxDocumentsProps {
  formData: {
    previousYearTaxDocuments: UploadedDocument[];
    w2Forms: UploadedDocument[];
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

const Step1TaxDocuments: React.FC<Step1TaxDocumentsProps> = ({
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
      description: 'Your previous year tax return and related documents', 
      icon: 'file-text-o', 
      color: '#007bff',
      documents: formData.previousYearTaxDocuments
    },
    { 
      id: 'w2Forms', 
      name: 'W-2 Forms', 
      description: 'Wage and tax statements from all employers', 
      icon: 'briefcase', 
      color: '#28a745',
      documents: formData.w2Forms
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
          Upload your tax documents including previous year returns and W-2 forms.
        </Text>
      </View>

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
                        // Handle replace functionality
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

export default Step1TaxDocuments;
