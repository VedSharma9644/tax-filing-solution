import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import ImageCacheService from '../services/imageCacheService';

const Dashboard = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const [taxForms, setTaxForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreloadProgress, setImagePreloadProgress] = useState(null);
  const [isPreloadingImages, setIsPreloadingImages] = useState(false);

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

  // Fetch tax forms data
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
  }, [token]);

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

  const notifications = [
    { id: 1, message: "W-2 uploaded successfully", time: "2 hours ago", type: "success" },
    { id: 2, message: "Tax deadline reminder: 45 days left", time: "1 day ago", type: "warning" },
  ];

  // Calculate expected refund from latest tax form
  const getExpectedRefund = () => {
    if (taxForms.length === 0) return 0;
    const latestForm = taxForms[0]; // Assuming forms are sorted by date
    return latestForm.expectedReturn || 0;
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

  const processSteps = [
    { number: 1, title: "Upload Documents" },
    { number: 2, title: "Review & Complete" },
    { number: 3, title: "File & Get Refund" }
  ];

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
              <TouchableOpacity style={styles.heroIconButton} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {notifications.length > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconButton} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Summary Cards */}
          <View style={styles.heroStatsRow}>
            <Card style={styles.heroStatCard}>
              <CardContent>
                <View style={styles.heroStatContent}>
                  <View>
                    <Text style={styles.heroStatLabel}>Tax Year {new Date().getFullYear()}</Text>
                    <Text style={styles.heroStatValue}>
                      {loading ? '...' : `${getCurrentYearTaxForm().progress}% Complete`}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
            <Card style={styles.heroStatCard}>
              <CardContent>
                <View style={styles.heroStatContent}>
                  <View>
                    <Text style={styles.heroStatLabel}>Expected Refund</Text>
                    <Text style={styles.heroStatValue}>
                      {loading ? '...' : `$${getExpectedRefund().toFixed(0)}`}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Background Pre-loading Indicator */}
        {isPreloadingImages && (
          <Card style={styles.preloadCard}>
            <CardContent>
              <View style={styles.preloadContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.preloadText}>
                  {imagePreloadProgress 
                    ? `Pre-loading images... ${imagePreloadProgress.completed}/${imagePreloadProgress.total}`
                    : 'Pre-loading images...'
                  }
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsRow}>
            <Button style={styles.actionButton} onPress={() => navigation.navigate('TaxForm')}>
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Start New Return</Text>
            </Button>
            <Button style={styles.actionButton} onPress={() => navigation.navigate('DocumentReviewNew')}>
              <Feather name="file-text" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Review Documents</Text>
            </Button>
          </View>
          
          {/* Admin Review Button */}
          <View style={styles.adminReviewRow}>
            <Button style={styles.adminReviewButton} onPress={() => navigation.navigate('DocumentReview')}>
              <FontAwesome name="eye" size={18} color="#fff" />
              <Text style={styles.adminReviewButtonText}>Review Admin Document</Text>
            </Button>
          </View>
          

        </View>
        {/* Current Tax Year */}
        <Text style={styles.sectionTitle}>Tax Year {new Date().getFullYear()}</Text>
        {loading ? (
          <Card style={styles.card}>
            <CardContent>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.loadingText}>Loading tax form...</Text>
              </View>
            </CardContent>
          </Card>
        ) : error ? (
          <Card style={styles.card}>
            <CardContent>
              <Text style={styles.errorText}>{error}</Text>
            </CardContent>
          </Card>
        ) : (() => {
          const currentYear = getCurrentYearTaxForm();
          return (
            <Card style={styles.card}>
              <CardContent>
                <View style={styles.taxYearRow}>
                  <Text style={styles.taxYearLabel}>Tax Year {currentYear.year}</Text>
                  <Badge>
                    {currentYear.status === 'completed' ? 'Completed' : 
                     currentYear.status === 'no_data' ? 'Not Started' : 'In Progress'}
                  </Badge>
                </View>
                <Progress value={currentYear.progress} />
                <Text style={styles.taxYearRefund}>
                  {currentYear.refund > 0 ? `Expected Refund: $${currentYear.refund.toFixed(0)}` : 'No refund estimate yet'}
                </Text>
              </CardContent>
            </Card>
          );
        })()}
        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        {notifications.map(note => (
          <Card key={note.id} style={styles.card}>
            <CardContent>
              <View style={styles.notificationRow}>
                <Feather name={note.type === 'success' ? 'check-circle' : 'alert-triangle'} size={20} color={note.type === 'success' ? '#28a745' : '#ffc107'} style={{ marginRight: 8 }} />
                <Text style={styles.notificationText}>{note.message}</Text>
                <Text style={styles.notificationTime}>{note.time}</Text>
              </View>
            </CardContent>
          </Card>
        ))}

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>Simple steps to file your taxes</Text>
          
          {/* Process Steps Image */}
          <Card style={styles.processImageCard}>
            <CardContent>
              <Image 
                source={require('../assets/process-steps.jpg')} 
                style={styles.processImage}
                resizeMode="contain"
              />
            </CardContent>
          </Card>

          {/* Process Steps Details */}
          <View style={styles.processStepsRow}>
            {processSteps.map((step) => (
              <View key={step.number} style={styles.processStepItem}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <Text style={styles.stepLabel}>{step.title}</Text>
              </View>
            ))}
          </View>


        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 20 },
  heroHeader: { backgroundColor: '#007bff', padding: 16, paddingTop: 20, marginHorizontal: -16 },
  heroContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  heroTextContainer: { flex: 1, marginRight: 8 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', flexWrap: 'wrap' },
  heroSubtitle: { color: '#e3f2fd', fontSize: 16, marginTop: 4 },
  heroIcons: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  heroIconButton: { 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  notificationDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffc107' },
  heroStatsRow: { flexDirection: 'row', gap: 8 },
  heroStatCard: { flex: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  heroStatContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStatLabel: { color: '#666', fontSize: 14 },
  heroStatValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  actionsContainer: { paddingTop: 12, paddingBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007bff', borderRadius: 8, padding: 12, minHeight: 44, minWidth: 100 },
  actionButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  adminReviewRow: { marginTop: 8 },
  adminReviewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6c757d', borderRadius: 8, padding: 12 },
  adminReviewButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  sectionSubtitle: { color: '#888', fontSize: 14, marginBottom: 12 },
  card: { marginBottom: 8, borderRadius: 12 },
  taxYearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  taxYearLabel: { fontWeight: 'bold', fontSize: 15 },
  taxYearRefund: { color: '#28a745', fontWeight: 'bold', marginTop: 8 },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationText: { flex: 1, fontSize: 14 },
  notificationTime: { color: '#888', fontSize: 12, marginLeft: 8 },
  howItWorksSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  processImageCard: { marginBottom: 16, borderRadius: 12 },
  processImage: { width: '100%', height: 160, borderRadius: 8 },
  processStepsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  processStepItem: { alignItems: 'center', flex: 1 },
  stepNumberCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#007bff', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 6
  },
  stepNumberText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  stepLabel: { fontSize: 11, color: '#666', textAlign: 'center', fontWeight: '500' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
  loadingText: { marginLeft: 8, color: '#666', fontSize: 14 },
  errorText: { color: '#e74c3c', textAlign: 'center', padding: 16 },
  noDataText: { color: '#666', textAlign: 'center', padding: 16, fontStyle: 'italic' },
  preloadCard: { marginBottom: 8, borderRadius: 12, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef' },
  preloadContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
  preloadText: { marginLeft: 8, color: '#666', fontSize: 14 },
});

export default Dashboard;