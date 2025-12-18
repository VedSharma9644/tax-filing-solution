import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import ApiService from '../services/api';
import ImageCacheService from '../services/imageCacheService';
import { BackgroundColors } from '../utils/colors';
import Toast from '../components/Toast';

const Dashboard = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { unreadCount, startAdminPolling, stopAdminPolling } = useNotifications();
  const [taxForms, setTaxForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreloadProgress, setImagePreloadProgress] = useState(null);
  const [isPreloadingImages, setIsPreloadingImages] = useState(false);
  const [userDocuments, setUserDocuments] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [adminDocuments, setAdminDocuments] = useState([]);

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    // If user has both firstName and lastName, use both
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // If user has only firstName, use it
    if (user.firstName) {
      return user.firstName;
    }
    
    // If user has only lastName, use it
    if (user.lastName) {
      return user.lastName;
    }
    
    // If user has email, extract name from email
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    // Fallback to 'User'
    return 'User';
  };

  // Background image pre-loading
  const preloadDocumentImages = async () => {
    if (!token || isPreloadingImages) return;
    
    try {
      setIsPreloadingImages(true);
      console.log('🚀 Starting background image pre-loading...');
      
      // Fetch documents
      const documents = await ApiService.getUserDocuments(token);
      
      if (documents && documents.length > 0) {
        // Start pre-loading images in background
        ImageCacheService.preloadImages(documents, token, (progress) => {
          setImagePreloadProgress(progress);
          console.log(`📸 Preload progress: ${progress.completed}/${progress.total} images`);
        }).then((results) => {
          console.log('🎉 Background pre-loading completed:', results);
          setImagePreloadProgress(null);
        }).catch((error) => {
          console.error('❌ Background pre-loading failed:', error);
        }).finally(() => {
          setIsPreloadingImages(false);
        });
      }
    } catch (error) {
      console.error('❌ Error starting background pre-loading:', error);
      setIsPreloadingImages(false);
    }
  };

  // Fetch tax forms data and admin documents
  useEffect(() => {
    const fetchTaxForms = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Fetching tax form history with token:', token ? 'Present' : 'Missing');
        const response = await ApiService.getTaxFormHistory(token);
        console.log('📊 Tax form history response:', response);
        if (response.success) {
          setTaxForms(response.data || []);
          console.log('✅ Tax forms loaded:', response.data?.length || 0, 'forms');
        } else {
          console.error('❌ API returned error:', response.error);
          setError(`Failed to load tax forms: ${response.error}`);
        }
      } catch (err) {
        console.error('❌ Error fetching tax forms:', err);
        setError(`Error loading tax forms: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxForms();
    fetchUserDocuments();
    
    // Start admin notification polling when user is authenticated
    if (token) {
      startAdminPolling(token);
    }
  }, [token]);

  // Fetch admin documents when application is submitted
  useEffect(() => {
    const fetchAdminDocuments = async () => {
      if (!token) return;
      
      // Check if application is submitted
      if (taxForms.length === 0) return;
      
      const currentYear = new Date().getFullYear();
      const currentYearForm = taxForms.find(form => form.taxYear === currentYear);
      if (!currentYearForm) return;
      
      const submittedStatuses = ['submitted', 'under_review', 'processing', 'approved', 'completed'];
      if (!submittedStatuses.includes(currentYearForm.status)) return;
      
      try {
        const response = await ApiService.getAdminDocuments(token);
        if (response.success) {
          setAdminDocuments(response.data || []);
          console.log('✅ Admin documents loaded:', response.data?.length || 0, 'documents');
        }
      } catch (err) {
        console.error('❌ Error fetching admin documents:', err);
      }
    };

    fetchAdminDocuments();
  }, [token, taxForms]);

  // Cleanup admin polling when component unmounts
  useEffect(() => {
    return () => {
      stopAdminPolling();
    };
  }, []);

  // Start background image pre-loading when user is authenticated
  useEffect(() => {
    if (user && token && !isPreloadingImages) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => {
        preloadDocumentImages();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, token]);


  // Calculate expected refund from latest tax form
  const getExpectedRefund = () => {
    if (taxForms.length === 0) return 0;
    const latestForm = taxForms[0]; // Assuming forms are sorted by date
    return latestForm.expectedReturn || 0;
  };

  // Fetch user documents to determine step completion
  const fetchUserDocuments = async () => {
    if (!token) return;
    
    try {
      const response = await ApiService.getUserDocuments(token);
      if (response.success) {
        setUserDocuments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching user documents:', error);
    }
  };

  // Determine step completion based on uploaded documents
  const getStepCompletion = () => {
    const documents = userDocuments || [];
    
    // Step 1 & 2: Income Documents (W-2 Forms, Previous Year Tax)
    const hasIncomeDocs = documents.some(doc => 
      doc.category === 'w2Forms' || doc.category === 'previousYearTax'
    );
    
    // Step 3: Deduction Documents (Medical, Education, Homeowner, Dependent Children)
    const hasDeductionDocs = documents.some(doc => 
      doc.category === 'medical' || 
      doc.category === 'education' || 
      doc.category === 'homeownerDeduction' || 
      doc.category === 'dependentChildren'
    );
    
    // Step 4: Personal Information (Personal ID)
    const hasPersonalInfo = documents.some(doc => 
      doc.category === 'personalId'
    );

    return {
      incomeDocuments: hasIncomeDocs,
      deductionDocuments: hasDeductionDocs,
      personalInformation: hasPersonalInfo
    };
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const completion = getStepCompletion();
    let completedSteps = 0;
    let totalSteps = 3;
    
    if (completion.incomeDocuments) completedSteps++;
    if (completion.deductionDocuments) completedSteps++;
    if (completion.personalInformation) completedSteps++;
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  // Get current year tax form data (only show current year, not previous years)
  const getCurrentYearTaxForm = () => {
    if (taxForms.length === 0) {
      return {
        year: new Date().getFullYear(),
        status: "no_data",
        progress: 0,
        refund: 0
      };
    }

    // Get the most recent tax form for current year only
    const currentYear = new Date().getFullYear();
    const currentYearForm = taxForms.find(form => form.taxYear === currentYear) || taxForms[0];
    
    return {
      year: currentYearForm.taxYear || currentYear,
      status: currentYearForm.status === 'completed' || currentYearForm.status === 'approved' ? 'completed' : 'in_progress',
      progress: currentYearForm.status === 'completed' || currentYearForm.status === 'approved' ? 100 : 65,
      refund: currentYearForm.expectedReturn || 0
    };
  };

  // Check if user has submitted their application for the current year
  const hasSubmittedApplication = () => {
    if (taxForms.length === 0) return false;
    
    const currentYear = new Date().getFullYear();
    const currentYearForm = taxForms.find(form => form.taxYear === currentYear);
    
    if (!currentYearForm) return false;
    
    // Check if the form has been submitted or is in any post-submission state
    const submittedStatuses = ['submitted', 'under_review', 'processing', 'approved', 'completed'];
    return submittedStatuses.includes(currentYearForm.status);
  };

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // Check if draft document exists
  const hasDraftDocument = () => {
    if (!adminDocuments || adminDocuments.length === 0) return false;
    return adminDocuments.some(doc => doc.type === 'draft_return');
  };

  // Check if final document exists
  const hasFinalDocument = () => {
    if (!adminDocuments || adminDocuments.length === 0) return false;
    return adminDocuments.some(doc => doc.type === 'final_return');
  };

  // Get final document
  const getFinalDocument = () => {
    if (!adminDocuments || adminDocuments.length === 0) return null;
    return adminDocuments.find(doc => doc.type === 'final_return') || null;
  };

  // Download final document
  const handleDownloadFinalDocument = async () => {
    console.log('🔘 [Download Final Document] Button clicked');
    
    if (!hasSubmittedApplication()) {
      console.log('❌ [Download Final Document] Application not submitted yet');
      showToast('Please submit the application first');
      return;
    }

    console.log('✅ [Download Final Document] Application submitted, checking for final document...');

    const finalDoc = getFinalDocument();
    if (!finalDoc) {
      console.log('❌ [Download Final Document] No final document found in admin documents');
      Alert.alert('Not Available', 'Final document has not been uploaded yet. Please wait for the admin to upload it.');
      return;
    }

    console.log('✅ [Download Final Document] Final document found:', {
      id: finalDoc.id,
      name: finalDoc.name,
      type: finalDoc.type,
      hasPublicUrl: !!finalDoc.publicUrl,
      hasGcsPath: !!finalDoc.gcsPath
    });

    try {
      // Get the application ID from the final document or tax forms
      const currentYear = new Date().getFullYear();
      const currentYearForm = taxForms.find(form => form.taxYear === currentYear);
      const applicationId = currentYearForm?.id;
      
      if (!applicationId) {
        Alert.alert('Error', 'Could not find application ID');
        return;
      }

      console.log('📥 [Download Final Document] Getting public URL for browser download...');
      showToast('Preparing document...');

      // Get public URL from backend (this doesn't require auth in browser)
      const urlResponse = await ApiService.getFinalDocumentUrl(applicationId, token);
      if (!urlResponse.success || !urlResponse.url) {
        throw new Error('Could not get download URL');
      }

      const publicUrl = urlResponse.url;
      console.log('✅ [Download Final Document] Got public URL:', publicUrl);
      
      console.log('🔍 [Download Final Document] Platform:', Platform.OS);
      
      if (Platform.OS === 'android') {
        // Android: Open PDF in Chrome where user can download it directly to Downloads
        console.log('🌐 [Download Final Document] Opening PDF in Chrome for download...');
        
        try {
          // Open the public URL directly in browser
          // Browser can download directly to Downloads folder
          const canOpen = await Linking.canOpenURL(publicUrl);
          if (canOpen) {
            Alert.alert(
              'Opening in Browser',
              'Opening the PDF in Chrome. Tap the download button in the browser to save it to your Downloads folder.',
              [
                {
                  text: 'Open in Chrome',
                  onPress: async () => {
                    try {
                      await Linking.openURL(publicUrl);
                      showToast('Open in Chrome - tap download to save to Downloads');
                    } catch (linkError) {
                      console.error('❌ [Download Final Document] Error opening URL:', linkError);
                      Alert.alert('Error', 'Could not open browser. Please try again.');
                    }
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          } else {
            throw new Error('Cannot open URL in browser');
          }
        } catch (error) {
          console.error('❌ [Download Final Document] Error opening in browser:', error);
          
          // Fallback: Try to download and share
          Alert.alert(
            'Browser Not Available',
            'Could not open browser. Would you like to download and share the file instead?',
            [
              {
                text: 'Download & Share',
                onPress: async () => {
                  try {
                    const fileName = finalDoc.name?.replace(/[^a-zA-Z0-9.-]/g, '_') || `Final_Tax_Return_${new Date().getFullYear()}.pdf`;
                    const tempDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
                    const tempFileUri = `${tempDir}${fileName}`;
                    
                    showToast('Downloading...');
                    const downloadResult = await FileSystem.downloadAsync(publicUrl, tempFileUri);
                    
                    const isAvailable = await Sharing.isAvailableAsync();
                    if (isAvailable) {
                      await Sharing.shareAsync(downloadResult.uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Save Final Tax Document',
                      });
                    } else {
                      Alert.alert('Error', 'Sharing is not available on this device.');
                    }
                  } catch (fallbackError) {
                    console.error('❌ [Download Final Document] Fallback error:', fallbackError);
                    Alert.alert('Error', 'Could not download file. Please try again.');
                  }
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      } else {
        // iOS: Open in browser or Safari
        console.log('📱 [Download Final Document] iOS: Opening PDF in Safari...');
        
        try {
          const canOpen = await Linking.canOpenURL(publicUrl);
          if (canOpen) {
            Alert.alert(
              'Opening in Safari',
              'Opening the PDF in Safari. Tap the share button and select "Save to Files" to save it to your Downloads folder.',
              [
                {
                  text: 'Open in Safari',
                  onPress: async () => {
                    try {
                      await Linking.openURL(publicUrl);
                      showToast('Open in Safari - tap share to save to Files');
                    } catch (linkError) {
                      console.error('❌ [Download Final Document] Error opening URL:', linkError);
                      Alert.alert('Error', 'Could not open Safari. Please try again.');
                    }
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          } else {
            throw new Error('Cannot open URL in Safari');
          }
        } catch (error) {
          console.error('❌ [Download Final Document] Error opening in Safari:', error);
          Alert.alert('Error', 'Could not open Safari. Please try again.');
        }
      }
      
      console.log('✅ [Download Final Document] Download process completed');
    } catch (error) {
      console.error('❌ [Download Final Document] Error occurred:', error);
      console.error('❌ [Download Final Document] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Fallback: try opening URL directly
      console.log('🔄 [Download Final Document] Attempting fallback: opening URL directly...');
      try {
        const url = finalDoc.publicUrl || finalDoc.gcsPath;
        if (url) {
          console.log('🔄 [Download Final Document] Fallback: Opening URL in browser:', url);
          await Linking.openURL(url);
          showToast('Document opened in browser');
          console.log('✅ [Download Final Document] Fallback successful: URL opened');
        } else {
          console.error('❌ [Download Final Document] Fallback failed: No URL available');
          Alert.alert('Error', `Could not download final document: ${error.message}`);
        }
      } catch (fallbackError) {
        console.error('❌ [Download Final Document] Fallback also failed:', fallbackError);
        Alert.alert('Error', `Could not download final document: ${error.message}`);
      }
    }
  };


  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Welcome back, {getUserDisplayName()}!</Text>
              <Text style={styles.heroSubtitle}>Let's get your taxes done</Text>
            </View>
            <View style={styles.heroIcons}>
              <TouchableOpacity style={styles.heroIconButton} onPress={() => setShowTestPanel(true)}>
                <Ionicons name="bug-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.heroIconButton} 
                onPress={() => navigation.navigate('Notifications')}
                onLongPress={() => setShowTestPanel(true)}
              >
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadCount > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconButton} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Summary Cards */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <View style={styles.gradientOverlay} />
              <View style={styles.heroStatContent}>
                <View>
                  <Text style={styles.heroStatLabel}>Tax Year {new Date().getFullYear()}</Text>
                  <Text style={styles.heroStatValue}>
                    {loading ? '...' : `${getCurrentYearTaxForm().progress}% Complete`}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.heroStatCard}>
              <View style={styles.gradientOverlay} />
              <View style={styles.heroStatContent}>
                <View>
                  <Text style={styles.heroStatLabel}>Expected Refund</Text>
                  <Text style={styles.heroStatValue}>
                    {loading ? '...' : `$${getExpectedRefund().toFixed(0)}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsRow}>
            <Button 
              style={{
                ...styles.actionButton,
                ...(hasSubmittedApplication() ? styles.disabledButton : {})
              }} 
              onPress={() => {
                if (hasSubmittedApplication()) {
                  // Show alert explaining why button is disabled
                  Alert.alert(
                    'Tax Return Already Submitted',
                    'You have already filled out your tax return. Please wait for your tax consultant to share update.',
                    [{ text: 'OK' }]
                  );
                } else {
                  navigation.navigate('TaxForm');
                }
              }}
              disabled={hasSubmittedApplication()}
            >
              <Feather 
                name={hasSubmittedApplication() ? "check" : "plus"} 
                size={20} 
                color={hasSubmittedApplication() ? "#666" : "#fff"} 
              />
              <Text style={[
                styles.actionButtonText,
                hasSubmittedApplication() && styles.disabledButtonText
              ]}>
                {hasSubmittedApplication() ? 'Application Submitted' : 'Start New Return'}
              </Text>
            </Button>
            <Button 
              style={{
                ...styles.actionButton,
                ...(!hasSubmittedApplication() ? styles.disabledButton : {})
              }} 
              onPress={() => {
                if (!hasSubmittedApplication()) {
                  showToast('Please submit the application first');
                } else {
                  navigation.navigate('DocumentReviewNew');
                }
              }}
              disabled={!hasSubmittedApplication()}
            >
              <Feather name="file-text" size={20} color={!hasSubmittedApplication() ? "#666" : "#fff"} />
              <Text style={[
                styles.actionButtonText,
                !hasSubmittedApplication() && styles.disabledButtonText
              ]}>
                Review Documents
              </Text>
            </Button>
          </View>
          
          {/* Admin Review Buttons */}
          <View style={styles.adminReviewRow}>
            {/* Show Review Draft Document button only if draft exists and final doesn't exist */}
            {hasDraftDocument() && !hasFinalDocument() && (
              <Button 
                style={{
                  ...styles.adminReviewButton,
                  ...(!hasSubmittedApplication() ? styles.disabledButton : {})
                }} 
                onPress={() => {
                  if (!hasSubmittedApplication()) {
                    showToast('Please submit the application first');
                  } else {
                    navigation.navigate('DocumentReview');
                  }
                }}
                disabled={!hasSubmittedApplication()}
              >
                <FontAwesome name="eye" size={18} color={!hasSubmittedApplication() ? "#666" : "#fff"} />
                <Text style={[
                  styles.adminReviewButtonText,
                  !hasSubmittedApplication() && styles.disabledButtonText
                ]}>
                  Review Draft Document
                </Text>
              </Button>
            )}
            
            {/* Show Download Final Document button only if final document exists */}
            {hasFinalDocument() && (
              <Button 
                style={{
                  ...styles.adminReviewButton,
                  ...(!hasSubmittedApplication() ? styles.disabledButton : {})
                }} 
                onPress={handleDownloadFinalDocument}
                disabled={!hasSubmittedApplication()}
              >
                <Feather name="download" size={18} color={!hasSubmittedApplication() ? "#666" : "#fff"} />
                <Text style={[
                  styles.adminReviewButtonText,
                  !hasSubmittedApplication() && styles.disabledButtonText
                ]}>
                  Download Final Document
                </Text>
              </Button>
            )}
          </View>
        </View>

        {/* Tax Return Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Ionicons name="document-text" size={24} color="#000000" />
            <Text style={styles.progressTitle}>Tax Return Progress</Text>
          </View>
          <Text style={styles.progressSubtitle}>Complete your {new Date().getFullYear()} tax return</Text>
          
          {/* Overall Progress */}
          <View style={styles.overallProgressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressPercentage}>{getOverallProgress()}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${getOverallProgress()}%` }]} />
            </View>
          </View>

          {/* Step Progress List */}
          <View style={styles.stepsList}>
            {(() => {
              const completion = getStepCompletion();
              const steps = [
                {
                  title: "Income Documents",
                  completed: completion.incomeDocuments,
                  icon: completion.incomeDocuments ? "checkmark" : "time"
                },
                {
                  title: "Deduction Documents", 
                  completed: completion.deductionDocuments,
                  icon: completion.deductionDocuments ? "checkmark" : "time"
                },
                {
                  title: "Personal Information",
                  completed: completion.personalInformation,
                  icon: completion.personalInformation ? "checkmark" : "time"
                }
              ];

              return steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={[
                    styles.stepIcon, 
                    { backgroundColor: step.completed ? '#28a745' : step.icon === 'time' ? '#ffc107' : '#6c757d' }
                  ]}>
                    <Ionicons 
                      name={step.completed ? "checkmark" : "time"} 
                      size={16} 
                      color="#ffffff" 
                    />
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <View style={[
                    styles.stepStatus,
                    { backgroundColor: step.completed ? '#d4edda' : step.icon === 'time' ? '#fff3cd' : '#f8f9fa' }
                  ]}>
                    <Text style={[
                      styles.stepStatusText,
                      { color: step.completed ? '#155724' : step.icon === 'time' ? '#856404' : '#6c757d' }
                    ]}>
                      {step.completed ? 'Complete' : step.icon === 'time' ? 'In Progress' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ));
            })()}
          </View>
        </View>

      </ScrollView>
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BackgroundColors.secondary, paddingHorizontal: 16, paddingBottom: 20 },
  heroHeader: { backgroundColor: BackgroundColors.secondary, padding: 16, paddingTop: 20, marginHorizontal: -16 },
  heroContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  heroTextContainer: { flex: 1, marginRight: 8 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flexWrap: 'wrap' },
  heroSubtitle: { color: '#fff', fontSize: 16, marginTop: 4 },
  heroIcons: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  heroIconButton: { 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    position: 'relative'
  },
  notificationDot: { 
    position: 'absolute', 
    top: 6, 
    right: 6, 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#ffc107' 
  },
  heroStatsRow: { flexDirection: 'row', gap: 8 },
  heroStatCard: { flex: 1, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', position: 'relative', overflow: 'hidden' },
  gradientOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderRadius: 12 
  },
  heroStatContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStatLabel: { color: '#ffffff', fontSize: 14 },
  heroStatValue: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  actionsContainer: { paddingTop: 12, paddingBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', borderRadius: 8, padding: 12, minHeight: 44, minWidth: 100 },
  actionButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  disabledButton: { backgroundColor: '#e9ecef', borderColor: '#dee2e6', borderWidth: 1 },
  disabledButtonText: { color: '#6c757d' },
  adminReviewRow: { marginTop: 8, flexDirection: 'row', gap: 8 },
  adminReviewButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6c757d', borderRadius: 8, padding: 12 },
  adminReviewButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadingText: { marginLeft: 8, color: '#666', fontSize: 14 },
  errorText: { color: '#e74c3c', textAlign: 'center', padding: 16 },
  noDataText: { color: '#666', textAlign: 'center', padding: 16, fontStyle: 'italic' },
  // Progress Section Styles
  progressSection: { marginBottom: 24, backgroundColor: '#ffffff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 20, fontWeight: 'bold', color: '#000000', marginLeft: 12 },
  progressSubtitle: { fontSize: 14, color: '#666666', marginBottom: 16 },
  overallProgressContainer: { marginBottom: 20 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 16, fontWeight: '600', color: '#000000' },
  progressPercentage: { fontSize: 16, fontWeight: 'bold', color: '#000000' },
  progressBarContainer: { height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#28a745', borderRadius: 4 },
  stepsList: { gap: 12 },
  stepItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: '#000000' },
  stepStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  stepStatusText: { fontSize: 12, fontWeight: '600' },
});

export default Dashboard;