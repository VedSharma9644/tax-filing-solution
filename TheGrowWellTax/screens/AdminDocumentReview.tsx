import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import { uploadDocumentToGCS } from '../services/gcsService';
import { BackgroundColors, BrandColors } from '../utils/colors';
import { formatAdminNoteDate } from '../utils/dateUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper functions for status display
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'completed':
      return '#28a745';
    case 'pending':
    case 'in_progress':
      return '#ffc107';
    case 'submitted':
      return '#17a2b8';
    case 'rejected':
    case 'error':
      return '#dc3545';
    case 'draft':
      return '#6c757d';
    default:
      return '#6c757d';
  }
};

// Helper function to clean up document names
const cleanDocumentName = (originalName, docType) => {
  if (!originalName) return 'Tax Document.pdf';
  
  // If it's a problematic name pattern, create a clean one
  if (originalName.includes('document:') || originalName.includes('draft return')) {
    const currentYear = new Date().getFullYear();
    if (docType === 'draft_return') {
      return `Tax Return Draft ${currentYear}.pdf`;
    } else if (docType === 'final_return') {
      return `Tax Return Final ${currentYear}.pdf`;
    } else {
      return `Tax Document ${currentYear}.pdf`;
    }
  }
  
  // If it's already a clean name, return as is
  return originalName;
};

const getStatusDisplayText = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return '✅ Approved';
    case 'completed':
      return '✅ Completed';
    case 'pending':
      return '⏳ Pending Review';
    case 'in_progress':
      return '🔄 In Progress';
    case 'submitted':
      return '📤 Submitted';
    case 'rejected':
      return '❌ Rejected';
    case 'error':
      return '❌ Error';
    case 'draft':
      return '📝 Draft';
    default:
      return status || 'Unknown';
  }
};

const DocumentReview = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const [notes, setNotes] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [taxForms, setTaxForms] = useState([]);
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [additionalDocuments, setAdditionalDocuments] = useState([]);

  // Fetch admin documents
  const fetchAdminDocuments = async () => {
    if (!token) return;

    try {
      console.log('📄 Fetching admin documents...');
      const response = await ApiService.getAdminDocuments(token);
      
      if (response && response.success) {
        console.log('✅ Admin documents fetched:', response.data?.length || 0);
        setAdminDocuments(response.data || []);
      } else {
        console.log('📄 No admin documents available');
        setAdminDocuments([]);
      }
    } catch (err) {
      console.log('📄 Admin documents not available:', err.message);
      setAdminDocuments([]);
    }
  };

  // Fetch additional user uploaded documents
  const fetchAdditionalDocuments = async () => {
    if (!token) return;

    try {
      console.log('📄 Fetching additional user documents...');
      const response = await ApiService.getUserDocuments(token);
      
      if (response && response.success) {
        console.log('✅ Additional documents fetched:', response.data?.length || 0);
        setAdditionalDocuments(response.data || []);
      } else {
        console.log('📄 No additional documents available');
        setAdditionalDocuments([]);
      }
    } catch (err) {
      console.log('📄 Additional documents not available:', err.message);
      setAdditionalDocuments([]);
    }
  };

  // Fetch tax forms data
  useEffect(() => {
    const fetchTaxForms = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await ApiService.getTaxFormHistory(token);
        if (response.success) {
          setTaxForms(response.data || []);
        } else {
          setError('Failed to load tax forms');
        }
      } catch (err) {
        console.error('Error fetching tax forms:', err);
        setError('Error loading tax forms');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxForms();
    fetchAdminDocuments();
    fetchAdditionalDocuments();
  }, [token]);

  // Get the most recent approved tax form
  const getApprovedTaxForm = () => {
    return taxForms.find(form => form.status === 'approved') || taxForms[0];
  };

  // Get all documents from the approved tax form
  const getAllDocuments = () => {
    const approvedForm = getApprovedTaxForm();
    if (!approvedForm || !approvedForm.documents) return [];

    return approvedForm.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      category: doc.category,
      gcsPath: doc.gcsPath,
      uploadedAt: doc.uploadedAt?.toDate ? doc.uploadedAt.toDate().toLocaleDateString() : 'Unknown',
      size: doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
      type: 'Personal Document'
    }));
  };

  // Get admin document (if any)
  const getAdminDocument = () => {
    console.log('🔍 Getting admin document...');
    console.log('📄 Admin documents available:', adminDocuments?.length || 0);
    console.log('📄 Admin documents data:', JSON.stringify(adminDocuments, null, 2));
    
    // First try to get from admin documents API
    if (adminDocuments && adminDocuments.length > 0) {
      // Find the most recent draft or final return
      const adminDoc = adminDocuments.find(doc => 
        doc.type === 'draft_return' || doc.type === 'final_return'
      ) || adminDocuments[0];

      console.log('📄 Selected admin document:', adminDoc);

      if (adminDoc) {
        // Find admin notes separately
        const adminNotesDoc = adminDocuments.find(doc => doc.type === 'admin_notes');
        const adminNotes = adminNotesDoc ? adminNotesDoc.content : '';
        
        console.log('📄 Admin notes found:', adminNotesDoc ? 'Yes' : 'No');
        console.log('📄 Admin notes content:', adminNotes);

        const document = {
          id: adminDoc.id,
          name: cleanDocumentName(adminDoc.name, adminDoc.type),
          uploadedBy: 'Admin',
          uploadedAt: adminDoc.createdAt ? new Date(adminDoc.createdAt).toLocaleDateString() : 'Unknown',
          status: adminDoc.status || 'pending',
          size: adminDoc.size ? `${(adminDoc.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
          adminNotes: adminNotes,
          publicUrl: adminDoc.publicUrl,
          gcsPath: adminDoc.gcsPath,
          type: adminDoc.type,
          applicationId: adminDoc.applicationId
        };
        
        console.log('✅ Using real admin document:', document);
        console.log('📊 Status details:', {
          originalStatus: adminDoc.status,
          displayText: getStatusDisplayText(adminDoc.status),
          color: getStatusColor(adminDoc.status)
        });
        return document;
      }
    }

    // Fallback to tax form data (legacy)
    console.log('📄 No admin documents found, falling back to tax form data');
    const approvedForm = getApprovedTaxForm();
    if (!approvedForm) {
      console.log('📄 No approved tax form found');
      return null;
    }

    const fallbackDocument = {
      id: approvedForm.id,
      name: `Tax Return Review ${approvedForm.taxYear || new Date().getFullYear()}.pdf`,
      uploadedBy: 'Admin',
      uploadedAt: approvedForm.updatedAt?.toDate ? approvedForm.updatedAt.toDate().toLocaleDateString() : 'Unknown',
      status: approvedForm.status,
      size: '2.4 MB', // Mock size for admin document
      adminNotes: approvedForm.adminNotes || '',
      expectedReturn: approvedForm.expectedReturn || 0
    };
    
    console.log('📄 Using fallback document:', fallbackDocument);
    return fallbackDocument;
  };

  const allDocuments = getAllDocuments();
  const adminDocument = getAdminDocument();
  
  // Check if application is under review (button should be disabled)
  const isUnderReview = () => {
    const approvedForm = getApprovedTaxForm();
    return approvedForm && approvedForm.status === 'under_review';
  };

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const handleAcceptDocuments = () => {
    if (!acceptedTerms) {
      Alert.alert('Terms & Conditions', 'Please accept the terms and conditions to proceed.');
      return;
    }

    setShowApprovalModal(false);
    setIsApproved(true);
    
    // Navigate to Payment after a brief delay
    setTimeout(() => {
      navigation.navigate('Payment');
    }, 1500);
  };

  const handleRejectDocuments = () => {
    setShowApprovalModal(false);
    Alert.alert(
      'Documents Rejected',
      'Your documents have been rejected. Please review and make necessary changes before proceeding.',
      [{ text: 'OK' }]
    );
  };

  const handleSendNotes = () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please enter your notes before sending.');
      return;
    }

    Alert.alert(
      'Send Notes',
      'Are you sure you want to send these notes to the admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            Alert.alert('Success', 'Your notes have been sent to the admin. They will review and make necessary changes.');
            setNotes('');
          }
        }
      ]
    );
  };

  const handleViewDocument = (document) => {
    if (!document) return;
    
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const openDocumentInBrowser = (document) => {
    if (!document) {
      Alert.alert('Error', 'Document not available');
      return;
    }

    // Try to use publicUrl first, then gcsPath
    const url = document.publicUrl || document.gcsPath;
    
    if (!url) {
      Alert.alert('Error', 'Document URL not available');
      return;
    }

    console.log('🔗 Opening document URL:', url);
    
    // Open the document URL
    Linking.openURL(url).catch(err => {
      console.error('Failed to open document:', err);
      Alert.alert('Error', 'Could not open document. Please try again.');
    });
  };

  // Document upload functionality
  const handleUploadDocument = () => {
    setShowUploadModal(true);
  };

  const pickDocument = async () => {
    if (!uploadCategory) {
      Alert.alert('Select Category', 'Please select a document category first.');
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
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const uploadFile = async (file) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setShowUploadModal(false);

    try {
      console.log('📤 Starting document upload:', file.name);
      
      const result = await uploadDocumentToGCS(
        file,
        user.id,
        uploadCategory,
        (progress) => {
          setUploadProgress(progress);
        },
        token
      );

      if (result.success) {
        console.log('✅ Document uploaded successfully');
        Alert.alert(
          'Success',
          'Document uploaded successfully! The admin will review it.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Refresh the document list
                fetchAdminDocuments();
                fetchAdditionalDocuments();
                // Refresh tax forms data
                try {
                  const response = await ApiService.getTaxFormHistory(token);
                  if (response.success) {
                    setTaxForms(response.data || []);
                  }
                } catch (error) {
                  console.error('Error refreshing tax forms:', error);
                }
                // Reset upload state
                setUploadCategory('');
                setUploadDescription('');
                setUploadProgress(0);
              }
            }
          ]
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload document. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelUpload = () => {
    setShowUploadModal(false);
    setUploadCategory('');
    setUploadDescription('');
    setUploadProgress(0);
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView 
        style={styles.mainContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Button 
              variant="ghost" 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </Button>
            <Text style={styles.headerTitle}>Admin Document Review</Text>
          </View>

          {/* Document Info Section Title */}
          {!loading && !error && adminDocument && (
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                <FontAwesome name="file-pdf-o" size={24} color="#D7B04C" />
                <Text style={styles.sectionTitleText}> Review Filed Tax Document</Text>
              </Text>
            </View>
          )}

          {/* Document Info Card */}
          {loading ? (
            <Card style={styles.card}>
              <CardContent>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007bff" />
                  <Text style={styles.loadingText}>Loading tax form data...</Text>
                </View>
              </CardContent>
            </Card>
          ) : error ? (
            <Card style={styles.card}>
              <CardContent>
                <Text style={styles.errorText}>{error}</Text>
              </CardContent>
            </Card>
          ) : !adminDocument ? (
            <Card style={styles.card}>
              <CardContent>
                <Text style={styles.noDataText}>⏳ No approved tax form found. Please wait for admin approval.</Text>
              </CardContent>
            </Card>
          ) : (
            <Card style={styles.card}>
              <CardContent>
                <View style={styles.documentInfo}>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📅 Date:</Text>
                    <Text style={styles.dataValue}>{adminDocument.uploadedAt}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📊 Status:</Text>
                    <Text style={[
                      styles.dataValue,
                      { color: getStatusColor(adminDocument.status) }
                    ]}>
                      {getStatusDisplayText(adminDocument.status)}
                    </Text>
                  </View>
                  {'expectedReturn' in adminDocument && adminDocument.expectedReturn > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>💰 Expected Return:</Text>
                      <Text style={[styles.dataValue, { color: '#28a745', fontWeight: '600' }]}>
                        ${adminDocument.expectedReturn.toFixed(0)}
                      </Text>
                    </View>
                  )}
                </View>

                <Button 
                  style={styles.viewButton} 
                  onPress={() => openDocumentInBrowser(adminDocument)}
                >
                  <Feather name="eye" size={20} color="#fff" />
                  <Text style={styles.viewButtonText}>View Document</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes Section Title */}
          {(() => {
            const hasAdminNotes = adminDocuments && adminDocuments.some(doc => doc.type === 'admin_notes');
            console.log('🔍 Admin notes section check:', {
              adminDocuments: adminDocuments?.length || 0,
              hasAdminNotes,
              adminNotesDocs: adminDocuments?.filter(doc => doc.type === 'admin_notes') || []
            });
            return hasAdminNotes;
          })() && (
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="chatbubble-outline" size={24} color="#D7B04C" />
                <Text style={styles.sectionTitleText}> Admin Notes</Text>
              </Text>
            </View>
          )}

          {/* Admin Notes Section */}
          {(() => {
            const hasAdminNotes = adminDocuments && adminDocuments.some(doc => doc.type === 'admin_notes');
            console.log('🔍 Admin notes section check:', {
              adminDocuments: adminDocuments?.length || 0,
              hasAdminNotes,
              adminNotesDocs: adminDocuments?.filter(doc => doc.type === 'admin_notes') || []
            });
            return hasAdminNotes;
          })() && (
            <Card style={styles.card}>
              <CardContent>
                {adminDocuments
                  .filter(doc => {
                    const isAdminNotes = doc.type === 'admin_notes';
                    console.log('🔍 Filtering admin notes:', { docType: doc.type, isAdminNotes, content: doc.content });
                    return isAdminNotes;
                  })
                  .map((note, index) => {
                    console.log('🔍 Rendering admin note:', { index, note });
                    return (
                    <View key={note.id || index} style={styles.adminNoteItem}>
                      <View style={styles.adminNoteHeader}>
                        <Text style={styles.adminNoteText}>{note.content}</Text>
                        <View style={styles.adminNoteMeta}>
                          <Text style={styles.adminNoteDate}>
                            {note.createdAt ? formatAdminNoteDate(note.createdAt) : 'Unknown date'}
                          </Text>
                          {note.status && (
                            <Text style={[
                              styles.dataValue,
                              { color: getStatusColor(note.status), fontSize: 12 }
                            ]}>
                              {getStatusDisplayText(note.status)}
                            </Text>
                          )}
                        </View>
                        {note.applicationId && (
                          <Text style={[styles.dataValue, { fontSize: 11, color: '#999' }]}>
                            🆔 Application: {note.applicationId}
                          </Text>
                        )}
                      </View>
                    </View>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* Upload New Document Section Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="cloud-upload-outline" size={24} color="#D7B04C" />
              <Text style={styles.sectionTitleText}> Upload Additional Documents</Text>
            </Text>
          </View>

          {/* Upload New Document Section */}
          <Card style={styles.card}>
            <CardContent>
              
              
              <Button 
                style={styles.uploadButton} 
                onPress={handleUploadDocument}
                disabled={isUploading}
              >
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </Text>
              </Button>

              {isUploading && (
                <View style={styles.uploadProgressContainer}>
                  <Text style={styles.uploadProgressText}>
                    Uploading... {uploadProgress}%
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                  </View>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Additional Uploaded Documents Section Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              <FontAwesome name="user" size={24} color="#D7B04C" />
              <Text style={styles.sectionTitleText}> Your Documents</Text>
            </Text>
          </View>

          {/* Additional Uploaded Documents Section */}
          <Card style={styles.card}>
            <CardContent>
              {additionalDocuments.length === 0 ? (
                <Text style={styles.noDataText}>📭 No additional documents uploaded yet</Text>
              ) : (
                additionalDocuments.map(doc => (
                  <View key={doc.id} style={styles.documentItem}>
                    <View style={styles.documentItemHeader}>
                      <FontAwesome name="file-text-o" size={20} color="#007bff" />
                      <View style={styles.documentItemInfo}>
                        <Text style={[styles.dataValue, { fontSize: 14, fontWeight: '600' }]} numberOfLines={1}>
                          📁 {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                        </Text>
                        <Text style={[styles.dataValue, { fontSize: 14 }]} numberOfLines={1}>{doc.name}</Text>
                        <Text style={[styles.dataValue, { fontSize: 12, color: '#666' }]}>
                          📏 {doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown'} • 📅 {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Button 
                      variant="ghost" 
                      style={styles.viewDocumentButton}
                      onPress={() => openDocumentInBrowser(doc)}
                    >
                      <Feather name="eye" size={16} color="#007bff" />
                    </Button>
                  </View>
                ))
              )}
            </CardContent>
          </Card>


          {/* Review Actions Section Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#D7B04C" />
              <Text style={styles.sectionTitleText}> Review Actions</Text>
            </Text>
          </View>

          {/* Review Actions */}
          <Card style={styles.card}>
            <CardContent>
              <Text style={styles.sectionText}>
                Please review the document carefully. You can either approve it or send notes to the CA Team for any changes needed.
              </Text>

              {/* Notes Section */}
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes to Admin (Optional):</Text>
                <Textarea
                  placeholder="Enter any notes or changes you'd like the admin to make..."
                  value={notes}
                  onChangeText={setNotes}
                  style={styles.notesInput}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button 
                  style={isUnderReview() ? 
                    {...styles.approveButton, ...styles.disabledButton} : 
                    styles.approveButton
                  } 
                  onPress={isUnderReview() ? null : handleApprove}
                  disabled={isUnderReview()}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {isUnderReview() ? 'Under Review' : 'Approve & Continue'}
                  </Text>
                </Button>

                <Button 
                  style={styles.notesButton} 
                  onPress={handleSendNotes}
                  disabled={!notes.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Send Notes</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Status Indicator */}
          {isApproved && (
            <Card style={[styles.card, styles.approvedCard]}>
              <CardContent>
                <View style={styles.approvedContent}>
                  <Ionicons name="checkmark-circle" size={32} color="#28a745" />
                  <Text style={styles.approvedText}>
                    Document approved! Redirecting to payment...
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Document Approval Modal */}
          <Modal
            visible={showApprovalModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowApprovalModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <ScrollView 
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <Ionicons name="document-text" size={32} color="#007bff" />
                    <Text style={styles.modalTitle}>Document Approval</Text>
                    <Text style={styles.modalSubtitle}>
                      Please review all documents and accept terms before proceeding
                    </Text>
                  </View>

                  {/* All Documents List */}
                  <View style={styles.documentsSection}>
                    <Text style={styles.documentsSectionTitle}>All Documents ({allDocuments.length})</Text>
                    {allDocuments.map((doc, index) => (
                      <Card key={doc.id} style={styles.documentCard}>
                        <CardContent>
                          <View style={styles.documentCardHeader}>
                            <FontAwesome name="file-text-o" size={20} color="#007bff" />
                            <View style={styles.documentCardInfo}>
                              <Text style={styles.documentCardTitle} numberOfLines={2}>
                                {'title' in doc ? doc.title : doc.name}
                              </Text>
                              <Text style={styles.documentCardType}>{doc.type}</Text>
                              <Text style={styles.documentCardMeta}>
                                {doc.size} • {doc.uploadedAt}
                              </Text>
                              {'description' in doc && doc.description && (
                                <Text style={styles.documentCardDesc} numberOfLines={2}>{doc.description}</Text>
                              )}
                            </View>
                          </View>
                        </CardContent>
                      </Card>
                    ))}
                  </View>

                  {/* Terms & Conditions */}
                  <View style={styles.termsSection}>
                    <Text style={styles.termsTitle}>Terms & Conditions</Text>
                    <ScrollView style={styles.termsContent}>
                      <Text style={styles.termsText}>
                        1. I confirm that all information provided is accurate and complete to the best of my knowledge.{'\n\n'}
                        2. I understand that I am responsible for the accuracy of all documents and information submitted.{'\n\n'}
                        3. I authorize the tax preparation service to file my tax return on my behalf.{'\n\n'}
                        4. I agree to pay the service fee upon successful filing of my tax return.{'\n\n'}
                        5. I understand that any errors or omissions may result in penalties or delays.{'\n\n'}
                        6. I acknowledge that I have reviewed all documents and approve them for filing.{'\n\n'}
                        7. I understand that I can request changes before final submission.
                      </Text>
                    </ScrollView>
                    
                    <View style={styles.termsCheckbox}>
                      <Checkbox
                        checked={acceptedTerms}
                        onCheckedChange={setAcceptedTerms}
                      />
                      <Text style={styles.termsCheckboxText}>
                        I accept the terms and conditions
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Actions */}
                <View style={styles.modalActions}>
                  <Button 
                    style={styles.rejectButton} 
                    onPress={handleRejectDocuments}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Reject</Text>
                  </Button>
                  
                  <Button 
                    style={styles.acceptButton} 
                    onPress={handleAcceptDocuments}
                    disabled={!acceptedTerms}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Accept & Continue</Text>
                  </Button>
                </View>
              </View>
            </View>
          </Modal>

          {/* Document Viewing Modal */}
          <Modal
            visible={showDocumentModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowDocumentModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <FontAwesome name="file-text-o" size={32} color="#007bff" />
                  <Text style={styles.modalTitle}>Document Preview</Text>
                  <Text style={styles.modalSubtitle}>
                    Document Preview
                  </Text>
                </View>

                <View style={styles.documentPreviewSection}>
                  <Text style={styles.documentPreviewTitle}>Document Details</Text>
                  <View style={styles.documentPreviewInfo}>
                    <Text style={styles.documentPreviewLabel}>Category:</Text>` 3`
                    <Text style={styles.documentPreviewValue}>{selectedDocument?.category}</Text>
                  </View>
                  <View style={styles.documentPreviewInfo}>
                    <Text style={styles.documentPreviewLabel}>Size:</Text>
                    <Text style={styles.documentPreviewValue}>{selectedDocument?.size}</Text>
                  </View>
                  <View style={styles.documentPreviewInfo}>
                    <Text style={styles.documentPreviewLabel}>Uploaded:</Text>
                    <Text style={styles.documentPreviewValue}>{selectedDocument?.uploadedAt}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button 
                    style={styles.cancelButton} 
                    onPress={() => setShowDocumentModal(false)}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Close</Text>
                  </Button>
                  
                  <Button 
                    style={styles.openButton} 
                    onPress={() => {
                      setShowDocumentModal(false);
                      openDocumentInBrowser(selectedDocument?.gcsPath);
                    }}
                  >
                    <Feather name="external-link" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Open Document</Text>
                  </Button>
                </View>
              </View>
            </View>
          </Modal>

          {/* Upload Document Modal */}
          <Modal
            visible={showUploadModal}
            animationType="slide"
            transparent={true}
            onRequestClose={cancelUpload}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <ScrollView 
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <Ionicons name="cloud-upload" size={32} color="#007bff" />
                    <Text style={styles.modalTitle}>Upload Document</Text>
                    <Text style={styles.modalSubtitle}>
                      Select document category and upload file
                    </Text>
                  </View>

                  {/* Document Category Selection */}
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadSectionTitle}>Document Category</Text>
                    <View style={styles.categoryGrid}>
                      {[
                        { id: 'w2Forms', name: 'W-2 Forms', icon: 'file-text-o' },
                        { id: 'medical', name: 'Medical Documents', icon: 'file-text-o' },
                        { id: 'education', name: 'Education Documents', icon: 'book' },
                        { id: 'homeownerDeduction', name: 'Homeowner Documents', icon: 'home' },
                        { id: 'personalId', name: 'Personal ID', icon: 'id-card-o' },
                        { id: 'other', name: 'Other Documents', icon: 'file-o' }
                      ].map((category) => (
                        <Button
                          key={category.id}
                          variant={uploadCategory === category.id ? "default" : "outline"}
                          style={uploadCategory === category.id ? 
                            {...styles.categoryButton, ...styles.selectedCategoryButton} : 
                            styles.categoryButton
                          }
                          onPress={() => setUploadCategory(category.id)}
                        >
                          <FontAwesome name={category.icon as any} size={16} color={uploadCategory === category.id ? "#fff" : "#007bff"} />
                          <Text style={[
                            styles.categoryButtonText,
                            uploadCategory === category.id && styles.selectedCategoryButtonText
                          ]}>
                            {category.name}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  </View>

                  {/* Description Section */}
                  <View style={styles.uploadSection}>
                    <Text style={styles.uploadSectionTitle}>Description (Optional)</Text>
                    <Textarea
                      placeholder="Add a description for this document..."
                      value={uploadDescription}
                      onChangeText={setUploadDescription}
                      style={styles.uploadDescriptionInput}
                    />
                  </View>
                </ScrollView>

                {/* Modal Actions */}
                <View style={styles.modalActions}>
                  <Button 
                    style={styles.cancelButton} 
                    onPress={cancelUpload}
                  >
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </Button>
                  
                  <Button 
                    style={styles.uploadModalButton} 
                    onPress={pickDocument}
                    disabled={!uploadCategory}
                  >
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Select & Upload</Text>
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#001826',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#001826',
    paddingHorizontal: Math.min(16, screenWidth * 0.04),
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: Math.min(20, screenWidth * 0.05),
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: Math.min(18, screenWidth * 0.045),
    fontWeight: 'bold',
    color: '#D7B04C',
  },
  // Section titles outside cards
  sectionTitleContainer: {
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: Math.min(18, screenWidth * 0.045),
    fontWeight: 'bold',
    color: '#D7B04C',
  },
  documentInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#D7B04C',
    fontSize: Math.min(14, screenWidth * 0.035),
  },
  infoValue: {
    fontWeight: '600',
    color: '#333',
    fontSize: Math.min(14, screenWidth * 0.035),
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 16,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: Math.min(14, screenWidth * 0.035),
    fontWeight: '600',
    marginBottom: 8,
    color: '#D7B04C',
  },
  notesInput: {
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: Math.min(14, screenWidth * 0.035),
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    fontWeight: 'bold',
    backgroundColor: '#28a745',
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    fontWeight: 'bold',
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  approvedCard: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  approvedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  approvedText: {
    fontSize: Math.min(16, screenWidth * 0.04),
    fontWeight: '600',
    color: '#155724',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  documentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  documentItemTitle: {
    fontWeight: 'bold',
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#333',
  },
  documentItemName: {
    fontSize: Math.min(12, screenWidth * 0.03),
    color: '#666',
    marginTop: 2,
  },
  documentItemMeta: {
    fontSize: Math.min(11, screenWidth * 0.028),
    color: '#888',
    marginTop: 2,
  },
  documentItemDesc: {
    fontSize: Math.min(11, screenWidth * 0.028),
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  viewDocumentButton: {
    padding: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: Math.min(20, screenWidth * 0.05),
    maxHeight: screenHeight * 0.9,
    width: screenWidth * 0.9,
  },
  modalScrollView: {
    padding: Math.min(20, screenWidth * 0.05),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: Math.min(24, screenWidth * 0.06),
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  documentsSection: {
    marginBottom: 24,
  },
  documentsSectionTitle: {
    fontSize: Math.min(18, screenWidth * 0.045),
    fontWeight: 'bold',
    color: '#D7B04C',
    marginBottom: 12,
  },
  documentCard: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  documentCardTitle: {
    fontWeight: 'bold',
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#333',
  },
  documentCardType: {
    fontSize: Math.min(12, screenWidth * 0.03),
    color: '#007bff',
    fontWeight: '500',
    marginTop: 2,
  },
  documentCardMeta: {
    fontSize: Math.min(11, screenWidth * 0.028),
    color: '#888',
    marginTop: 2,
  },
  documentCardDesc: {
    fontSize: Math.min(11, screenWidth * 0.028),
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  termsSection: {
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: Math.min(18, screenWidth * 0.045),
    fontWeight: 'bold',
    color: '#D7B04C',
    marginBottom: 12,
  },
  termsContent: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  termsText: {
    fontSize: Math.min(12, screenWidth * 0.03),
    color: '#666',
    lineHeight: 18,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  termsCheckboxText: {
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#333',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: Math.min(20, screenWidth * 0.05),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    fontWeight: 'bold',
    backgroundColor: '#dc3545',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    fontWeight: 'bold',
    backgroundColor: '#28a745',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: 20,
  },
  noDataText: {
    color: '#ffffff',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  documentPreviewSection: {
    marginBottom: 20,
  },
  documentPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  documentPreviewInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  documentPreviewLabel: {
    fontWeight: '500',
    color: '#666',
    fontSize: 14,
  },
  documentPreviewValue: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#6c757d',
  },
  openButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  // Admin notes styles
  adminNoteItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  adminNoteHeader: {
    flex: 1,
  },
  adminNoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  adminNoteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminNoteDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  adminNoteStatus: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  adminNoteAppId: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  // Status display styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  // Consistent data value styling
  dataValue: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
    color: '#333',
  },
  // Upload styles
  uploadButton: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  uploadProgressContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  uploadProgressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
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
    borderRadius: 2,
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: 'transparent',
    minWidth: '45%',
    justifyContent: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#007bff',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  uploadDescriptionInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  uploadModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  // Disabled button style
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
});

export default DocumentReview; 