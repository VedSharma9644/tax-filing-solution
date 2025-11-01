import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions, Linking } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import DocumentPreview from './TaxWizard/components/DocumentPreview';
import ImageCacheService from '../services/imageCacheService';
import { BackgroundColors } from '../utils/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  gcsPath: string;
  publicUrl: string;
  previewUrl?: string;
  category: string;
  uploadedAt: string;
  status: 'completed' | 'uploading' | 'error';
  isImage?: boolean;
  uri?: string;
  progress?: number;
}

const DocumentReviewScreen = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cachedImages, setCachedImages] = useState<{[key: string]: string}>({});

  // Load cached images for documents
  const loadCachedImages = async (docs: Document[]) => {
    const imageMap: {[key: string]: string} = {};
    
    for (const doc of docs) {
      const isImage = doc.type?.startsWith('image/') || 
        doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      
      if (isImage) {
        try {
          const cachedImage = await ImageCacheService.getCachedImage(doc.id);
          if (cachedImage) {
            imageMap[doc.id] = `data:${doc.type};base64,${cachedImage.data}`;
            console.log(`📸 Using cached image for: ${doc.name}`);
          }
        } catch (error) {
          console.error(`❌ Error loading cached image for ${doc.name}:`, error);
        }
      }
    }
    
    setCachedImages(imageMap);
  };

  // Fetch documents from GCS via backend
  const fetchDocuments = async () => {
    if (!token || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📄 Fetching documents for user:', user.id);
      
      // Call backend API to get documents from GCS
      const response = await ApiService.getUserDocuments(token);
      
      if (response.success) {
        console.log('✅ Documents fetched successfully:', response.data?.length || 0);
        const docs = response.data || [];
        setDocuments(docs);
        
        // Load cached images for instant display
        await loadCachedImages(docs);
      } else {
        setError(response.error || 'Failed to load documents');
      }
    } catch (err) {
      console.error('❌ Error fetching documents:', err);
      setError('Error loading documents. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token, user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const handleOpenDocument = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Failed to open document:', err);
        Alert.alert('Error', 'Could not open document');
      });
    } else {
      Alert.alert('Error', 'Document URL not available');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteDocument(documentId, token);
              if (response.success) {
                setDocuments(prev => prev.filter(doc => doc.id !== documentId));
              } else {
                Alert.alert('Error', 'Failed to delete document');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'w2Forms': return 'briefcase';
      case 'medical': return 'heartbeat';
      case 'education': return 'graduation-cap';
      case 'dependentChildren': return 'child';
      case 'homeownerDeduction': return 'home';
      case 'personalId': return 'id-card';
      case 'previousYearTax': return 'file-text-o';
      case 'additional_income':
      case 'additionalIncomeGeneral': return 'dollar-sign';
      default: return 'file';
    }
  };

  const getCategoryName = (category: string): string => {
    switch (category) {
      case 'w2Forms': return 'W-2 Forms';
      case 'medical': return 'Medical Documents';
      case 'education': return 'Education Documents';
      case 'dependentChildren': return 'Tax Credits (Dependent Children)';
      case 'homeownerDeduction': return 'Homeowner Deductions';
      case 'personalId': return 'Personal Documents (ID)';
      case 'previousYearTax': return 'Previous Year Tax Documents';
      case 'additional_income':
      case 'additionalIncomeGeneral': return 'Additional Income Documents';
      default: return 'Other Documents';
    }
  };

  const groupDocumentsByCategory = () => {
    const grouped: { [key: string]: Document[] } = {};
    documents.forEach(doc => {
      // Normalize category names - treat additionalIncomeGeneral as additional_income
      let normalizedCategory = doc.category;
      if (doc.category === 'additionalIncomeGeneral') {
        normalizedCategory = 'additional_income';
      }
      
      if (!grouped[normalizedCategory]) {
        grouped[normalizedCategory] = [];
      }
      grouped[normalizedCategory].push(doc);
    });
    return grouped;
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (error) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#dc3545" />
          <Text style={styles.errorTitle}>Error Loading Documents</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Button>
        </View>
      </SafeAreaWrapper>
    );
  }

  const groupedDocuments = groupDocumentsByCategory();

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Review</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#ffffff" />
              <Text style={styles.emptyTitle}>No Documents Found</Text>
              <Text style={styles.emptyMessage}>
                You haven't uploaded any documents yet. Start by uploading your tax documents.
              </Text>
              <Button 
                onPress={() => navigation.navigate('TaxForm')}
                style={styles.uploadButton}
              >
                <Text style={styles.uploadButtonText}>Upload Documents</Text>
              </Button>
            </View>
          ) : (
            <>
              <Text style={styles.summaryText}>
                {documents.length} document{documents.length !== 1 ? 's' : ''} found
              </Text>
              
              {Object.entries(groupedDocuments).map(([category, docs]) => (
                <View key={category} style={styles.categorySection}>
                  <Card style={styles.categoryCard}>
                    <CardHeader>
                      <View style={styles.categoryHeader}>
                        <View style={[styles.categoryIcon, { backgroundColor: '#007bff' }]}>
                          <FontAwesome name={getCategoryIcon(category) as any} size={20} color="#fff" />
                        </View>
                        <View style={styles.categoryInfo}>
                          <CardTitle style={styles.categoryTitle}>
                            {getCategoryName(category)}
                          </CardTitle>
                          <CardDescription style={styles.categoryDescription}>
                            {docs.length} document{docs.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </View>
                      </View>
                    </CardHeader>
                    <CardContent>
                      <View style={styles.documentsList}>
                        {docs.map((doc) => {
                          const isImage = doc.type?.startsWith('image/') || 
                            !!(doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                          
                          // Use cached image if available, otherwise use decryption URL
                          const imageUrl = cachedImages[doc.id] || doc.publicUrl;
                          const hasCachedImage = !!cachedImages[doc.id];
                          
                          console.log(`📄 Document: ${doc.name}, Type: ${doc.type}, IsImage: ${isImage}, HasCached: ${hasCachedImage}, URL: ${imageUrl}`);
                          
                          return (
                            <DocumentPreview
                              key={doc.id}
                              document={{
                                id: doc.id,
                                name: doc.name,
                                type: doc.type,
                                size: doc.size,
                                status: doc.status,
                                isImage: isImage,
                                uri: imageUrl,
                                previewUrl: imageUrl,
                                progress: 100,
                                category: doc.category || 'general',
                                timestamp: new Date(doc.uploadedAt || Date.now())
                              }}
                              onDelete={() => handleDeleteDocument(doc.id)}
                              onReplace={() => handleOpenDocument(doc.publicUrl)}
                              showActions={true}
                            />
                          );
                        })}
                      </View>
                    </CardContent>
                  </Card>
                </View>
              ))}
            </>
          )}
        </ScrollView>

      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001826',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001826',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001826',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#001826',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  uploadButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000', // Black for white card background
  },
  categoryDescription: {
    color: '#666666', // Dark gray for white card background
  },
  documentsList: {
    marginTop: 16,
  },
});

export default DocumentReviewScreen;
