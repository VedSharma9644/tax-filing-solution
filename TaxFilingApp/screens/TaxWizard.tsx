import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, Image, Dimensions, KeyboardAvoidingView } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UploadedDocument {
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

const TaxWizard = () => {
  const route = useRoute<any>();
  const initialStep = route.params?.step || 1;
  const [step, setStep] = useState(initialStep);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [previousYearDocuments, setPreviousYearDocuments] = useState<UploadedDocument[]>([]);
  const [homeownerDocuments, setHomeownerDocuments] = useState<UploadedDocument[]>([]);
  const [medicalDocuments, setMedicalDocuments] = useState<UploadedDocument[]>([]);
  const [educationDocuments, setEducationDocuments] = useState<UploadedDocument[]>([]);
  const [personalDocuments, setPersonalDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [imageErrorStates, setImageErrorStates] = useState<{[key: string]: boolean}>({});
  const [formData, setFormData] = useState({
    w2Income: '',
    w2Withholding: '',
    selfEmploymentIncome: '',
    unemploymentIncome: '',
    mortgageInterest: '',
    propertyTax: '',
    charitableDonations: '',
    medicalExpenses: '',
    studentLoanInterest: '',
    hasChildren: false,
    numberOfChildren: '',
    childcareExpenses: '',
    educationExpenses: '',
  });

  const [children, setChildren] = useState<Array<{
    id: string;
    name: string;
    relation: string;
    dob: string;
    ssn: string;
  }>>([]);
  const navigation = useNavigation<any>();
  const totalSteps = 8;
  const progress = (step / totalSteps) * 100;

  // Request camera permissions
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return false;
      }
    }
    return true;
  };

  // Pick previous year document from device
  const pickPreviousYearDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument({
          name: file.name || 'Previous Year Tax Document',
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
          category: 'previousYear',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Pick document from device
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument({
          name: file.name || 'W-2 Document',
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
          category: 'w2',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Pick homeowner document from device
  const pickHomeownerDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument({
          name: file.name || 'Homeowner Document',
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
          category: 'homeowner',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await uploadDocument({
          name: `W-2_Photo_${new Date().toISOString().slice(0, 10)}.jpg`,
          uri: asset.uri,
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          category: 'w2',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Take previous year photo with camera
  const takePreviousYearPhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await uploadDocument({
          name: `Previous_Year_Tax_Photo_${new Date().toISOString().slice(0, 10)}.jpg`,
          uri: asset.uri,
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          category: 'previousYear',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Take homeowner photo with camera
  const takeHomeownerPhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await uploadDocument({
          name: `Homeowner_Photo_${new Date().toISOString().slice(0, 10)}.jpg`,
          uri: asset.uri,
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          category: 'homeowner',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick medical document from device
  const pickMedicalDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument({
          name: file.name || 'Medical Document',
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
          category: 'medical',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Take medical photo with camera
  const takeMedicalPhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await uploadDocument({
          name: `Medical_Photo_${new Date().toISOString().slice(0, 10)}.jpg`,
          uri: asset.uri,
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          category: 'medical',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick education document from device
  const pickEducationDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument({
          name: file.name || 'Education Document',
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
          category: 'education',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Take education photo with camera
  const takeEducationPhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await uploadDocument({
          name: `Education_Photo_${new Date().toISOString().slice(0, 10)}.jpg`,
          uri: asset.uri,
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          category: 'education',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick personal document from device
  const pickPersonalDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument({
          name: file.name || 'Personal Document',
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/octet-stream',
          category: 'personal',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Take personal photo with camera
  const takePersonalPhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await uploadDocument({
          name: `Personal_Photo_${new Date().toISOString().slice(0, 10)}.jpg`,
          uri: asset.uri,
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          category: 'personal',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Upload document with progress simulation
  const uploadDocument = async (file: { name: string; uri: string; size: number; type: string; category: string }) => {
    console.log('Uploading document:', file.name, 'URI:', file.uri, 'Type:', file.type, 'Category:', file.category);
    
    const newDocument: UploadedDocument = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading',
      progress: 0,
      category: file.category,
      uri: file.uri,
      timestamp: new Date(),
    };
    
    console.log('Created document object:', newDocument);

    // Add to appropriate document list based on category
    if (file.category === 'w2') {
      setUploadedDocuments(prev => [...prev, newDocument]);
    } else if (file.category === 'previousYear') {
      setPreviousYearDocuments(prev => [...prev, newDocument]);
    } else if (file.category === 'homeowner') {
      setHomeownerDocuments(prev => [...prev, newDocument]);
    } else if (file.category === 'medical') {
      setMedicalDocuments(prev => [...prev, newDocument]);
    } else if (file.category === 'education') {
      setEducationDocuments(prev => [...prev, newDocument]);
    } else if (file.category === 'personal') {
      setPersonalDocuments(prev => [...prev, newDocument]);
    }
    
    setIsUploading(true);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      if (file.category === 'w2') {
        setUploadedDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { ...d, progress: Math.min(d.progress + 10, 100) }
              : d
          )
        );
      } else if (file.category === 'previousYear') {
        setPreviousYearDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { ...d, progress: Math.min(d.progress + 10, 100) }
              : d
          )
        );
      } else if (file.category === 'homeowner') {
        setHomeownerDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { ...d, progress: Math.min(d.progress + 10, 100) }
              : d
          )
        );
      } else if (file.category === 'medical') {
        setMedicalDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { ...d, progress: Math.min(d.progress + 10, 100) }
              : d
          )
        );
      } else if (file.category === 'education') {
        setEducationDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { ...d, progress: Math.min(d.progress + 10, 100) }
              : d
          )
        );
      } else if (file.category === 'personal') {
        setPersonalDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { ...d, progress: Math.min(d.progress + 10, 100) }
              : d
          )
        );
      }
    }, 200);

    // Simulate upload completion and data extraction after 2 seconds
    setTimeout(() => {
      clearInterval(uploadInterval);
      
      if (file.category === 'w2') {
        setUploadedDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { 
                  ...d, 
                  status: 'completed', 
                  progress: 100
                }
              : d
          )
        );
        Alert.alert('Success', 'W-2 document uploaded and processed successfully!');
      } else if (file.category === 'previousYear') {
        console.log('Completing previous year document upload for:', newDocument.id);
        setPreviousYearDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { 
                  ...d, 
                  status: 'completed', 
                  progress: 100
                }
              : d
          )
        );
        Alert.alert('Success', 'Previous year tax document uploaded and processed successfully!');
      } else if (file.category === 'homeowner') {
        setHomeownerDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { 
                  ...d, 
                  status: 'completed', 
                  progress: 100
                }
              : d
          )
        );
        Alert.alert('Success', 'Homeowner document uploaded and processed successfully!');
      } else if (file.category === 'medical') {
        setMedicalDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { 
                  ...d, 
                  status: 'completed', 
                  progress: 100
                }
              : d
          )
        );
        Alert.alert('Success', 'Medical document uploaded and processed successfully!');
      } else if (file.category === 'education') {
        setEducationDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { 
                  ...d, 
                  status: 'completed', 
                  progress: 100
                }
              : d
          )
        );
        Alert.alert('Success', 'Education document uploaded and processed successfully!');
      } else if (file.category === 'personal') {
        setPersonalDocuments(prev => 
          prev.map(d => 
            d.id === newDocument.id 
              ? { 
                  ...d, 
                  status: 'completed', 
                  progress: 100
                }
              : d
          )
        );
        Alert.alert('Success', 'Personal document uploaded and processed successfully!');
      }
      
      setIsUploading(false);
    }, 2000);
  };

  // Delete uploaded document
  const deleteDocument = (documentId: string, category: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (category === 'w2') {
              setUploadedDocuments(prev => prev.filter(d => d.id !== documentId));
              // Clear form data if W-2 document is deleted
              setFormData(prev => ({
                ...prev,
                w2Income: '',
                w2Withholding: ''
              }));
            } else if (category === 'previousYear') {
              setPreviousYearDocuments(prev => prev.filter(d => d.id !== documentId));
            } else if (category === 'homeowner') {
              setHomeownerDocuments(prev => prev.filter(d => d.id !== documentId));
            } else if (category === 'medical') {
              setMedicalDocuments(prev => prev.filter(d => d.id !== documentId));
            } else if (category === 'education') {
              setEducationDocuments(prev => prev.filter(d => d.id !== documentId));
            } else if (category === 'personal') {
              setPersonalDocuments(prev => prev.filter(d => d.id !== documentId));
            }
          },
        },
      ]
    );
  };

  // Get file size in readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle image loading
  const handleImageLoad = (documentId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: false }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: false }));
    console.log('Image loaded successfully for document:', documentId);
  };

  // Handle image error
  const handleImageError = (documentId: string, error: any) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: false }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: true }));
    console.log('Image load error for document:', documentId, 'Error:', error.nativeEvent.error);
  };

  // Initialize image states for a document
  const initializeImageStates = (documentId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: true }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: false }));
    console.log('Initializing image states for document:', documentId);
  };

  // Check if URI is valid for image display
  const isValidImageUri = (uri: string | undefined) => {
    if (!uri) return false;
    return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http://') || uri.startsWith('https://');
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

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigation.navigate('Home');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.navigate('Home');
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add a new child
  const addChild = () => {
    const newChild = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      relation: '',
      dob: '',
      ssn: '',
    };
    setChildren(prev => [...prev, newChild]);
  };

  // Remove a child
  const removeChild = (childId: string) => {
    setChildren(prev => prev.filter(child => child.id !== childId));
  };

  // Update child information
  const updateChild = (childId: string, field: string, value: string) => {
    setChildren(prev => 
      prev.map(child => 
        child.id === childId 
          ? { ...child, [field]: value }
          : child
      )
    );
  };

  // Handle number of children change
  const handleNumberOfChildrenChange = (value: string) => {
    const numChildren = parseInt(value) || 0;
    updateFormData('numberOfChildren', value);
    
    // Adjust children array based on the new number
    if (numChildren > children.length) {
      // Add missing children
      const childrenToAdd = numChildren - children.length;
      const newChildren = Array.from({ length: childrenToAdd }, () => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: '',
        relation: '',
        dob: '',
        ssn: '',
      }));
      setChildren(prev => [...prev, ...newChildren]);
    } else if (numChildren < children.length) {
      // Remove excess children
      setChildren(prev => prev.slice(0, numChildren));
    }
  };

  const handleSubmitToAdmin = () => {
    Alert.alert(
      'Submit Tax Return',
      'Are you sure you want to submit your tax return to the admin for review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: () => {
            // Prepare all data to send to admin
            const taxReturnData = {
              formData: formData,
              children: children,
              documents: {
                previousYearDocuments: previousYearDocuments,
                w2Documents: uploadedDocuments,
                homeownerDocuments: homeownerDocuments,
                medicalDocuments: medicalDocuments,
                educationDocuments: educationDocuments,
                personalDocuments: personalDocuments,
              },
              submissionDate: new Date().toISOString(),
              status: 'submitted_for_review',
              userId: 'user_123', // In real app, this would come from auth
              taxYear: '2023',
            };
            
            console.log('Submitting tax return data to admin:', taxReturnData);
            
            // Show success message and navigate
            Alert.alert(
              'Success!', 
              'Your tax return has been submitted to the admin for review. You will receive a notification when it\'s ready for your review.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to dashboard or show success screen
                    navigation.navigate('Home');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome name="history" size={32} color="#fff" />
            </View>
            <Text style={styles.stepTitle}>Upload Previous Year Tax Documents</Text>
            <Text style={styles.stepDescription}>Upload your previous year tax documents (optional)</Text>
            <Card style={styles.cardMuted}>
              <CardContent>
                <View style={styles.helpRow}>
                  <Feather name="help-circle" size={20} color="#007bff" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.helpTitle}>How it works</Text>
                    <Text style={styles.helpText}>Upload your previous year tax documents to help us better understand your tax situation. This step is optional.</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Upload Actions */}
            <View style={styles.uploadActions}>
              <Text style={styles.label}>Upload Previous Year Tax Documents</Text>
              <View style={styles.actionButtons}>
                <Button style={styles.actionButton} onPress={pickPreviousYearDocument}>
                  <Feather name="file" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Pick Document</Text>
                </Button>
                <Button style={styles.actionButton} onPress={takePreviousYearPhoto}>
                  <Feather name="camera" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </Button>
              </View>
            </View>

            {/* Uploaded Documents */}
            <Text style={styles.label}>Uploaded Previous Year Documents</Text>
            {previousYearDocuments.length === 0 ? (
              <Card style={styles.emptyCard}>
                <CardContent>
                  <View style={styles.emptyContent}>
                    <Feather name="upload-cloud" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No previous year documents uploaded yet</Text>
                    <Text style={styles.emptySubtext}>Upload your previous year tax documents (optional)</Text>
                  </View>
                </CardContent>
              </Card>
            ) : (
              previousYearDocuments.map(document => (
                <Card key={document.id} style={styles.documentCard}>
                  <CardContent>
                    <View style={styles.documentHeader}>
                      <View style={styles.documentInfo}>
                        <Feather name="file-text" size={20} color="#007bff" />
                        <View style={styles.documentDetails}>
                          <Text style={styles.documentName}>{document.name}</Text>
                          <Text style={styles.documentMeta}>
                            {formatFileSize(document.size)} • Previous Year Document
                          </Text>
                        </View>
                      </View>
                      <View style={styles.documentActions}>
                        <Badge style={{ backgroundColor: getStatusColor(document.status) }}>
                          {document.status}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          onPress={() => deleteDocument(document.id, 'previousYear')}
                          style={styles.deleteButton}
                        >
                          <Feather name="trash-2" size={16} color="#dc3545" />
                        </Button>
                      </View>
                    </View>
                    {document.status === 'uploading' && (
                      <Progress value={document.progress} style={styles.progressBar} />
                    )}
                    {document.status === 'completed' && (
                      <View style={styles.documentPreview}>
                        <Text style={styles.previewTitle}>Document Preview</Text>
                        <View style={styles.previewContainer}>
                          {document.type.startsWith('image/') ? (
                            <View style={styles.previewWrapper}>
                              {imageErrorStates[document.id] || !isValidImageUri(document.uri) ? (
                                <View style={styles.documentThumbnail}>
                                  <Feather name="image" size={24} color="#dc3545" />
                                  <Text style={styles.previewSubtext}>Failed to load image</Text>
                                  <Text style={[styles.previewSubtext, { fontSize: 10, color: '#999' }]}>
                                    URI: {document.uri?.substring(0, 30)}...
                                  </Text>
                                </View>
                              ) : (
                                <Image 
                                  source={{ uri: document.uri }} 
                                  style={styles.documentThumbnail}
                                  resizeMode="cover"
                                  onLoadStart={() => {
                                    console.log('Image load started for document:', document.id, 'URI:', document.uri);
                                    initializeImageStates(document.id);
                                  }}
                                  onLoad={() => {
                                    console.log('Image loaded successfully for document:', document.id);
                                    handleImageLoad(document.id);
                                  }}
                                  onError={(error) => {
                                    console.log('Image load error for document:', document.id, 'Error:', error.nativeEvent.error, 'URI:', document.uri);
                                    handleImageError(document.id, error);
                                  }}
                                />
                              )}
                              <Text style={styles.previewSubtext}>{document.name}</Text>
                              {imageLoadingStates[document.id] && (
                                <Text style={styles.previewSubtext}>Loading...</Text>
                              )}
                            </View>
                          ) : document.type === 'application/pdf' ? (
                            <View style={styles.previewWrapper}>
                              <View style={styles.pdfThumbnail}>
                                <Feather name="file-text" size={32} color="#007bff" />
                                <Text style={styles.pdfText}>PDF</Text>
                              </View>
                              <Text style={styles.previewSubtext}>{document.name}</Text>
                            </View>
                          ) : (
                            <View style={styles.previewWrapper}>
                              <View style={styles.fileThumbnail}>
                                <Feather name="file" size={32} color="#6c757d" />
                                <Text style={styles.fileText}>File</Text>
                              </View>
                              <Text style={styles.previewSubtext}>{document.name}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome name="file-text-o" size={32} color="#fff" />
            </View>
            <Text style={styles.stepTitle}>Upload W-2 Documents</Text>
            <Text style={styles.stepDescription}>Upload your W-2 forms to automatically extract income data</Text>
            <Card style={styles.cardMuted}>
              <CardContent>
                <View style={styles.helpRow}>
                  <Feather name="help-circle" size={20} color="#007bff" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.helpTitle}>How it works</Text>
                    <Text style={styles.helpText}>Upload your W-2 forms and we'll automatically extract Box 1 (wages) and Box 2 (federal withholding) for you.</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Upload Actions */}
            <View style={styles.uploadActions}>
              <Text style={styles.label}>Upload W-2 Documents</Text>
              <View style={styles.actionButtons}>
                <Button style={styles.actionButton} onPress={pickDocument}>
                  <Feather name="file" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Pick Document</Text>
                </Button>
                <Button style={styles.actionButton} onPress={takePhoto}>
                  <Feather name="camera" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Take Photo</Text>
                </Button>
              </View>
            </View>

            {/* Uploaded Documents */}
            <Text style={styles.label}>Uploaded W-2 Documents</Text>
            {uploadedDocuments.length === 0 ? (
              <Card style={styles.emptyCard}>
                <CardContent>
                  <View style={styles.emptyContent}>
                    <Feather name="upload-cloud" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No W-2 documents uploaded yet</Text>
                    <Text style={styles.emptySubtext}>Upload your W-2 forms to get started</Text>
                  </View>
                </CardContent>
              </Card>
            ) : (
              uploadedDocuments.map(document => (
                <Card key={document.id} style={styles.documentCard}>
                  <CardContent>
                    <View style={styles.documentHeader}>
                      <View style={styles.documentInfo}>
                        <Feather name="file-text" size={20} color="#007bff" />
                        <View style={styles.documentDetails}>
                          <Text style={styles.documentName}>{document.name}</Text>
                          <Text style={styles.documentMeta}>
                            {formatFileSize(document.size)} • W-2 Document
                          </Text>
                        </View>
                      </View>
                      <View style={styles.documentActions}>
                        <Badge style={{ backgroundColor: getStatusColor(document.status) }}>
                          {document.status}
                        </Badge>
                                                 <Button 
                           variant="ghost" 
                           onPress={() => deleteDocument(document.id, 'w2')}
                           style={styles.deleteButton}
                         >
                          <Feather name="trash-2" size={16} color="#dc3545" />
                        </Button>
                      </View>
                    </View>
                    {document.status === 'uploading' && (
                      <Progress value={document.progress} style={styles.progressBar} />
                    )}
                                         {document.status === 'completed' && (
                       <View style={styles.documentPreview}>
                         <Text style={styles.previewTitle}>Document Preview</Text>
                         <View style={styles.previewContainer}>
                                                       {document.type.startsWith('image/') ? (
                              <View style={styles.previewWrapper}>
                                {imageErrorStates[document.id] ? (
                                  <View style={styles.documentThumbnail}>
                                    <Feather name="image" size={24} color="#dc3545" />
                                    <Text style={styles.previewSubtext}>Failed to load image</Text>
                                  </View>
                                ) : (
                                  <Image 
                                    source={{ uri: document.uri }} 
                                    style={styles.documentThumbnail}
                                    resizeMode="cover"
                                    onLoadStart={() => setImageLoadingStates(prev => ({ ...prev, [document.id]: true }))}
                                    onLoad={() => handleImageLoad(document.id)}
                                    onError={(error) => handleImageError(document.id, error)}
                                  />
                                )}
                                <Text style={styles.previewSubtext}>{document.name}</Text>
                                {imageLoadingStates[document.id] && (
                                  <Text style={styles.previewSubtext}>Loading...</Text>
                                )}
                              </View>
                            ) : document.type === 'application/pdf' ? (
                              <View style={styles.previewWrapper}>
                                <View style={styles.pdfThumbnail}>
                                  <Feather name="file-text" size={32} color="#007bff" />
                                  <Text style={styles.pdfText}>PDF</Text>
                                </View>
                                <Text style={styles.previewSubtext}>{document.name}</Text>
                              </View>
                            ) : (
                              <View style={styles.previewWrapper}>
                                <Feather name="file-text" size={40} color="#007bff" />
                                <Text style={styles.previewText}>{document.name}</Text>
                              </View>
                            )}
                         </View>
                       </View>
                     )}
                  </CardContent>
                </Card>
              ))
            )}

            
          </View>
        );
             case 2:
         return (
           <View style={styles.stepContainer}>
             <View style={styles.iconCircle}>
               <FontAwesome name="home" size={32} color="#fff" />
             </View>
             <Text style={styles.stepTitle}>Upload Homeowner Documents</Text>
             <Text style={styles.stepDescription}>Upload mortgage statements, property tax bills, and charitable donation receipts</Text>
             <Card style={styles.cardMuted}>
               <CardContent>
                 <View style={styles.helpRow}>
                   <Feather name="help-circle" size={20} color="#007bff" style={{ marginTop: 2 }} />
                   <View style={{ flex: 1 }}>
                     <Text style={styles.helpTitle}>How it works</Text>
                     <Text style={styles.helpText}>Upload your homeowner documents and we'll automatically extract mortgage interest, property tax, and charitable donation amounts.</Text>
                   </View>
                 </View>
               </CardContent>
             </Card>

             {/* Upload Actions */}
             <View style={styles.uploadActions}>
               <Text style={styles.label}>Upload Homeowner Documents</Text>
               <View style={styles.actionButtons}>
                 <Button style={styles.actionButton} onPress={pickHomeownerDocument}>
                   <Feather name="file" size={20} color="#fff" />
                   <Text style={styles.actionButtonText}>Pick Document</Text>
                 </Button>
                 <Button style={styles.actionButton} onPress={takeHomeownerPhoto}>
                   <Feather name="camera" size={20} color="#fff" />
                   <Text style={styles.actionButtonText}>Take Photo</Text>
                 </Button>
               </View>
             </View>

             {/* Uploaded Documents */}
             <Text style={styles.label}>Uploaded Homeowner Documents</Text>
             {homeownerDocuments.length === 0 ? (
               <Card style={styles.emptyCard}>
                 <CardContent>
                   <View style={styles.emptyContent}>
                     <Feather name="upload-cloud" size={48} color="#ccc" />
                     <Text style={styles.emptyText}>No homeowner documents uploaded yet</Text>
                     <Text style={styles.emptySubtext}>Upload your mortgage statements, property tax bills, and donation receipts</Text>
                   </View>
                 </CardContent>
               </Card>
             ) : (
               homeownerDocuments.map(document => (
                 <Card key={document.id} style={styles.documentCard}>
                   <CardContent>
                     <View style={styles.documentHeader}>
                       <View style={styles.documentInfo}>
                         <Feather name="file-text" size={20} color="#007bff" />
                         <View style={styles.documentDetails}>
                           <Text style={styles.documentName}>{document.name}</Text>
                           <Text style={styles.documentMeta}>
                             {formatFileSize(document.size)} • Homeowner Document
                           </Text>
                         </View>
                       </View>
                       <View style={styles.documentActions}>
                         <Badge style={{ backgroundColor: getStatusColor(document.status) }}>
                           {document.status}
                         </Badge>
                         <Button 
                           variant="ghost" 
                                                    onPress={() => deleteDocument(document.id, 'homeowner')}
                         style={styles.deleteButton}
                       >
                         <Feather name="trash-2" size={16} color="#dc3545" />
                       </Button>
                     </View>
                   </View>
                   {document.status === 'uploading' && (
                     <Progress value={document.progress} style={styles.progressBar} />
                   )}
                   {document.status === 'completed' && (
                     <View style={styles.documentPreview}>
                       <Text style={styles.previewTitle}>Document Preview</Text>
                       <View style={styles.previewContainer}>
                         {document.type.startsWith('image/') ? (
                           <View style={styles.previewWrapper}>
                             {imageErrorStates[document.id] ? (
                               <View style={styles.documentThumbnail}>
                                 <Feather name="image" size={24} color="#dc3545" />
                                 <Text style={styles.previewSubtext}>Failed to load image</Text>
                               </View>
                             ) : (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.documentThumbnail}
                                 resizeMode="cover"
                                 onLoadStart={() => setImageLoadingStates(prev => ({ ...prev, [document.id]: true }))}
                                 onLoad={() => handleImageLoad(document.id)}
                                 onError={(error) => handleImageError(document.id, error)}
                               />
                             )}
                             <Text style={styles.previewSubtext}>{document.name}</Text>
                             {imageLoadingStates[document.id] && (
                               <Text style={styles.previewSubtext}>Loading...</Text>
                             )}
                           </View>
                         ) : document.type === 'application/pdf' ? (
                             <View style={styles.previewWrapper}>
                               <View style={styles.pdfThumbnail}>
                                 <Feather name="file-text" size={32} color="#007bff" />
                                 <Text style={styles.pdfText}>PDF</Text>
                               </View>
                               <Text style={styles.previewSubtext}>{document.name}</Text>
                             </View>
                           ) : (
                             <View style={styles.previewWrapper}>
                               <Feather name="file-text" size={40} color="#007bff" />
                               <Text style={styles.previewText}>{document.name}</Text>
                             </View>
                           )}
                         </View>
                       </View>
                     )}
                   </CardContent>
                 </Card>
               ))
             )}
           </View>
         );
             case 3:
         return (
           <View style={styles.stepContainer}>
             <View style={styles.iconCircle}>
               <FontAwesome name="heart" size={32} color="#fff" />
             </View>
             <Text style={styles.stepTitle}>Upload Medical Documents</Text>
             <Text style={styles.stepDescription}>Upload medical bills, prescriptions, and healthcare receipts</Text>
             <Card style={styles.cardMuted}>
               <CardContent>
                 <View style={styles.helpRow}>
                   <Feather name="help-circle" size={20} color="#007bff" style={{ marginTop: 2 }} />
                   <View style={{ flex: 1 }}>
                     <Text style={styles.helpTitle}>How it works</Text>
                     <Text style={styles.helpText}>Upload your medical documents and we'll automatically extract medical expenses for tax deductions.</Text>
                   </View>
                 </View>
               </CardContent>
             </Card>

             {/* Upload Actions */}
             <View style={styles.uploadActions}>
               <Text style={styles.label}>Upload Medical Documents</Text>
               <View style={styles.actionButtons}>
                 <Button style={styles.actionButton} onPress={pickMedicalDocument}>
                   <Feather name="file" size={20} color="#fff" />
                   <Text style={styles.actionButtonText}>Pick Document</Text>
                 </Button>
                 <Button style={styles.actionButton} onPress={takeMedicalPhoto}>
                   <Feather name="camera" size={20} color="#fff" />
                   <Text style={styles.actionButtonText}>Take Photo</Text>
                 </Button>
               </View>
             </View>

             {/* Uploaded Documents */}
             <Text style={styles.label}>Uploaded Medical Documents</Text>
             {medicalDocuments.length === 0 ? (
               <Card style={styles.emptyCard}>
                 <CardContent>
                   <View style={styles.emptyContent}>
                     <Feather name="upload-cloud" size={48} color="#ccc" />
                     <Text style={styles.emptyText}>No medical documents uploaded yet</Text>
                     <Text style={styles.emptySubtext}>Upload your medical bills, prescriptions, and healthcare receipts</Text>
                   </View>
                 </CardContent>
               </Card>
             ) : (
               medicalDocuments.map(document => (
                 <Card key={document.id} style={styles.documentCard}>
                   <CardContent>
                     <View style={styles.documentHeader}>
                       <View style={styles.documentInfo}>
                         <Feather name="file-text" size={20} color="#007bff" />
                         <View style={styles.documentDetails}>
                           <Text style={styles.documentName}>{document.name}</Text>
                           <Text style={styles.documentMeta}>
                             {formatFileSize(document.size)} • Medical Document
                           </Text>
                         </View>
                       </View>
                       <View style={styles.documentActions}>
                         <Badge style={{ backgroundColor: getStatusColor(document.status) }}>
                           {document.status}
                         </Badge>
                         <Button 
                           variant="ghost" 
                                                    onPress={() => deleteDocument(document.id, 'medical')}
                         style={styles.deleteButton}
                       >
                         <Feather name="trash-2" size={16} color="#dc3545" />
                       </Button>
                     </View>
                   </View>
                   {document.status === 'uploading' && (
                     <Progress value={document.progress} style={styles.progressBar} />
                   )}
                   {document.status === 'completed' && (
                     <View style={styles.documentPreview}>
                       <Text style={styles.previewTitle}>Document Preview</Text>
                       <View style={styles.previewContainer}>
                         {document.type.startsWith('image/') ? (
                           <View style={styles.previewWrapper}>
                             {imageErrorStates[document.id] ? (
                               <View style={styles.documentThumbnail}>
                                 <Feather name="image" size={24} color="#dc3545" />
                                 <Text style={styles.previewSubtext}>Failed to load image</Text>
                               </View>
                             ) : (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.documentThumbnail}
                                 resizeMode="cover"
                                 onLoadStart={() => setImageLoadingStates(prev => ({ ...prev, [document.id]: true }))}
                                 onLoad={() => handleImageLoad(document.id)}
                                 onError={(error) => handleImageError(document.id, error)}
                               />
                             )}
                             <Text style={styles.previewSubtext}>{document.name}</Text>
                             {imageLoadingStates[document.id] && (
                               <Text style={styles.previewSubtext}>Loading...</Text>
                             )}
                           </View>
                         ) : document.type === 'application/pdf' ? (
                             <View style={styles.previewWrapper}>
                               <View style={styles.pdfThumbnail}>
                                 <Feather name="file-text" size={32} color="#007bff" />
                                 <Text style={styles.pdfText}>PDF</Text>
                               </View>
                               <Text style={styles.previewSubtext}>{document.name}</Text>
                             </View>
                           ) : (
                             <View style={styles.previewWrapper}>
                               <Feather name="file-text" size={40} color="#007bff" />
                               <Text style={styles.previewText}>{document.name}</Text>
                             </View>
                           )}
                         </View>
                       </View>
                     )}
                   </CardContent>
                 </Card>
               ))
             )}
           </View>
         );
             case 4:
         return (
           <View style={styles.stepContainer}>
             <View style={styles.iconCircle}>
               <FontAwesome name="graduation-cap" size={32} color="#fff" />
             </View>
             <Text style={styles.stepTitle}>Upload Education Documents</Text>
             <Text style={styles.stepDescription}>Upload student loan statements, tuition bills, and education receipts</Text>
             <Card style={styles.cardMuted}>
               <CardContent>
                 <View style={styles.helpRow}>
                   <Feather name="help-circle" size={20} color="#007bff" style={{ marginTop: 2 }} />
                   <View style={{ flex: 1 }}>
                     <Text style={styles.helpTitle}>How it works</Text>
                     <Text style={styles.helpText}>Upload your education documents and we'll automatically extract student loan interest and education expenses.</Text>
                   </View>
                 </View>
               </CardContent>
             </Card>

             {/* Upload Actions */}
             <View style={styles.uploadActions}>
               <Text style={styles.label}>Upload Education Documents</Text>
               <View style={styles.actionButtons}>
                 <Button style={styles.actionButton} onPress={pickEducationDocument}>
                   <Feather name="file" size={20} color="#fff" />
                   <Text style={styles.actionButtonText}>Pick Document</Text>
                 </Button>
                 <Button style={styles.actionButton} onPress={takeEducationPhoto}>
                   <Feather name="camera" size={20} color="#fff" />
                   <Text style={styles.actionButtonText}>Take Photo</Text>
                 </Button>
               </View>
             </View>

             {/* Uploaded Documents */}
             <Text style={styles.label}>Uploaded Education Documents</Text>
             {educationDocuments.length === 0 ? (
               <Card style={styles.emptyCard}>
                 <CardContent>
                   <View style={styles.emptyContent}>
                     <Feather name="upload-cloud" size={48} color="#ccc" />
                     <Text style={styles.emptyText}>No education documents uploaded yet</Text>
                     <Text style={styles.emptySubtext}>Upload your student loan statements, tuition bills, and education receipts</Text>
                   </View>
                 </CardContent>
               </Card>
             ) : (
               educationDocuments.map(document => (
                 <Card key={document.id} style={styles.documentCard}>
                   <CardContent>
                     <View style={styles.documentHeader}>
                       <View style={styles.documentInfo}>
                         <Feather name="file-text" size={20} color="#007bff" />
                         <View style={styles.documentDetails}>
                           <Text style={styles.documentName}>{document.name}</Text>
                           <Text style={styles.documentMeta}>
                             {formatFileSize(document.size)} • Education Document
                           </Text>
                         </View>
                       </View>
                       <View style={styles.documentActions}>
                         <Badge style={{ backgroundColor: getStatusColor(document.status) }}>
                           {document.status}
                         </Badge>
                         <Button 
                           variant="ghost" 
                           onPress={() => deleteDocument(document.id, 'education')}
                           style={styles.deleteButton}
                         >
                           <Feather name="trash-2" size={16} color="#dc3545" />
                         </Button>
                       </View>
                     </View>
                     {document.status === 'uploading' && (
                       <Progress value={document.progress} style={styles.progressBar} />
                     )}
                     {document.status === 'completed' && (
                       <View style={styles.documentPreview}>
                         <Text style={styles.previewTitle}>Document Preview</Text>
                         <View style={styles.previewContainer}>
                           {document.type.startsWith('image/') ? (
                             <View style={styles.previewWrapper}>
                               {imageErrorStates[document.id] ? (
                                 <View style={styles.documentThumbnail}>
                                   <Feather name="image" size={24} color="#dc3545" />
                                   <Text style={styles.previewSubtext}>Failed to load image</Text>
                                 </View>
                               ) : (
                                 <Image 
                                   source={{ uri: document.uri }} 
                                   style={styles.documentThumbnail}
                                   resizeMode="cover"
                                   onLoadStart={() => setImageLoadingStates(prev => ({ ...prev, [document.id]: true }))}
                                   onLoad={() => handleImageLoad(document.id)}
                                   onError={(error) => handleImageError(document.id, error)}
                                 />
                               )}
                               <Text style={styles.previewSubtext}>{document.name}</Text>
                               {imageLoadingStates[document.id] && (
                                 <Text style={styles.previewSubtext}>Loading...</Text>
                               )}
                             </View>
                           ) : document.type === 'application/pdf' ? (
                             <View style={styles.previewWrapper}>
                               <View style={styles.pdfThumbnail}>
                                 <Feather name="file-text" size={32} color="#007bff" />
                                 <Text style={styles.pdfText}>PDF</Text>
                               </View>
                               <Text style={styles.previewSubtext}>{document.name}</Text>
                             </View>
                           ) : (
                             <View style={styles.previewWrapper}>
                               <Feather name="file-text" size={40} color="#007bff" />
                               <Text style={styles.previewText}>{document.name}</Text>
                             </View>
                           )}
                         </View>
                       </View>
                     )}
                   </CardContent>
                 </Card>
               ))
             )}
           </View>
         );
               case 5:
          return (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <FontAwesome name="graduation-cap" size={32} color="#fff" />
              </View>
              <Text style={styles.stepTitle}>Tax Credits</Text>
              <Text style={styles.stepDescription}>Credits reduce your tax dollar-for-dollar</Text>
             <Card style={styles.cardMuted}>
               <CardContent>
                 <View style={styles.helpRow}>
                   <Feather name="alert-triangle" size={20} color="#ffc107" style={{ marginTop: 2 }} />
                   <View>
                     <Text style={styles.helpTitle}>Credits vs Deductions</Text>
                     <Text style={styles.helpText}>Credits are better than deductions - they reduce your tax owed directly!</Text>
                   </View>
                 </View>
               </CardContent>
             </Card>
             <View style={styles.inputGroup}>
               <View style={styles.checkboxRow}>
                 <Checkbox
                   checked={formData.hasChildren}
                   onCheckedChange={(checked) => updateFormData('hasChildren', checked as boolean)}
                 />
                 <Text style={styles.checkboxLabel}>I have dependent children</Text>
               </View>
               {formData.hasChildren && (
                 <>
                   <Text style={styles.label}>Number of Children</Text>
                   <TextInput
                     placeholder="Enter number of children (1, 2, 3, 4, 5+)"
                     value={formData.numberOfChildren}
                     onChangeText={handleNumberOfChildrenChange}
                     style={styles.input}
                     keyboardType="numeric"
                   />
                   
                   {/* Child Information Section */}
                   {children.length > 0 && (
                     <View style={styles.childrenSection}>
                       <Text style={styles.sectionTitle}>Child Information</Text>
                       <Text style={styles.sectionSubtitle}>Please provide details for each dependent child</Text>
                       
                       {children.map((child, index) => (
                         <Card key={child.id} style={styles.childCard}>
                           <CardHeader>
                             <CardTitle style={styles.childCardTitle}>
                               Child {index + 1}
                               <Button 
                                 variant="ghost" 
                                 onPress={() => removeChild(child.id)}
                                 style={styles.removeChildButton}
                               >
                                 <Feather name="trash-2" size={16} color="#dc3545" />
                               </Button>
                             </CardTitle>
                           </CardHeader>
                           <CardContent>
                             <View style={styles.childFields}>
                               <View style={styles.fieldRow}>
                                 <View style={styles.fieldColumn}>
                                   <Text style={styles.fieldLabel}>Child Name</Text>
                                   <TextInput
                                     placeholder="Enter child's full name"
                                     value={child.name}
                                     onChangeText={(value) => updateChild(child.id, 'name', value)}
                                     style={styles.childInput}
                                   />
                                 </View>
                                 <View style={styles.fieldColumn}>
                                   <Text style={styles.fieldLabel}>Relation</Text>
                                   <TextInput
                                     placeholder="Son, Daughter, etc."
                                     value={child.relation}
                                     onChangeText={(value) => updateChild(child.id, 'relation', value)}
                                     style={styles.childInput}
                                   />
                                 </View>
                               </View>
                               
                               <View style={styles.fieldRow}>
                                 <View style={styles.fieldColumn}>
                                   <Text style={styles.fieldLabel}>Date of Birth</Text>
                                   <TextInput
                                     placeholder="MM/DD/YYYY"
                                     value={child.dob}
                                     onChangeText={(value) => updateChild(child.id, 'dob', value)}
                                     style={styles.childInput}
                                   />
                                 </View>
                                 <View style={styles.fieldColumn}>
                                   <Text style={styles.fieldLabel}>Social Security Number</Text>
                                   <TextInput
                                     placeholder="XXX-XX-XXXX"
                                     value={child.ssn}
                                     onChangeText={(value) => updateChild(child.id, 'ssn', value)}
                                     style={styles.childInput}
                                     keyboardType="numeric"
                                   />
                                 </View>
                               </View>
                             </View>
                           </CardContent>
                         </Card>
                       ))}
                     </View>
                   )}
                   
                   <Text style={styles.label}>Childcare Expenses</Text>
                   <TextInput
                     placeholder="Enter amount"
                     value={formData.childcareExpenses}
                     onChangeText={val => updateFormData('childcareExpenses', val)}
                     style={styles.input}
                     keyboardType="numeric"
                   />
                 </>
               )}
             </View>
           </View>
         );

         case 6:
           return (
             <View style={styles.stepContainer}>
               <View style={styles.iconCircle}>
                 <FontAwesome name="user" size={32} color="#fff" />
               </View>
               <Text style={styles.stepTitle}>Personal Documents</Text>
               <Text style={styles.stepDescription}>Upload any additional personal documents with custom titles</Text>
               <Card style={styles.cardMuted}>
                 <CardContent>
                   <View style={styles.helpRow}>
                     <Feather name="help-circle" size={20} color="#007bff" style={{ marginTop: 2 }} />
                     <View style={{ flex: 1 }}>
                       <Text style={styles.helpTitle}>How it works</Text>
                       <Text style={styles.helpText}>Upload any additional documents you'd like to include with your tax filing. You can give each document a custom title.</Text>
                     </View>
                   </View>
                 </CardContent>
               </Card>

               {/* Upload Actions */}
               <View style={styles.uploadActions}>
                 <Text style={styles.label}>Upload Personal Documents</Text>
                 <View style={styles.actionButtons}>
                   <Button style={styles.actionButton} onPress={pickPersonalDocument}>
                     <Feather name="file" size={20} color="#fff" />
                     <Text style={styles.actionButtonText}>Pick Document</Text>
                   </Button>
                   <Button style={styles.actionButton} onPress={takePersonalPhoto}>
                     <Feather name="camera" size={20} color="#fff" />
                     <Text style={styles.actionButtonText}>Take Photo</Text>
                   </Button>
                 </View>
               </View>

               {/* Uploaded Documents */}
               <Text style={styles.label}>Uploaded Personal Documents</Text>
               {personalDocuments.length === 0 ? (
                 <Card style={styles.emptyCard}>
                   <CardContent>
                     <View style={styles.emptyContent}>
                       <Feather name="upload-cloud" size={48} color="#ccc" />
                       <Text style={styles.emptyText}>No personal documents uploaded yet</Text>
                       <Text style={styles.emptySubtext}>Upload any additional documents you'd like to include</Text>
                     </View>
                   </CardContent>
                 </Card>
               ) : (
                 personalDocuments.map(document => (
                   <Card key={document.id} style={styles.documentCard}>
                     <CardContent>
                       <View style={styles.documentHeader}>
                         <View style={styles.documentInfo}>
                           <Feather name="file-text" size={20} color="#007bff" />
                           <View style={styles.documentDetails}>
                             <Text style={styles.documentName}>{document.name}</Text>
                             <Text style={styles.documentMeta}>
                               {formatFileSize(document.size)} • Personal Document
                             </Text>
                           </View>
                         </View>
                         <View style={styles.documentActions}>
                           <Badge style={{ backgroundColor: getStatusColor(document.status) }}>
                             {document.status}
                           </Badge>
                           <Button 
                             variant="ghost" 
                             onPress={() => deleteDocument(document.id, 'personal')}
                             style={styles.deleteButton}
                           >
                             <Feather name="trash-2" size={16} color="#dc3545" />
                           </Button>
                         </View>
                       </View>
                       {document.status === 'uploading' && (
                         <Progress value={document.progress} style={styles.progressBar} />
                       )}
                       {document.status === 'completed' && (
                         <View style={styles.documentPreview}>
                           <Text style={styles.previewTitle}>Document Preview</Text>
                           <View style={styles.previewContainer}>
                             {document.type.startsWith('image/') ? (
                               <View style={styles.previewWrapper}>
                                 <Image 
                                   source={{ uri: document.uri }} 
                                   style={styles.documentThumbnail}
                                   resizeMode="cover"
                                 />
                                 <Text style={styles.previewSubtext}>{document.name}</Text>
                               </View>
                             ) : document.type === 'application/pdf' ? (
                               <View style={styles.previewWrapper}>
                                 <View style={styles.pdfThumbnail}>
                                   <Feather name="file-text" size={32} color="#007bff" />
                                   <Text style={styles.pdfText}>PDF</Text>
                                 </View>
                                 <Text style={styles.previewSubtext}>{document.name}</Text>
                               </View>
                             ) : (
                               <View style={styles.previewWrapper}>
                                 <View style={styles.fileThumbnail}>
                                   <Feather name="file" size={32} color="#6c757d" />
                                   <Text style={styles.fileText}>File</Text>
                                 </View>
                                 <Text style={styles.previewSubtext}>{document.name}</Text>
                               </View>
                             )}
                           </View>
                         </View>
                       )}
                     </CardContent>
                   </Card>
                 ))
               )}
             </View>
           );

         case 7:
          return (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <FontAwesome name="file-text" size={32} color="#fff" />
              </View>
              <Text style={styles.stepTitle}>Review Documents</Text>
              <Text style={styles.stepDescription}>Review and manage your uploaded documents</Text>
             <View style={styles.inputGroup}>
               
               {/* Previous Year Documents Section */}
               {previousYearDocuments.length > 0 && (
                 <Card style={styles.reviewCard}>
                   <CardHeader>
                     <CardTitle style={styles.reviewCardTitle}>
                       <FontAwesome name="history" size={20} color="#007bff" />
                       <Text style={styles.reviewCardTitleText}>Previous Year Tax Documents</Text>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {previousYearDocuments.map(document => (
                       <View key={document.id} style={styles.reviewDocumentItem}>
                         <View style={styles.reviewDocumentInfo}>
                           {/* Document Preview */}
                           <View style={styles.reviewDocumentPreview}>
                             {document.type.startsWith('image/') ? (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.reviewPreviewImage}
                                 resizeMode="cover"
                               />
                             ) : document.type === 'application/pdf' ? (
                               <View style={styles.reviewPreviewPdf}>
                                 <Feather name="file-text" size={24} color="#dc3545" />
                                 <Text style={styles.reviewPreviewText}>PDF</Text>
                               </View>
                             ) : (
                               <View style={styles.reviewPreviewFile}>
                                 <Feather name="file" size={24} color="#6c757d" />
                                 <Text style={styles.reviewPreviewText}>File</Text>
                               </View>
                             )}
                           </View>
                           <View style={styles.reviewDocumentDetails}>
                             <Text style={styles.reviewDocumentName}>{document.name}</Text>
                             <Text style={styles.reviewDocumentMeta}>
                               {formatFileSize(document.size)} • {document.status}
                             </Text>
                           </View>
                         </View>
                         <View style={styles.reviewDocumentActions}>
                           <Button 
                             variant="ghost" 
                             onPress={() => deleteDocument(document.id, 'previousYear')}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="trash-2" size={16} color="#dc3545" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             onPress={() => pickPreviousYearDocument()}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="edit" size={16} color="#007bff" />
                           </Button>
                         </View>
                       </View>
                     ))}
                   </CardContent>
                 </Card>
               )}

               {/* W-2 Documents Section */}
               {uploadedDocuments.length > 0 && (
                 <Card style={styles.reviewCard}>
                   <CardHeader>
                     <CardTitle style={styles.reviewCardTitle}>
                       <FontAwesome name="file-text-o" size={20} color="#007bff" />
                       <Text style={styles.reviewCardTitleText}>W-2 Documents</Text>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {uploadedDocuments.map(document => (
                       <View key={document.id} style={styles.reviewDocumentItem}>
                         <View style={styles.reviewDocumentInfo}>
                           {/* Document Preview */}
                           <View style={styles.reviewDocumentPreview}>
                             {document.type.startsWith('image/') ? (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.reviewPreviewImage}
                                 resizeMode="cover"
                               />
                             ) : document.type === 'application/pdf' ? (
                               <View style={styles.reviewPreviewPdf}>
                                 <Feather name="file-text" size={24} color="#dc3545" />
                                 <Text style={styles.reviewPreviewText}>PDF</Text>
                               </View>
                             ) : (
                               <View style={styles.reviewPreviewFile}>
                                 <Feather name="file" size={24} color="#6c757d" />
                                 <Text style={styles.reviewPreviewText}>File</Text>
                               </View>
                             )}
                           </View>
                           <View style={styles.reviewDocumentDetails}>
                             <Text style={styles.reviewDocumentName}>{document.name}</Text>
                             <Text style={styles.reviewDocumentMeta}>
                               {formatFileSize(document.size)} • {document.status}
                             </Text>
                           </View>
                         </View>
                         <View style={styles.reviewDocumentActions}>
                           <Button 
                             variant="ghost" 
                             onPress={() => deleteDocument(document.id, 'w2')}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="trash-2" size={16} color="#dc3545" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             onPress={() => pickDocument()}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="edit" size={16} color="#007bff" />
                           </Button>
                         </View>
                       </View>
                     ))}
                   </CardContent>
                 </Card>
               )}

               {/* Homeowner Documents Section */}
               {homeownerDocuments.length > 0 && (
                 <Card style={styles.reviewCard}>
                   <CardHeader>
                     <CardTitle style={styles.reviewCardTitle}>
                       <FontAwesome name="home" size={20} color="#007bff" />
                       <Text style={styles.reviewCardTitleText}>Homeowner Documents</Text>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {homeownerDocuments.map(document => (
                       <View key={document.id} style={styles.reviewDocumentItem}>
                         <View style={styles.reviewDocumentInfo}>
                           {/* Document Preview */}
                           <View style={styles.reviewDocumentPreview}>
                             {document.type.startsWith('image/') ? (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.reviewPreviewImage}
                                 resizeMode="cover"
                               />
                             ) : document.type === 'application/pdf' ? (
                               <View style={styles.reviewPreviewPdf}>
                                 <Feather name="file-text" size={24} color="#dc3545" />
                                 <Text style={styles.reviewPreviewText}>PDF</Text>
                               </View>
                             ) : (
                               <View style={styles.reviewPreviewFile}>
                                 <Feather name="file" size={24} color="#6c757d" />
                                 <Text style={styles.reviewPreviewText}>File</Text>
                               </View>
                             )}
                           </View>
                           <View style={styles.reviewDocumentDetails}>
                             <Text style={styles.reviewDocumentName}>{document.name}</Text>
                             <Text style={styles.reviewDocumentMeta}>
                               {formatFileSize(document.size)} • {document.status}
                             </Text>
                           </View>
                         </View>
                         <View style={styles.reviewDocumentActions}>
                           <Button 
                             variant="ghost" 
                             onPress={() => deleteDocument(document.id, 'homeowner')}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="trash-2" size={16} color="#dc3545" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             onPress={() => pickHomeownerDocument()}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="edit" size={16} color="#007bff" />
                           </Button>
                         </View>
                       </View>
                     ))}
                   </CardContent>
                 </Card>
               )}

               {/* Medical Documents Section */}
               {medicalDocuments.length > 0 && (
                 <Card style={styles.reviewCard}>
                   <CardHeader>
                     <CardTitle style={styles.reviewCardTitle}>
                       <FontAwesome name="heart" size={20} color="#007bff" />
                       <Text style={styles.reviewCardTitleText}>Medical Documents</Text>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {medicalDocuments.map(document => (
                       <View key={document.id} style={styles.reviewDocumentItem}>
                         <View style={styles.reviewDocumentInfo}>
                           {/* Document Preview */}
                           <View style={styles.reviewDocumentPreview}>
                             {document.type.startsWith('image/') ? (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.reviewPreviewImage}
                                 resizeMode="cover"
                               />
                             ) : document.type === 'application/pdf' ? (
                               <View style={styles.reviewPreviewPdf}>
                                 <Feather name="file-text" size={24} color="#dc3545" />
                                 <Text style={styles.reviewPreviewText}>PDF</Text>
                               </View>
                             ) : (
                               <View style={styles.reviewPreviewFile}>
                                 <Feather name="file" size={24} color="#6c757d" />
                                 <Text style={styles.reviewPreviewText}>File</Text>
                               </View>
                             )}
                           </View>
                           <View style={styles.reviewDocumentDetails}>
                             <Text style={styles.reviewDocumentName}>{document.name}</Text>
                             <Text style={styles.reviewDocumentMeta}>
                               {formatFileSize(document.size)} • {document.status}
                             </Text>
                           </View>
                         </View>
                         <View style={styles.reviewDocumentActions}>
                           <Button 
                             variant="ghost" 
                             onPress={() => deleteDocument(document.id, 'medical')}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="trash-2" size={16} color="#dc3545" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             onPress={() => pickMedicalDocument()}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="edit" size={16} color="#007bff" />
                           </Button>
                         </View>
                       </View>
                     ))}
                   </CardContent>
                 </Card>
               )}

               {/* Education Documents Section */}
               {educationDocuments.length > 0 && (
                 <Card style={styles.reviewCard}>
                   <CardHeader>
                     <CardTitle style={styles.reviewCardTitle}>
                       <FontAwesome name="graduation-cap" size={20} color="#007bff" />
                       <Text style={styles.reviewCardTitleText}>Education Documents</Text>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {educationDocuments.map(document => (
                       <View key={document.id} style={styles.reviewDocumentItem}>
                         <View style={styles.reviewDocumentInfo}>
                           {/* Document Preview */}
                           <View style={styles.reviewDocumentPreview}>
                             {document.type.startsWith('image/') ? (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.reviewPreviewImage}
                                 resizeMode="cover"
                               />
                             ) : document.type === 'application/pdf' ? (
                               <View style={styles.reviewPreviewPdf}>
                                 <Feather name="file-text" size={24} color="#dc3545" />
                                 <Text style={styles.reviewPreviewText}>PDF</Text>
                               </View>
                             ) : (
                               <View style={styles.reviewPreviewFile}>
                                 <Feather name="file" size={24} color="#6c757d" />
                                 <Text style={styles.reviewPreviewText}>File</Text>
                               </View>
                             )}
                           </View>
                           <View style={styles.reviewDocumentDetails}>
                             <Text style={styles.reviewDocumentName}>{document.name}</Text>
                             <Text style={styles.reviewDocumentMeta}>
                               {formatFileSize(document.size)} • {document.status}
                             </Text>
                           </View>
                         </View>
                         <View style={styles.reviewDocumentActions}>
                           <Button 
                             variant="ghost" 
                             onPress={() => deleteDocument(document.id, 'education')}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="trash-2" size={16} color="#dc3545" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             onPress={() => pickEducationDocument()}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="edit" size={16} color="#007bff" />
                           </Button>
                         </View>
                       </View>
                     ))}
                   </CardContent>
                 </Card>
               )}

               {/* Personal Documents Section */}
               {personalDocuments.length > 0 && (
                 <Card style={styles.reviewCard}>
                   <CardHeader>
                     <CardTitle style={styles.reviewCardTitle}>
                       <FontAwesome name="user" size={20} color="#007bff" />
                       <Text style={styles.reviewCardTitleText}>Personal Documents</Text>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {personalDocuments.map(document => (
                       <View key={document.id} style={styles.reviewDocumentItem}>
                         <View style={styles.reviewDocumentInfo}>
                           {/* Document Preview */}
                           <View style={styles.reviewDocumentPreview}>
                             {document.type.startsWith('image/') ? (
                               <Image 
                                 source={{ uri: document.uri }} 
                                 style={styles.reviewPreviewImage}
                                 resizeMode="cover"
                               />
                             ) : document.type === 'application/pdf' ? (
                               <View style={styles.reviewPreviewPdf}>
                                 <Feather name="file-text" size={24} color="#dc3545" />
                                 <Text style={styles.reviewPreviewText}>PDF</Text>
                               </View>
                             ) : (
                               <View style={styles.reviewPreviewFile}>
                                 <Feather name="file" size={24} color="#6c757d" />
                                 <Text style={styles.reviewPreviewText}>File</Text>
                               </View>
                             )}
                           </View>
                           <View style={styles.reviewDocumentDetails}>
                             <Text style={styles.reviewDocumentName}>{document.name}</Text>
                             <Text style={styles.reviewDocumentMeta}>
                               {formatFileSize(document.size)} • {document.status}
                             </Text>
                           </View>
                         </View>
                         <View style={styles.reviewDocumentActions}>
                           <Button 
                             variant="ghost" 
                             onPress={() => deleteDocument(document.id, 'personal')}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="trash-2" size={16} color="#dc3545" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             onPress={() => pickPersonalDocument()}
                             style={styles.reviewActionButton}
                           >
                             <Feather name="edit" size={16} color="#007bff" />
                           </Button>
                         </View>
                       </View>
                     ))}
                   </CardContent>
                 </Card>
               )}

               {/* Child Information Section */}
               {formData.hasChildren && children.length > 0 && (
                 <Card style={styles.reviewCard}>
                   <CardHeader>
                     <CardTitle style={styles.reviewCardTitle}>
                       <FontAwesome name="child" size={20} color="#007bff" />
                       <Text style={styles.reviewCardTitleText}>Child Information</Text>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     {children.map((child, index) => (
                       <View key={child.id} style={styles.reviewChildItem}>
                         <View style={styles.reviewChildInfo}>
                           <View style={styles.reviewChildAvatar}>
                             <FontAwesome name="child" size={20} color="#007bff" />
                           </View>
                           <View style={styles.reviewChildDetails}>
                             <Text style={styles.reviewChildName}>
                               Child {index + 1}: {child.name || 'Unnamed'}
                             </Text>
                             <Text style={styles.reviewChildMeta}>
                               {child.relation && `Relation: ${child.relation}`}
                               {child.dob && ` • DOB: ${child.dob}`}
                               {child.ssn && ` • SSN: ${child.ssn}`}
                             </Text>
                           </View>
                         </View>
                       </View>
                     ))}
                   </CardContent>
                 </Card>
               )}

               {/* No Documents Message */}
               {uploadedDocuments.length === 0 && 
                homeownerDocuments.length === 0 && 
                medicalDocuments.length === 0 && 
                educationDocuments.length === 0 && 
                (!formData.hasChildren || children.length === 0) && (
                 <Card style={styles.emptyReviewCard}>
                   <CardContent>
                     <View style={styles.emptyReviewContent}>
                       <Feather name="file-text" size={48} color="#ccc" />
                       <Text style={styles.emptyReviewText}>No documents uploaded yet</Text>
                       <Text style={styles.emptyReviewSubtext}>Go back to previous steps to upload your documents</Text>
                     </View>
                   </CardContent>
                 </Card>
               )}

               {/* Submit Button */}
               {(uploadedDocuments.length > 0 || 
                 homeownerDocuments.length > 0 || 
                 medicalDocuments.length > 0 || 
                 educationDocuments.length > 0) && (
                 <Card style={styles.submitCard}>
                   <CardContent>
                     <View style={styles.submitContent}>
                       <Text style={styles.submitTitle}>Ready to File?</Text>
                       <Text style={styles.submitSubtext}>Review your documents and submit your tax return</Text>
                       <Button 
                         style={styles.submitButton}
                         onPress={handleSubmitToAdmin}
                       >
                         <Feather name="send" size={20} color="#fff" />
                         <Text style={styles.submitButtonText}>Submit Tax Return</Text>
                       </Button>
                     </View>
                   </CardContent>
                 </Card>
               )}
             </View>
           </View>
         );
      default:
        return null;
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
          <View style={styles.progressBarContainer}>
            <Progress value={progress} />
          </View>
          {renderStep()}
          <View style={styles.buttonRow}>
            <Button onPress={handleBack} variant="outline" style={styles.buttonNav}>
              <Ionicons name="arrow-back" size={20} color="#007bff" />
              <Text style={styles.buttonText}>Back</Text>
            </Button>
            {step === 7 ? (
              <Button onPress={handleSubmitToAdmin} style={styles.buttonNav}>
                <Text style={styles.buttonText}>Submit</Text>
                <Ionicons name="send" size={20} color="#fff" />
              </Button>
            ) : (
              <Button onPress={handleNext} style={styles.buttonNav}>
                <Text style={styles.buttonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#fff', 
    padding: Math.min(16, screenWidth * 0.04),
    paddingBottom: 20,
  },
  progressBarContainer: { marginBottom: 24 },
  stepContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { 
    backgroundColor: '#007bff', 
    borderRadius: Math.min(32, screenWidth * 0.08), 
    padding: Math.min(16, screenWidth * 0.04), 
    marginBottom: 12 
  },
  stepTitle: { 
    fontSize: Math.min(22, screenWidth * 0.055), 
    fontWeight: 'bold', 
    marginBottom: 4,
    textAlign: 'center',
  },
  stepDescription: { 
    color: '#666', 
    marginBottom: 16,
    fontSize: Math.min(14, screenWidth * 0.035),
    textAlign: 'center',
  },
  cardMuted: { 
    backgroundColor: '#f2f4f8', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 16,
    marginHorizontal: Math.min(16, screenWidth * 0.04), // Add horizontal margins
    width: screenWidth - (Math.min(32, screenWidth * 0.08)), // Ensure it fits within screen width
  },
  helpRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: Math.min(8, screenWidth * 0.02), 
    marginBottom: 8 
  },
  helpTitle: { 
    fontWeight: 'bold', 
    fontSize: Math.min(14, screenWidth * 0.035) 
  },
  helpText: { 
    color: '#888', 
    fontSize: Math.min(12, screenWidth * 0.03) 
  },
  inputGroup: { width: '100%', marginTop: 16 },
  label: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    fontWeight: '500', 
    marginBottom: 4 
  },
  input: { 
    marginBottom: 12, 
    backgroundColor: '#fff', 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 6, 
    padding: Math.min(10, screenWidth * 0.025),
    fontSize: Math.min(14, screenWidth * 0.035),
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 24,
    gap: Math.min(12, screenWidth * 0.03),
  },
  buttonNav: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Math.min(16, screenWidth * 0.04),
    minHeight: Math.max(44, screenWidth * 0.11),
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginHorizontal: Math.min(8, screenWidth * 0.02),
    fontSize: Math.min(14, screenWidth * 0.035),
  },
  checkboxRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  checkboxLabel: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    fontWeight: '500', 
    marginLeft: 8 
  },
  selectTrigger: { 
    height: Math.max(48, screenWidth * 0.12), 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 6, 
    paddingHorizontal: Math.min(10, screenWidth * 0.025) 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 16 
  },
  cardTitle: { 
    fontSize: Math.min(18, screenWidth * 0.045), 
    fontWeight: 'bold', 
    paddingBottom: 8 
  },
  cardSuccess: { 
    backgroundColor: '#e8f5e9', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 16 
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8 
  },
  summaryLabel: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    color: '#666' 
  },
  summaryValue: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    fontWeight: 'bold' 
  },
  refundEstimate: { alignItems: 'center', marginTop: 12 },
  refundLabel: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    color: '#666' 
  },
  refundValue: { 
    fontSize: Math.min(36, screenWidth * 0.09), 
    fontWeight: 'bold', 
    color: '#28a745' 
  },
  refundSubtext: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    color: '#888' 
  },
  uploadActions: { marginTop: 16, marginBottom: 16 },
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
        minWidth: 120,  // Ensure minimum width for better text containment
        flex: 0, // Don't force equal width distribution
      },
  actionButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 8,
  },
  documentCard: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 12 
  },
  documentHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  documentInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  documentDetails: { 
    marginLeft: 12, 
    flex: 1 
  },
  documentName: { 
    fontSize: Math.min(16, screenWidth * 0.04), 
    fontWeight: 'bold', 
    color: '#333' 
  },
  documentMeta: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    color: '#666', 
    marginTop: 2 
  },
  documentActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Math.min(8, screenWidth * 0.02) 
  },
  deleteButton: { 
    padding: Math.min(4, screenWidth * 0.01),
    minHeight: Math.max(44, screenWidth * 0.11),
  },
  progressBar: { marginTop: 8 },
  documentPreview: { 
    marginTop: 12, 
    padding: Math.min(12, screenWidth * 0.03), 
    backgroundColor: '#e9ecef', 
    borderRadius: 8 
  },
  previewTitle: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    fontWeight: 'bold', 
    marginBottom: 8, 
    color: '#333' 
  },
  previewContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: Math.min(16, screenWidth * 0.04) 
  },
  previewText: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    color: '#666', 
    marginTop: 8 
  },
  previewSubtext: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    color: '#888', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  previewWrapper: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: Math.min(120, screenWidth * 0.3), 
    height: Math.min(80, screenWidth * 0.2) 
  },
  documentThumbnail: { 
    width: Math.min(120, screenWidth * 0.3), 
    height: Math.min(80, screenWidth * 0.2), 
    borderRadius: 8, 
    backgroundColor: '#f0f0f0'
  },
  pdfThumbnail: { 
    width: Math.min(120, screenWidth * 0.3), 
    height: Math.min(80, screenWidth * 0.2), 
    borderRadius: 8, 
    backgroundColor: '#f8f9fa', 
    borderWidth: 2, 
    borderColor: '#007bff', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pdfText: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    fontWeight: 'bold', 
    color: '#007bff', 
    marginTop: 4 
  },
  fileThumbnail: { 
    width: Math.min(120, screenWidth * 0.3), 
    height: Math.min(80, screenWidth * 0.2), 
    borderRadius: 8, 
    backgroundColor: '#f8f9fa', 
    borderWidth: 2, 
    borderColor: '#6c757d', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  fileText: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    fontWeight: 'bold', 
    color: '#6c757d', 
    marginTop: 4 
  },
  emptyCard: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 16 
  },
  emptyContent: { 
    alignItems: 'center', 
    padding: Math.min(24, screenWidth * 0.06) 
  },
  emptyText: { 
    fontSize: Math.min(16, screenWidth * 0.04), 
    fontWeight: 'bold', 
    marginTop: 8, 
    color: '#666' 
  },
  emptySubtext: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    color: '#888', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  childrenSection: { marginTop: 16, marginBottom: 16 },
  sectionTitle: { 
    fontSize: Math.min(18, screenWidth * 0.045), 
    fontWeight: 'bold', 
    marginBottom: 4, 
    color: '#333' 
  },
  sectionSubtitle: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    color: '#666', 
    marginBottom: 16 
  },
  childCard: { 
    backgroundColor: '#fff', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#e0e0e0' 
  },
  childCardTitle: { 
    fontSize: Math.min(16, screenWidth * 0.04), 
    fontWeight: 'bold', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  removeChildButton: { 
    padding: Math.min(4, screenWidth * 0.01),
    minHeight: Math.max(44, screenWidth * 0.11),
  },
  childFields: { marginTop: 8 },
  fieldRow: { 
    flexDirection: 'row', 
    gap: Math.min(12, screenWidth * 0.03), 
    marginBottom: 12 
  },
  fieldColumn: { flex: 1 },
  fieldLabel: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    fontWeight: '500', 
    marginBottom: 4, 
    color: '#666' 
  },
  childInput: { 
    backgroundColor: '#f8f9fa', 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 6, 
    padding: Math.min(8, screenWidth * 0.02), 
    fontSize: Math.min(14, screenWidth * 0.035) 
  },
  reviewCard: { 
    backgroundColor: '#fff', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#e0e0e0' 
  },
  reviewCardTitle: { 
    fontSize: Math.min(16, screenWidth * 0.04), 
    fontWeight: 'bold', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Math.min(8, screenWidth * 0.02) 
  },
  reviewCardTitleText: { 
    marginLeft: Math.min(8, screenWidth * 0.02) 
  },
  reviewDocumentItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  reviewDocumentInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  reviewDocumentDetails: { 
    marginLeft: 12, 
    flex: 1 
  },
  reviewDocumentName: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    fontWeight: '500', 
    color: '#333' 
  },
  reviewDocumentMeta: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    color: '#666', 
    marginTop: 2 
  },
  reviewDocumentActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Math.min(8, screenWidth * 0.02) 
  },
  reviewActionButton: { 
    padding: Math.min(4, screenWidth * 0.01),
    minHeight: Math.max(44, screenWidth * 0.11),
  },
  emptyReviewCard: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 16 
  },
  emptyReviewContent: { 
    alignItems: 'center', 
    padding: Math.min(24, screenWidth * 0.06) 
  },
  emptyReviewText: { 
    fontSize: Math.min(16, screenWidth * 0.04), 
    fontWeight: 'bold', 
    marginTop: 8, 
    color: '#666' 
  },
  emptyReviewSubtext: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    color: '#888', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  reviewDocumentPreview: { 
    width: Math.min(60, screenWidth * 0.15), 
    height: Math.min(60, screenWidth * 0.15), 
    borderRadius: 8, 
    marginRight: 12, 
    overflow: 'hidden' 
  },
  reviewPreviewImage: { 
    width: Math.min(60, screenWidth * 0.15), 
    height: Math.min(60, screenWidth * 0.15), 
    borderRadius: 8 
  },
  reviewPreviewPdf: { 
    width: Math.min(60, screenWidth * 0.15), 
    height: Math.min(60, screenWidth * 0.15), 
    borderRadius: 8, 
    backgroundColor: '#fff5f5', 
    borderWidth: 2, 
    borderColor: '#dc3545', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  reviewPreviewFile: { 
    width: Math.min(60, screenWidth * 0.15), 
    height: Math.min(60, screenWidth * 0.15), 
    borderRadius: 8, 
    backgroundColor: '#f8f9fa', 
    borderWidth: 2, 
    borderColor: '#6c757d', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  reviewPreviewText: { 
    fontSize: Math.min(10, screenWidth * 0.025), 
    fontWeight: 'bold', 
    marginTop: 2 
  },
  reviewChildItem: { 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  reviewChildInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  reviewChildAvatar: { 
    width: Math.min(40, screenWidth * 0.1), 
    height: Math.min(40, screenWidth * 0.1), 
    borderRadius: Math.min(20, screenWidth * 0.05), 
    backgroundColor: '#f0f8ff', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  reviewChildDetails: { flex: 1 },
  reviewChildName: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    fontWeight: '500', 
    color: '#333' 
  },
  reviewChildMeta: { 
    fontSize: Math.min(12, screenWidth * 0.03), 
    color: '#666', 
    marginTop: 2 
  },
  submitCard: { 
    backgroundColor: '#e8f5e9', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: 16 
  },
  submitContent: { 
    alignItems: 'center', 
    padding: Math.min(16, screenWidth * 0.04) 
  },
  submitTitle: { 
    fontSize: Math.min(18, screenWidth * 0.045), 
    fontWeight: 'bold', 
    marginBottom: 4, 
    color: '#333' 
  },
  submitSubtext: { 
    fontSize: Math.min(14, screenWidth * 0.035), 
    color: '#666', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  submitButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#28a745', 
    borderRadius: 8, 
    padding: Math.min(12, screenWidth * 0.03), 
    paddingHorizontal: Math.min(24, screenWidth * 0.06),
    minHeight: Math.max(44, screenWidth * 0.11),
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: Math.min(8, screenWidth * 0.02),
    fontSize: Math.min(14, screenWidth * 0.035),
  },
});

export default TaxWizard;