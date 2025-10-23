import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import { BackgroundColors } from '../utils/colors';

const TaxFilingGuide = () => {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;

  const filingSteps = [
    {
      id: 1,
      title: "Gather Your Documents",
      description: "Collect all necessary tax documents",
      details: [
        "W-2 forms from all employers",
        "1099 forms for freelance work",
        "Interest and dividend statements",
        "Receipts for deductions",
        "Previous year's tax return",
        "Social Security numbers for all family members"
      ],
      icon: "document-text",
      color: "#007bff"
    },
    {
      id: 2,
      title: "Choose Your Filing Status",
      description: "Select the appropriate filing status",
      details: [
        "Single - if you're unmarried",
        "Married Filing Jointly - if you're married",
        "Married Filing Separately - if you're married but filing separately",
        "Head of Household - if you're unmarried and support dependents",
        "Qualifying Widow(er) - if your spouse died within the last 2 years"
      ],
      icon: "person",
      color: "#28a745"
    },
    {
      id: 3,
      title: "Calculate Your Income",
      description: "Add up all sources of income",
      details: [
        "Wages and salaries",
        "Self-employment income",
        "Interest and dividends",
        "Capital gains",
        "Rental income",
        "Alimony received",
        "Unemployment compensation"
      ],
      icon: "calculator",
      color: "#ffc107"
    },
    {
      id: 4,
      title: "Claim Deductions",
      description: "Reduce your taxable income",
      details: [
        "Standard deduction (recommended for most)",
        "Itemized deductions (if greater than standard)",
        "Student loan interest",
        "IRA contributions",
        "Health savings account contributions",
        "Educator expenses"
      ],
      icon: "receipt",
      color: "#17a2b8"
    },
    {
      id: 5,
      title: "Calculate Credits",
      description: "Reduce your tax bill dollar for dollar",
      details: [
        "Child Tax Credit",
        "Earned Income Tax Credit",
        "American Opportunity Credit",
        "Lifetime Learning Credit",
        "Child and Dependent Care Credit",
        "Saver's Credit"
      ],
      icon: "card",
      color: "#dc3545"
    },
    {
      id: 6,
      title: "Review and Submit",
      description: "Double-check everything before filing",
      details: [
        "Verify all information is correct",
        "Check that all documents are uploaded",
        "Review your refund or amount owed",
        "Sign your return electronically",
        "Submit your return",
        "Save a copy for your records"
      ],
      icon: "checkmark-circle",
      color: "#6f42c1"
    }
  ];

  const toggleStep = (id: number) => {
    setExpandedSteps(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const quickTips = [
    "File early to avoid identity theft",
    "Use direct deposit for faster refunds",
    "Keep records for at least 3 years",
    "Consider contributing to an IRA",
    "Check if you qualify for free filing"
  ];

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <CustomHeader 
          title="Tax Filing Guide" 
          subtitle="Step-by-step instructions"
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
            {/* Introduction */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Complete Tax Filing Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <Text style={styles.introText}>
                  Follow this step-by-step guide to file your taxes accurately and efficiently. 
                  Each step builds on the previous one, so take your time and ensure accuracy.
                </Text>
              </CardContent>
            </Card>

            {/* Filing Steps */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Step-by-Step Process</CardTitle>
              </CardHeader>
              <CardContent>
                {filingSteps.map((step) => (
                  <View key={step.id} style={styles.stepItem}>
                    <TouchableOpacity 
                      style={styles.stepHeader} 
                      onPress={() => toggleStep(step.id)}
                    >
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{step.id}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                      </View>
                      <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                        <Ionicons name={step.icon as any} size={20} color="#fff" />
                      </View>
                      <Ionicons 
                        name={expandedSteps.includes(step.id) ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                    {expandedSteps.includes(step.id) && (
                      <View style={styles.stepDetails}>
                        {step.details.map((detail, index) => (
                          <View key={index} style={styles.detailItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                            <Text style={styles.detailText}>{detail}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                {quickTips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="bulb" size={16} color="#ffc107" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Ready to Start?</CardTitle>
              </CardHeader>
              <CardContent>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => navigation.navigate('TaxForm')}
                >
                  <Ionicons name="play" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Start Tax Filing</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={() => navigation.navigate('DocumentUpload')}
                >
                  <Ionicons name="cloud-upload" size={20} color="#007bff" />
                  <Text style={styles.secondaryButtonText}>Upload Documents</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card style={styles.card}>
              <CardHeader style={styles.cardHeader}>
                <CardTitle style={styles.cardTitle}>Need More Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <TouchableOpacity 
                  style={styles.helpButton} 
                  onPress={() => navigation.navigate('FAQHelpCenter')}
                >
                  <Ionicons name="help-circle" size={20} color="#007bff" />
                  <Text style={styles.helpButtonText}>View FAQ</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.helpButton} 
                  onPress={() => navigation.navigate('SupportRequest')}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#007bff" />
                  <Text style={styles.helpButtonText}>Contact Support</Text>
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
  introText: { 
    fontSize: 16, 
    color: '#666', 
    lineHeight: 24, 
    textAlign: 'center' 
  },
  stepItem: { marginBottom: 16 },
  stepHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: BackgroundColors.secondary,
    borderRadius: 8
  },
  stepNumber: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#007bff',
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12
  },
  stepNumberText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  stepContent: { flex: 1, marginRight: 12 },
  stepTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    marginBottom: 2
  },
  stepDescription: { 
    fontSize: 14, 
    color: '#666' 
  },
  stepIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12
  },
  stepDetails: { 
    padding: 16, 
    backgroundColor: BackgroundColors.primary,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef'
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  detailText: { 
    fontSize: 14, 
    color: '#666', 
    marginLeft: 8,
    flex: 1
  },
  tipItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  tipText: { 
    fontSize: 14, 
    color: '#666', 
    marginLeft: 8,
    flex: 1
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12
  },
  actionButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16,
    marginLeft: 8
  },
  secondaryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderColor: '#007bff',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 8
  },
  secondaryButtonText: { 
    color: '#007bff', 
    fontWeight: 'bold', 
    fontSize: 16,
    marginLeft: 8
  },
  helpButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  helpButtonText: { 
    fontSize: 16, 
    color: '#333', 
    fontWeight: '500',
    flex: 1,
    marginLeft: 12
  },
});

export default TaxFilingGuide; 