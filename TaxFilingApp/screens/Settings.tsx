import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Image, TouchableOpacity, Animated } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    taxDeadlines: true,
    documentReminders: true,
    refundUpdates: true,
    marketingEmails: false,
  });
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    biometricLogin: true,
    autoLogout: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation<any>();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Settings" 
        subtitle="Account & Preferences"
        avatarInitials="JD"
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
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <FontAwesome name="user" size={20} color="#007bff" />
              <Text style={styles.cardTitle}>Profile Information</Text>
            </View>
            <CardDescription style={styles.cardDescription}>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Avatar */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                <Image source={require('../assets/icon.png')} style={styles.avatarImage} />
                <Button variant="secondary" style={styles.avatarEditButton}>
                  <Feather name="camera" size={16} color="#007bff" />
                </Button>
              </View>
              <View>
                <Text style={styles.profileName}>John Doe</Text>
                <Text style={styles.profileEmail}>john.doe@email.com</Text>
                <Text style={styles.profileSince}>Member since 2023</Text>
              </View>
            </View>
            {/* Personal Info */}
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput style={styles.input} placeholder="John" defaultValue="John" />
                </View>
                <View style={styles.inputColumn}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput style={styles.input} placeholder="Doe" defaultValue="Doe" />
                </View>
              </View>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.inputWithIconText} placeholder="john.doe@email.com" defaultValue="john.doe@email.com" />
              </View>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.inputWithIconText} placeholder="+1 (555) 123-4567" defaultValue="+1 (555) 123-4567" />
              </View>
            </View>
          </CardContent>
        </Card>
        
        {/* Security & Privacy Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="shield-checkmark" size={20} color="#007bff" />
              <Text style={styles.cardTitle}>Security & Privacy</Text>
            </View>
            <CardDescription style={styles.cardDescription}>Keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Current Password */}
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput 
                style={styles.inputWithIconText} 
                placeholder="Enter current password" 
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Security Features */}
            <View style={styles.securityRow}>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
                <Text style={styles.securitySubtitle}>Add an extra layer of security</Text>
              </View>
              <Switch value={security.twoFactorAuth} onValueChange={val => setSecurity(prev => ({ ...prev, twoFactorAuth: val }))} />
            </View>
            
            <View style={styles.securityRow}>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Biometric Login</Text>
                <Text style={styles.securitySubtitle}>Use fingerprint or face ID</Text>
              </View>
              <Switch value={security.biometricLogin} onValueChange={val => setSecurity(prev => ({ ...prev, biometricLogin: val }))} />
            </View>
            
            <View style={styles.securityRow}>
              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>Auto-Logout</Text>
                <Text style={styles.securitySubtitle}>Logout after 30 minutes of inactivity</Text>
              </View>
              <Switch value={security.autoLogout} onValueChange={val => setSecurity(prev => ({ ...prev, autoLogout: val }))} />
            </View>
          </CardContent>
        </Card>
        
        {/* Notification Settings */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="notifications" size={20} color="#007bff" />
              <Text style={styles.cardTitle}>Notifications</Text>
            </View>
            <CardDescription style={styles.cardDescription}>Choose what you want to be notified about</CardDescription>
          </CardHeader>
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
        
        {/* Data & Privacy Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="shield-outline" size={20} color="#007bff" />
              <Text style={styles.cardTitle}>Data & Privacy</Text>
            </View>
            <CardDescription style={styles.cardDescription}>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={styles.privacyButton}>
              <Ionicons name="download-outline" size={20} color="#666" />
              <Text style={styles.privacyButtonText}>Download My Data</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.privacyButton}>
              <Ionicons name="help-circle-outline" size={20} color="#666" />
              <Text style={styles.privacyButtonText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteAccountButton}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>
        
        {/* Help & Support Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="help-circle" size={20} color="#007bff" />
              <Text style={styles.cardTitle}>Help & Support</Text>
            </View>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>FAQ & Help Center</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Tax Filing Guide</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button style={styles.saveButton} onPress={() => {}}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Button>
          <Button variant="outline" style={styles.logoutButton} onPress={() => {}}>
            <Ionicons name="log-out-outline" size={20} color="#dc3545" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Button>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>TaxEase Mobile App</Text>
          <Text style={styles.footerText}>Version 2.1.0 • Build 156</Text>
          <Text style={styles.footerText}>© 2023 TaxEase Inc. All rights reserved.</Text>
        </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
    backgroundColor: '#fff',
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
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
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
    backgroundColor: '#fff', 
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
  deleteAccountButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteAccountButtonText: { fontSize: 16, color: '#fff', fontWeight: 'bold', marginLeft: 8 },
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