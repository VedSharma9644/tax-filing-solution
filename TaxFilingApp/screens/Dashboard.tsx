import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

const Dashboard = () => {
  const navigation = useNavigation<any>();

  const notifications = [
    { id: 1, message: "W-2 uploaded successfully", time: "2 hours ago", type: "success" },
    { id: 2, message: "Tax deadline reminder: 45 days left", time: "1 day ago", type: "warning" },
  ];

  const taxYears = [
    { year: 2023, status: "in_progress", progress: 65, refund: 1250 },
    { year: 2022, status: "completed", progress: 100, refund: 980 },
  ];

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
            <View>
              <Text style={styles.heroTitle}>Welcome back, John!</Text>
              <Text style={styles.heroSubtitle}>Let's get your taxes done</Text>
            </View>
            <View style={styles.heroIcons}>
              <TouchableOpacity style={styles.heroIconButton} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {notifications.length > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconButton} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Summary Cards */}
          <View style={styles.heroStatsRow}>
            <Card style={styles.heroStatCard}>
              <CardContent>
                <View style={styles.heroStatContent}>
                  <View>
                    <Text style={styles.heroStatLabel}>Tax Year 2023</Text>
                    <Text style={styles.heroStatValue}>65% Complete</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
            <Card style={styles.heroStatCard}>
              <CardContent>
                <View style={styles.heroStatContent}>
                  <View>
                    <Text style={styles.heroStatLabel}>Expected Refund</Text>
                    <Text style={styles.heroStatValue}>$1,250</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsRow}>
            <Button style={styles.actionButton} onPress={() => navigation.navigate('TaxForm')}>
              <Feather name="plus" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Start New Return</Text>
            </Button>
            <Button style={styles.actionButton} onPress={() => navigation.navigate('TaxForm', { step: 7 })}>
              <Feather name="file-text" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Review Summary</Text>
            </Button>
          </View>
          
          {/* Admin Review Button */}
          <View style={styles.adminReviewRow}>
            <Button style={styles.adminReviewButton} onPress={() => navigation.navigate('DocumentReview')}>
              <FontAwesome name="eye" size={20} color="#fff" />
              <Text style={styles.adminReviewButtonText}>Review Admin Document</Text>
            </Button>
          </View>
          

        </View>
        {/* Tax Years */}
        <Text style={styles.sectionTitle}>Your Tax Years</Text>
        {taxYears.map(year => (
          <Card key={year.year} style={styles.card}>
            <CardContent>
              <View style={styles.taxYearRow}>
                <Text style={styles.taxYearLabel}>Tax Year {year.year}</Text>
                <Badge>{year.status === 'completed' ? 'Completed' : 'In Progress'}</Badge>
              </View>
              <Progress value={year.progress} />
              <Text style={styles.taxYearRefund}>Refund: ${year.refund}</Text>
            </CardContent>
          </Card>
        ))}
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
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  heroHeader: { backgroundColor: '#007bff', padding: 20, paddingTop: 40, marginHorizontal: -16 },
  heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  heroSubtitle: { color: '#e3f2fd', fontSize: 16 },
  heroIcons: { flexDirection: 'row', gap: 8 },
  heroIconButton: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  notificationDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffc107' },
  heroStatsRow: { flexDirection: 'row', gap: 12 },
  heroStatCard: { flex: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  heroStatContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStatLabel: { color: '#666', fontSize: 14 },
  heroStatValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  actionsContainer: { paddingTop: 16, paddingBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007bff', borderRadius: 8, padding: 16, minHeight: 48, minWidth: 120 },
  actionButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  adminReviewRow: { marginTop: 12 },
  adminReviewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6c757d', borderRadius: 8, padding: 16 },
  adminReviewButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  sectionSubtitle: { color: '#888', fontSize: 14, marginBottom: 16 },
  card: { marginBottom: 12, borderRadius: 12 },
  taxYearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  taxYearLabel: { fontWeight: 'bold', fontSize: 15 },
  taxYearRefund: { color: '#28a745', fontWeight: 'bold', marginTop: 8 },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationText: { flex: 1, fontSize: 14 },
  notificationTime: { color: '#888', fontSize: 12, marginLeft: 8 },
  howItWorksSection: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#eee' },
  processImageCard: { marginBottom: 24, borderRadius: 12 },
  processImage: { width: '100%', height: 200, borderRadius: 8 },
  processStepsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  processStepItem: { alignItems: 'center', flex: 1 },
  stepNumberCircle: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#007bff', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 8
  },
  stepNumberText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  stepLabel: { fontSize: 12, color: '#666', textAlign: 'center', fontWeight: '500' },
});

export default Dashboard;