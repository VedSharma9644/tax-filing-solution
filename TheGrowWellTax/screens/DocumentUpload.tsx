import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, Dimensions, KeyboardAvoidingView } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
// ImagePicker import removed (camera functionality removed)
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BackgroundColors } from '../utils/colors';
import { uploadDocumentToGCS } from '../services/gcsService';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  category: string;
  uri?: string;
  timestamp: Date;
}

const DocumentUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();

  // Document categories
  const documentCategories = [
    { id: 'w2', name: 'W-2 Forms', description: 'Wage and tax statements from employers', icon: 'file-text-o' },
    { id: '1099', name: '1099 Forms', description: 'Miscellaneous income statements', icon: 'file-text-o' },
    { id: 'receipts', name: 'Receipts', description: 'Deductible expense receipts', icon: 'image' },
    { id: 'tax-docs', name: 'Tax Documents', description: 'Prior year returns, 1098 forms', icon: 'file-text-o' },
  ];

  // Camera functionality removed

  // Pick document from device
  const pickDocument = async () => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a document category first.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadFile({
          name: file.name || 'Document',
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Camera functionality removed

  // Upload file to GCS via backend
  const uploadFile = async (file: { name: string; uri: string; size: number; type: string }) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: documentName || file.name,
      type: file.type,
      size: file.size,
      status: 'uploading',
      progress: 0,
      category: selectedCategory,
      uri: file.uri,
      timestamp: new Date(),
    };

    setUploadedFiles(prev => [...prev, newFile]);
    setIsUploading(true);

    try {
      // Upload to GCS via backend
      const result = await uploadDocumentToGCS(
        {
          name: newFile.name,
          type: newFile.type,
          size: newFile.size,
          uri: newFile.uri,
        },
        user.id,
        selectedCategory,
        (progress) => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === newFile.id 
                ? { ...f, progress }
                : f
            )
          );
        },
        token
      );

      // Update file with success status
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === newFile.id 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100,
                gcsPath: result.gcsPath,
                publicUrl: result.publicUrl
              }
            : f
        )
      );
      
      setIsUploading(false);
      setDocumentName('');
      setSelectedCategory('');
      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update file with error status
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === newFile.id 
            ? { ...f, status: 'error', progress: 0 }
            : f
        )
      );
      
      setIsUploading(false);
      Alert.alert('Upload Failed', error.message || 'Failed to upload document. Please try again.');
    }
  };

  // Delete uploaded file
  const deleteFile = (fileId: string) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
          },
        },
      ]
    );
  };

  // Submit form data
  const handleSubmit = async () => {
    // Check if there are uploaded files
    if (uploadedFiles.length === 0) {
      Alert.alert('No Documents', 'Please upload at least one document before submitting.');
      return;
    }

    // Check if all files are completed
    const incompleteFiles = uploadedFiles.filter(file => file.status !== 'completed');
    if (incompleteFiles.length > 0) {
      Alert.alert('Upload in Progress', 'Please wait for all documents to finish uploading before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data
      const formData = {
        documents: uploadedFiles.map(file => ({
          id: file.id,
          name: file.name,
          category: file.category,
          type: file.type,
          size: file.size,
          timestamp: file.timestamp,
          uri: file.uri,
        })),
        submissionDate: new Date().toISOString(),
        status: 'submitted',
      };

      // Simulate API call to submit form data
      console.log('Submitting form data:', formData);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      Alert.alert(
        'Success!',
        'Your tax form has been submitted successfully. You will receive a confirmation email shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Home/Dashboard
              navigation.navigate('Home');
            },
          },
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get file size in readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'uploading': return '#007bff';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
      <View style={styles.header}>
        <Button variant="ghost" onPress={() => navigation.navigate('Home')} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Button>
        <Text style={styles.headerTitle}>Document Upload</Text>
        <View style={styles.iconButton} />
      </View>
      
      <View style={styles.content}>
        {/* Document Categories */}
        <Text style={styles.sectionTitle}>Select Document Category</Text>
        <View style={styles.categoriesGrid}>
          {documentCategories.map(cat => (
            <Card 
              key={cat.id} 
              style={[
                styles.categoryCard, 
                selectedCategory === cat.id && styles.selectedCategory
              ]}
            >
              <CardContent>
                <Button 
                  variant="ghost" 
                  onPress={() => setSelectedCategory(cat.id)}
                  style={styles.categoryButton}
                >
                  <FontAwesome name={cat.icon as any} size={24} color="#007bff" />
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryDesc}>{cat.description}</Text>
                </Button>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Upload Actions */}
        {selectedCategory && (
          <View style={styles.uploadActions}>
            <Text style={styles.sectionTitle}>Upload Options</Text>
            <View style={styles.actionButtons}>
              <Button style={styles.actionButton} onPress={pickDocument}>
                <Feather name="file" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Pick Document</Text>
              </Button>
              {/* Camera button removed */}
            </View>
          </View>
        )}

        {/* Uploaded Files */}
        <Text style={styles.sectionTitle}>Uploaded Files</Text>
        {uploadedFiles.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent>
              <View style={styles.emptyContent}>
                <Feather name="upload-cloud" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No files uploaded yet</Text>
                <Text style={styles.emptySubtext}>Select a category and upload your documents</Text>
              </View>
            </CardContent>
          </Card>
        ) : (
          uploadedFiles.map(file => (
            <Card key={file.id} style={styles.fileCard}>
              <CardContent>
                <View style={styles.fileHeader}>
                  <View style={styles.fileInfo}>
                    <Feather name="file" size={20} color="#007bff" />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <Text style={styles.fileMeta}>
                        {formatFileSize(file.size)} • {file.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fileActions}>
                    <Badge style={{ backgroundColor: getStatusColor(file.status) }}>
                      {file.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      onPress={() => deleteFile(file.id)}
                      style={styles.deleteButton}
                    >
                      <Feather name="trash-2" size={16} color="#dc3545" />
                    </Button>
                  </View>
                </View>
                {file.status === 'uploading' && (
                  <Progress value={file.progress} style={styles.progressBar} />
                )}
              </CardContent>
            </Card>
          ))
        )}

        {/* Upload Progress */}
        {isUploading && (
          <Card style={styles.progressCard}>
            <CardContent>
              <Text style={styles.progressText}>Uploading document...</Text>
              <Progress value={uploadedFiles.find(f => f.status === 'uploading')?.progress || 0} />
            </CardContent>
          </Card>
        )}

        {/* Personal Documents Section */}
        <Card style={styles.personalDocumentsCard}>
          <CardContent>
            <View style={styles.personalDocumentsHeader}>
              <FontAwesome name="user" size={24} color="#007bff" />
              <View style={styles.personalDocumentsInfo}>
                <Text style={styles.personalDocumentsTitle}>Personal Documents</Text>
                <Text style={styles.personalDocumentsDesc}>
                  Add documents with custom titles and descriptions
                </Text>
              </View>
            </View>
            <Button 
              style={styles.personalDocumentsButton} 
              onPress={() => navigation.navigate('PersonalDocument')}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.personalDocumentsButtonText}>Add Personal Documents</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Card style={styles.submitCard}>
            <CardContent>
              <View style={styles.submitHeader}>
                <FontAwesome name="check-circle" size={24} color="#28a745" />
                <View style={styles.submitInfo}>
                  <Text style={styles.submitTitle}>Ready to Submit</Text>
                  <Text style={styles.submitDesc}>
                    {uploadedFiles.length} document{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                  </Text>
                </View>
              </View>
              <Button 
                style={uploadedFiles.length === 0 || isUploading || isSubmitting ? styles.submitButtonDisabled : styles.submitButton} 
                onPress={handleSubmit}
                disabled={uploadedFiles.length === 0 || isUploading || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Feather name="loader" size={20} color="#fff" style={styles.spinningIcon} />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Tax Form</Text>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, 
    backgroundColor: BackgroundColors.primary, 
    paddingHorizontal: Math.min(16, screenWidth * 0.04),
    paddingBottom: 20,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: Math.min(16, screenWidth * 0.04),
    backgroundColor: '#001826',
    paddingHorizontal: Math.min(16, screenWidth * 0.04),
    marginHorizontal: -Math.min(16, screenWidth * 0.04), // Extend to full width
  },
  iconButton: { 
    width: Math.max(40, screenWidth * 0.1), 
    height: Math.max(40, screenWidth * 0.1), 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { 
    fontSize: Math.min(18, screenWidth * 0.045), 
    fontWeight: 'bold', 
    color: '#ffffff', 
    flex: 1, 
    textAlign: 'center' 
  },
  content: { gap: Math.min(16, screenWidth * 0.04) },
  sectionTitle: { 
    fontSize: Math.min(16, screenWidth * 0.04), 
    fontWeight: 'bold', 
    marginTop: Math.min(16, screenWidth * 0.04), 
    marginBottom: Math.min(8, screenWidth * 0.02) 
  },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: { flex: 1, minWidth: '45%', borderRadius: 12 },
  selectedCategory: { borderColor: '#007bff', borderWidth: 2 },
  categoryButton: { alignItems: 'center', padding: 12 },
  categoryName: { fontWeight: 'bold', fontSize: 14, marginTop: 8, textAlign: 'center' },
  categoryDesc: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 4 },
  uploadActions: { marginTop: 16 },
  actionButtons: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 10,
    justifyContent: 'space-between' // Allow buttons to use their natural width
  },
        actionButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#007bff', 
        borderRadius: 8, 
        padding: 16,
        minHeight: 48,  // Ensure minimum touch target size
        minWidth: 280,  // Ensure minimum width for better text containment
        flex: 0, // Don't force equal width distribution
      },
  actionButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 8,
  },
  emptyCard: { marginBottom: 12, borderRadius: 12 },
  emptyContent: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#aaa', fontSize: 16, marginTop: 8 },
  emptySubtext: { color: '#ccc', fontSize: 12, marginTop: 4, textAlign: 'center' },
  fileCard: { marginBottom: 12, borderRadius: 12 },
  fileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fileDetails: { marginLeft: 12, flex: 1 },
  fileName: { fontWeight: 'bold', fontSize: 14 },
  fileMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  fileActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteButton: { padding: 4 },
  progressBar: { marginTop: 8 },
  progressCard: { marginTop: 16, borderRadius: 12, backgroundColor: '#f8f9fa' },
  progressText: { fontSize: 14, color: '#666', marginBottom: 8 },
  personalDocumentsCard: { marginTop: 16, borderRadius: 12, backgroundColor: '#f8f9fa' },
  personalDocumentsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  personalDocumentsInfo: { marginLeft: 12, flex: 1 },
  personalDocumentsTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  personalDocumentsDesc: { color: '#666', fontSize: 14, marginTop: 2 },
  personalDocumentsButton: { 
    backgroundColor: '#007bff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 12, 
    borderRadius: 8 
  },
  personalDocumentsButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  submitSection: { marginTop: 24, marginBottom: 16 },
  submitCard: { borderRadius: 12, backgroundColor: '#f8f9fa', borderColor: '#28a745', borderWidth: 1 },
  submitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  submitInfo: { marginLeft: 12, flex: 1 },
  submitTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  submitDesc: { color: '#666', fontSize: 14, marginTop: 2 },
  submitButton: { 
    backgroundColor: '#28a745', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 8 
  },
  submitButtonDisabled: { 
    backgroundColor: '#ccc', 
    opacity: 0.6 
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  spinningIcon: { marginRight: 8 },
});

export default DocumentUpload;