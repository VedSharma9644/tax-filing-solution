import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import SupportService from '../services/supportService';
import { BackgroundColors, BrandColors, TextColors } from '../utils/colors';

const SupportRequestScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportRequests, setSupportRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const categories = [
    { id: 'technical', name: 'Technical Issue', icon: 'bug-outline' },
    { id: 'billing', name: 'Billing & Payment', icon: 'card-outline' },
    { id: 'tax', name: 'Tax Filing Help', icon: 'document-outline' },
    { id: 'general', name: 'General Inquiry', icon: 'help-circle-outline' },
  ];

  // Load support request history on component mount
  useEffect(() => {
    loadSupportRequestHistory();
  }, []);

  const loadSupportRequestHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await SupportService.getSupportRequestHistory();
      if (response.success) {
        setSupportRequests(response.data);
      }
    } catch (error) {
      console.error('Error loading support request history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category for your request.');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject for your request.');
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert('Error', 'Please provide more details about your issue (at least 10 characters).');
      return;
    }

    if (message.trim().length > 2000) {
      Alert.alert('Error', 'Message must be less than 2000 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await SupportService.submitSupportRequest({
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim()
      });

      if (response.success) {
        Alert.alert(
          'Request Submitted!',
          'Your support request has been submitted successfully. We\'ll get back to you within 24 hours.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedCategory('');
                setSubject('');
                setMessage('');
                // Reload history
                loadSupportRequestHistory();
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Support request submission error:', error);
      Alert.alert(
        'Error',
        'Failed to submit support request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Button 
            variant="ghost" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={TextColors.white} />
          </Button>
          <Text style={styles.headerTitle}>Support Request</Text>
        </View>

        {/* New Request Form Title */}
        <View style={styles.sectionTitle}>
          <Ionicons name="help-circle" size={24} color="#D7B04C" />
          <Text style={styles.sectionTitleText}>Submit New Request</Text>
        </View>

        {/* New Request Form */}
        <Card style={styles.card}>
          <CardContent>
            {/* Category Selection */}
            <View style={styles.categorySection}>
              <Text style={styles.label}>Select Category</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.categoryButtonActive
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={selectedCategory === category.id ? '#fff' : '#007bff'}
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief description of your issue"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Message */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Please provide detailed information about your issue..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {message.length}/1000 characters
              </Text>
            </View>

            {/* Submit Button */}
            <Button 
              style={styles.submitButton} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Requests Title */}
        <View style={styles.sectionTitle}>
          <Ionicons name="time-outline" size={24} color="#D7B04C" />
          <Text style={styles.sectionTitleText}>Recent Requests</Text>
        </View>

        {/* Recent Requests */}
        <Card style={styles.card}>
          <CardContent>
            {loadingHistory ? (
              <Text style={styles.loadingText}>Loading support requests...</Text>
            ) : supportRequests.length === 0 ? (
              <Text style={styles.noRequestsText}>No support requests found.</Text>
            ) : (
              supportRequests.map((request, index) => (
                <View key={request.id || index} style={styles.requestItem}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestSubject}>{request.subject}</Text>
                      <Text style={styles.requestCategory}>
                        {categories.find(cat => cat.id === request.category)?.name || request.category}
                      </Text>
                    </View>
                    <View style={[
                      styles.requestStatus,
                      request.status === 'resolved' && styles.statusResolved,
                      request.status === 'in_progress' && styles.statusInProgress,
                      request.status === 'open' && styles.statusOpen
                    ]}>
                      <Text style={[
                        styles.statusText,
                        request.status === 'resolved' && styles.statusTextResolved,
                        request.status === 'in_progress' && styles.statusTextInProgress,
                        request.status === 'open' && styles.statusTextOpen
                      ]}>
                        {request.status === 'in_progress' ? 'In Progress' : 
                         request.status === 'resolved' ? 'Resolved' : 'Open'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.requestDate}>
                    {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                  </Text>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: BackgroundColors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: BackgroundColors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 8,
  },
  backButton: {
    marginRight: 6,
    marginTop: -6,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TextColors.white,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D7B04C',
  },
  sectionDescription: {
    fontSize: 14,
    color: TextColors.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: BackgroundColors.primary,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    color: '#666',
    marginTop: 4,
  },
  categorySection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: BackgroundColors.primary,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: BrandColors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: BackgroundColors.primary,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: BackgroundColors.primary,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  requestItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  requestInfo: {
    flex: 1,
  },
  requestSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  requestCategory: {
    fontSize: 12,
    color: '#666',
  },
  requestStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#d4edda',
  },
  statusText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '500',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noRequestsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusResolved: {
    backgroundColor: '#d4edda',
  },
  statusInProgress: {
    backgroundColor: '#fff3cd',
  },
  statusOpen: {
    backgroundColor: '#d1ecf1',
  },
  statusTextResolved: {
    color: '#155724',
  },
  statusTextInProgress: {
    color: '#856404',
  },
  statusTextOpen: {
    color: '#0c5460',
  },
});

export default SupportRequestScreen; 