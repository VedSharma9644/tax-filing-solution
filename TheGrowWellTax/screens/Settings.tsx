import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, TouchableOpacity, Animated, Alert } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import ProfileForm from '../components/ProfileForm';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import { BackgroundColors } from '../utils/colors';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    taxDeadlines: true,
    documentReminders: true,
    refundUpdates: true,
    marketingEmails: false,
  });
  const navigation = useNavigation<any>();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Profile management
  const { profile, loading, saving, errors, updateProfile, resetProfile, loadProfile } = useProfile();
  const { user, logout } = useAuth();
  const [profileChanges, setProfileChanges] = useState({});

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileChange = (field, value) => {
    setProfileChanges(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async (profileData) => {
    const success = await updateProfile(profileData);
    if (success) {
      setProfileChanges({});
    }
    return success;
  };

  const handleProfileReset = () => {
    setProfileChanges({});
    resetProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => logout(navigation)
        }
      ]
    );
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <CustomHeader 
          title="Settings" 
          subtitle="Account & Preferences"
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
          {/* Content */}
          <View style={styles.content}>
          {/* Profile Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="user" size={20} color="#D7B04C" />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>
            <Card style={styles.card}>
              <CardContent>
                <ProfileForm
                  profile={profile}
                  onProfileChange={handleProfileChange}
                  errors={errors}
                  loading={saving}
                  onSave={handleProfileSave}
                  onReset={handleProfileReset}
                  onProfilePictureUpdated={loadProfile}
                />
              </CardContent>
            </Card>
          </View>
          
          {/* Notification Settings */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications" size={20} color="#D7B04C" />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            <Card style={styles.card}>
              <CardContent>
                <View style={styles.notificationRow}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>Tax Deadline Reminders</Text>
                    <Text style={styles.notificationSubtitle}>Get notified about upcoming deadlines</Text>
                  </View>
                  <Switch value={notifications.taxDeadlines} onValueChange={val => handleNotificationChange('taxDeadlines', val)} />
                </View>
                <View style={styles.notificationRow}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>Document Reminders</Text>
                    <Text style={styles.notificationSubtitle}>Reminders to upload missing documents</Text>
                  </View>
                  <Switch value={notifications.documentReminders} onValueChange={val => handleNotificationChange('documentReminders', val)} />
                </View>
                <View style={styles.notificationRow}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>Refund Updates</Text>
                    <Text style={styles.notificationSubtitle}>Status updates on your tax refund</Text>
                  </View>
                  <Switch value={notifications.refundUpdates} onValueChange={val => handleNotificationChange('refundUpdates', val)} />
                </View>
                <View style={styles.notificationRow}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>Marketing Emails</Text>
                    <Text style={styles.notificationSubtitle}>Tips, promotions, and updates</Text>
                  </View>
                  <Switch value={notifications.marketingEmails} onValueChange={val => handleNotificationChange('marketingEmails', val)} />
                </View>
              </CardContent>
            </Card>
          </View>
          
          {/* Feedback & Reviews Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#D7B04C" />
              <Text style={styles.sectionTitle}>Feedback & Reviews</Text>
            </View>
            <Card style={styles.card}>
              <CardContent>
                <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('Feedback')}>
                  <Text style={styles.supportButtonText}>Submit Feedback</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportButton}>
                  <Text style={styles.supportButtonText}>View My Reviews</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
          
          {/* Payment History Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color="#D7B04C" />
              <Text style={styles.sectionTitle}>Payment History</Text>
            </View>
            <Card style={styles.card}>
              <CardContent>
                <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('PaymentHistory')}>
                  <Text style={styles.supportButtonText}>View Payment History</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
          
          {/* Help & Support Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="help-circle" size={20} color="#D7B04C" />
              <Text style={styles.sectionTitle}>Help & Support</Text>
            </View>
            <Card style={styles.card}>
              <CardContent>
                <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('SupportRequest')}>
                  <Text style={styles.supportButtonText}>Submit Support Request</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('Appointment')}>
                  <Text style={styles.supportButtonText}>Schedule Appointment</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('Feedback')}>
                  <Text style={styles.supportButtonText}>Submit Feedback</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </CardContent>
            </Card>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button variant="outline" style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#dc3545" />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </Button>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>The Growwell Tax </Text>
            <Text style={styles.footerText}>Powered by Creayaa Private Limited </Text>
            <Text style={styles.footerText}>Creayaa Pvt Ltd • © 2025 |  All rights reserved.</Text>
          </View>
          </View>
        </Animated.ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001826' },
  scrollContent: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTextContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  headerSubtitle: { fontSize: 12, color: '#888' },
  content: { gap: 16 },
  card: { 
    marginBottom: 16, 
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
  cardHeader: { alignItems: 'center', paddingBottom: 16 },
  cardTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#D7B04C', marginLeft: 8 },
  cardDescription: { textAlign: 'center', color: '#666' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee' },
  avatarEditButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', elevation: 2 },
  profileName: { fontWeight: 'bold', fontSize: 16 },
  profileEmail: { color: '#888', fontSize: 12 },
  profileSince: { color: '#aaa', fontSize: 10 },
  inputGroup: { marginTop: 12 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputColumn: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: { marginBottom: 12, backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10 },
  inputWithIcon: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 6, 
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 8 },
  inputWithIconText: { flex: 1, paddingVertical: 10, fontSize: 16 },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  securityContent: { flex: 1, marginRight: 16 },
  securityTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  securitySubtitle: { fontSize: 14, color: '#666' },
  notificationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  notificationContent: { flex: 1, marginRight: 16 },
  notificationTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  notificationSubtitle: { fontSize: 14, color: '#666' },
  supportButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  supportButtonText: { fontSize: 16, color: '#333', fontWeight: '500' },
  privacyButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  privacyButtonText: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1, marginLeft: 12 },
  actionButtons: { marginTop: 24, gap: 12 },
  saveButton: { backgroundColor: '#007bff', paddingVertical: 16 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutButton: { 
    borderColor: '#dc3545', 
    borderWidth: 1, 
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: { color: '#dc3545', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  footer: { marginTop: 32, alignItems: 'center', paddingVertical: 16 },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  switchLabel: { fontSize: 14, color: '#222' },
});

export default Settings;