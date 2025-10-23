import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import { BackgroundColors } from '../utils/colors';

const FAQHelpCenter = () => {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;

  const faqData = [
    {
      id: 1,
      question: "How do I file my taxes using this app?",
      answer: "To file your taxes, start by creating your profile, then use the Tax Form Wizard to input your information. Upload required documents and review everything before submitting. Our step-by-step guide will walk you through the entire process."
    },
    {
      id: 2,
      question: "What documents do I need to file my taxes?",
      answer: "You'll need your W-2 forms, 1099 forms, receipts for deductions, previous year's tax return, and any other income or expense documentation. The app will prompt you for specific documents based on your situation."
    },
    {
      id: 3,
      question: "How long does it take to get my refund?",
      answer: "Most refunds are processed within 21 days when filed electronically and using direct deposit. Paper returns typically take 6-8 weeks. You can track your refund status in the app."
    },
    {
      id: 4,
      question: "Can I file taxes for previous years?",
      answer: "Yes, you can file returns for the past 3 years. Navigate to the Tax Form section and select the appropriate tax year. Note that late filing may result in penalties and interest."
    },
    {
      id: 5,
      question: "What if I made a mistake on my return?",
      answer: "If you need to correct your return, you can file an amended return (Form 1040-X) within 3 years of the original filing date. Contact our support team for assistance."
    },
    {
      id: 6,
      question: "How do I know if I need to file taxes?",
      answer: "Generally, you need to file if your income exceeds certain thresholds based on your filing status and age. Use our tax calculator in the app to determine if you need to file."
    },
    {
      id: 7,
      question: "What are the different filing statuses?",
      answer: "The five filing statuses are: Single, Married Filing Jointly, Married Filing Separately, Head of Household, and Qualifying Widow(er). Choose the one that best describes your situation."
    },
    {
      id: 8,
      question: "How do I track my refund?",
      answer: "You can track your refund using the IRS 'Where's My Refund' tool or through our app. You'll need your Social Security number, filing status, and exact refund amount."
    }
  ];

  const toggleItem = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const searchCategories = [
    { title: "Getting Started", icon: "play-circle", color: "#007bff" },
    { title: "Documentation", icon: "document-text", color: "#28a745" },
    { title: "Filing Process", icon: "list", color: "#ffc107" },
    { title: "Refunds", icon: "card", color: "#17a2b8" },
    { title: "Common Issues", icon: "help-circle", color: "#dc3545" },
    { title: "Contact Support", icon: "call", color: "#6f42c1" }
  ];

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <CustomHeader 
          title="FAQ & Help Center" 
          subtitle="Find answers to common questions"
          user={user}
          scrollY={scrollY}
        />
        <Animated.ScrollView 
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.content}>
            {/* Search Categories */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Quick Help Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.categoriesGrid}>
                  {searchCategories.map((category, index) => (
                    <TouchableOpacity key={index} style={styles.categoryItem}>
                      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon as any} size={24} color="#fff" />
                      </View>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                {faqData.map((item) => (
                  <View key={item.id} style={styles.faqItem}>
                    <TouchableOpacity 
                      style={styles.faqQuestion} 
                      onPress={() => toggleItem(item.id)}
                    >
                      <Text style={styles.questionText}>{item.question}</Text>
                      <Ionicons 
                        name={expandedItems.includes(item.id) ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                    {expandedItems.includes(item.id) && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.answerText}>{item.answer}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Still Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <TouchableOpacity 
                  style={styles.supportButton} 
                  onPress={() => navigation.navigate('SupportRequest')}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#007bff" />
                  <Text style={styles.supportButtonText}>Submit Support Request</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.supportButton} 
                  onPress={() => navigation.navigate('Appointment')}
                >
                  <Ionicons name="calendar" size={20} color="#007bff" />
                  <Text style={styles.supportButtonText}>Schedule Appointment</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportButton}>
                  <Ionicons name="call" size={20} color="#007bff" />
                  <Text style={styles.supportButtonText}>Call Support: 1-800-TAX-HELP</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
        </Animated.ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BackgroundColors.secondary },
  scrollContent: { padding: 16 },
  content: { gap: 16 },
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
  cardHeader: { alignItems: 'center', paddingBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  categoriesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    gap: 12
  },
  categoryItem: { 
    width: '48%', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: BackgroundColors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  categoryIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 8
  },
  categoryTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  faqItem: { marginBottom: 16 },
  faqQuestion: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: BackgroundColors.secondary,
    borderRadius: 8
  },
  questionText: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    marginRight: 12
  },
  faqAnswer: { 
    padding: 16, 
    backgroundColor: BackgroundColors.primary,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef'
  },
  answerText: { 
    fontSize: 14, 
    color: '#666', 
    lineHeight: 20
  },
  supportButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  supportButtonText: { 
    fontSize: 16, 
    color: '#333', 
    fontWeight: '500',
    flex: 1,
    marginLeft: 12
  },
});

export default FAQHelpCenter; 