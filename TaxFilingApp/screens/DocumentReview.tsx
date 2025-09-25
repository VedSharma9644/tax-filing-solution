import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DocumentReview = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const [notes, setNotes] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [taxForms, setTaxForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

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
    const approvedForm = getApprovedTaxForm();
    if (!approvedForm) return null;

    return {
      id: approvedForm.id,
      name: `Tax_Review_${approvedForm.taxYear || new Date().getFullYear()}.pdf`,
      uploadedBy: 'Admin',
      uploadedAt: approvedForm.updatedAt?.toDate ? approvedForm.updatedAt.toDate().toLocaleDateString() : 'Unknown',
      status: approvedForm.status,
      size: '2.4 MB', // Mock size for admin document
      adminNotes: approvedForm.adminNotes || '',
      expectedReturn: approvedForm.expectedReturn || 0
    };
  };

  const allDocuments = getAllDocuments();
  const adminDocument = getAdminDocument();

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

  const openDocumentInBrowser = (gcsPath) => {
    if (!gcsPath) {
      Alert.alert('Error', 'Document path not available');
      return;
    }

    // For now, show an alert. In production, this would open the document
    Alert.alert(
      'View Document',
      'This would open the document in a PDF viewer. The document is stored securely and can be viewed by authorized users only.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => {
          // In production, this would open the document using a PDF viewer
          console.log('Opening document:', gcsPath);
        }}
      ]
    );
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
          {/* Header */}
          <View style={styles.header}>
            <Button 
              variant="ghost" 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#007bff" />
            </Button>
            <Text style={styles.headerTitle}>Document Review</Text>
          </View>

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
                <Text style={styles.noDataText}>No approved tax form found. Please wait for admin approval.</Text>
              </CardContent>
            </Card>
          ) : (
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle style={styles.cardTitle}>
                  <FontAwesome name="file-pdf-o" size={24} color="#dc3545" />
                  <Text style={styles.cardTitleText}>Admin Review Document</Text>
                </CardTitle>
                <CardDescription>
                  Review your tax filing document prepared by our team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.documentInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Document:</Text>
                    <Text style={styles.infoValue} numberOfLines={2}>{adminDocument.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Uploaded by:</Text>
                    <Text style={styles.infoValue}>{adminDocument.uploadedBy}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{adminDocument.uploadedAt}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>{adminDocument.status}</Text>
                  </View>
                  {adminDocument.expectedReturn > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Expected Return:</Text>
                      <Text style={styles.infoValue}>${adminDocument.expectedReturn.toFixed(0)}</Text>
                    </View>
                  )}
                  {adminDocument.adminNotes && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Admin Notes:</Text>
                      <Text style={styles.infoValue} numberOfLines={3}>{adminDocument.adminNotes}</Text>
                    </View>
                  )}
                </View>

                <Button 
                  style={styles.viewButton} 
                  onPress={() => handleViewDocument(adminDocument)}
                >
                  <Feather name="eye" size={20} color="#fff" />
                  <Text style={styles.viewButtonText}>View Document</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Personal Documents Section */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <FontAwesome name="user" size={24} color="#007bff" />
                <Text style={styles.cardTitleText}>Your Uploaded Documents</Text>
              </CardTitle>
              <CardDescription>
                Documents you uploaded for tax filing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allDocuments.length === 0 ? (
                <Text style={styles.noDataText}>No documents uploaded yet</Text>
              ) : (
                allDocuments.map(doc => (
                  <View key={doc.id} style={styles.documentItem}>
                    <View style={styles.documentItemHeader}>
                      <FontAwesome name="file-text-o" size={20} color="#007bff" />
                      <View style={styles.documentItemInfo}>
                        <Text style={styles.documentItemTitle} numberOfLines={1}>{doc.category}</Text>
                        <Text style={styles.documentItemName} numberOfLines={1}>{doc.name}</Text>
                        <Text style={styles.documentItemMeta}>
                          {doc.size} • {doc.uploadedAt}
                        </Text>
                      </View>
                    </View>
                    <Button 
                      variant="ghost" 
                      style={styles.viewDocumentButton}
                      onPress={() => handleViewDocument(doc)}
                    >
                      <Feather name="eye" size={16} color="#007bff" />
                    </Button>
                  </View>
                ))
              )}
            </CardContent>
          </Card>


          {/* Review Actions */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#28a745" />
                <Text style={styles.cardTitleText}>Review Actions</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.sectionText}>
                Please review the document carefully. You can either approve it or send notes to the admin for any changes needed.
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
                  style={styles.approveButton} 
                  onPress={handleApprove}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    Approve & Continue
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
                    {selectedDocument?.name || 'Document'}
                  </Text>
                </View>

                <View style={styles.documentPreviewSection}>
                  <Text style={styles.documentPreviewTitle}>Document Details</Text>
                  <View style={styles.documentPreviewInfo}>
                    <Text style={styles.documentPreviewLabel}>Name:</Text>
                    <Text style={styles.documentPreviewValue}>{selectedDocument?.name}</Text>
                  </View>
                  <View style={styles.documentPreviewInfo}>
                    <Text style={styles.documentPreviewLabel}>Category:</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: Math.min(16, screenWidth * 0.04),
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: Math.min(20, screenWidth * 0.05),
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: Math.min(18, screenWidth * 0.045),
    fontWeight: 'bold',
    flex: 1,
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
    color: '#666',
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
    backgroundColor: '#007bff',
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
    color: '#666',
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
    color: '#333',
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
    color: '#333',
    marginBottom: 12,
  },
  documentCard: {
    marginBottom: 8,
    borderRadius: 8,
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
    color: '#333',
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
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    padding: 20,
  },
  noDataText: {
    color: '#666',
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
});

export default DocumentReview; 