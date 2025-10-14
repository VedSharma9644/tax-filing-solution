import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import FeedbackService from '../services/feedbackService';
import { useAuth } from '../contexts/AuthContext';
import { BackgroundColors, BrandColors, TextColors } from '../utils/colors';

const FeedbackScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load feedback history on component mount
  useEffect(() => {
    loadFeedbackHistory();
  }, []);

  const loadFeedbackHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await FeedbackService.getFeedbackHistory();
      if (response.success) {
        setFeedbackHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading feedback history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating before submitting.');
      return;
    }

    if (feedback.trim().length < 10) {
      Alert.alert('Error', 'Please provide more detailed feedback (at least 10 characters).');
      return;
    }

    if (feedback.trim().length > 1000) {
      Alert.alert('Error', 'Feedback must be less than 1000 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await FeedbackService.submitFeedback({
        rating,
        feedback: feedback.trim(),
        category: 'general'
      });

      if (response.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully. We appreciate your input!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setRating(0);
                setFeedback('');
                // Reload history
                loadFeedbackHistory();
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      Alert.alert(
        'Error',
        'Failed to submit feedback. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleRatingPress(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#FFD700" : "#ccc"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
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
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>

        {/* Feedback Form Title */}
        <View style={styles.sectionTitle}>
          <FontAwesome name="comment" size={24} color={TextColors.white} />
          <Text style={styles.sectionTitleText}>Share Your Experience</Text>
        </View>

        {/* Feedback Form */}
        <Card style={styles.card}>
          <CardContent>
            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Rate your experience</Text>
              <View style={styles.starsContainer}>
                {renderStars()}
              </View>
              <Text style={styles.ratingText}>
                {rating === 0 ? 'Select a rating' : 
                 rating === 1 ? 'Poor' :
                 rating === 2 ? 'Fair' :
                 rating === 3 ? 'Good' :
                 rating === 4 ? 'Very Good' : 'Excellent'}
              </Text>
            </View>

            {/* Feedback Text */}
            <View style={styles.feedbackSection}>
              <Text style={styles.label}>Tell us more (optional)</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Share your experience, suggestions, or any issues you encountered..."
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {feedback.length}/500 characters
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
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Feedback History Title */}
        <View style={styles.sectionTitle}>
          <Ionicons name="time-outline" size={24} color={TextColors.white} />
          <Text style={styles.sectionTitleText}>Previous Feedback</Text>
        </View>

        {/* Feedback History */}
        <Card style={styles.card}>
          <CardContent>
            {loadingHistory ? (
              <Text style={styles.loadingText}>Loading feedback history...</Text>
            ) : feedbackHistory.length === 0 ? (
              <Text style={styles.noFeedbackText}>No previous feedback found.</Text>
            ) : (
              feedbackHistory.map((item, index) => (
                <View key={item.id || index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyStars}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                          key={star}
                          name={star <= item.rating ? "star" : "star-outline"}
                          size={16}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                    <Text style={styles.historyDate}>
                      {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}
                    </Text>
                  </View>
                  <Text style={styles.historyText}>
                    "{item.feedback}"
                  </Text>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyCategory}>
                      Category: {item.category || 'general'}
                    </Text>
                    <Text style={styles.historyStatus}>
                      Status: {item.status || 'pending'}
                    </Text>
                  </View>
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
    color: TextColors.white,
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
    color: TextColors.primary,
  },
  cardDescription: {
    color: TextColors.secondary,
    marginTop: 4,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TextColors.primary,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: TextColors.secondary,
    fontWeight: '500',
  },
  feedbackSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: TextColors.primary,
    marginBottom: 8,
  },
  feedbackInput: {
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
    color: TextColors.tertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: TextColors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  historyItem: {
    paddingVertical: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyStars: {
    flexDirection: 'row',
  },
  historyDate: {
    fontSize: 12,
    color: TextColors.tertiary,
  },
  historyText: {
    fontSize: 14,
    color: TextColors.primary,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    color: TextColors.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noFeedbackText: {
    fontSize: 14,
    color: TextColors.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  historyCategory: {
    fontSize: 12,
    color: TextColors.secondary,
    textTransform: 'capitalize',
  },
  historyStatus: {
    fontSize: 12,
    color: TextColors.secondary,
    textTransform: 'capitalize',
  },
});

export default FeedbackScreen; 