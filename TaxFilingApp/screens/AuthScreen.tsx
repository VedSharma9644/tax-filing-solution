import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { Button } from './ui/button';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const navigation = useNavigation<any>();

  const handleEmailLogin = () => setShowOtp(true);

  const handleOtpVerify = () => {
    setTimeout(() => {
      navigation.navigate('CreateProfile');
    }, 500);
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Welcome to TaxEase</Text>
            <Text style={styles.heroSubtitle}>File your taxes in minutes, not hours</Text>
          </View>
        </View>

        {/* Auth Content */}
        <View style={styles.authContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>Secure Login</Text>
              <Text style={styles.cardDescription}>
                Your data is protected with enterprise-grade security
              </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsList}>
              <View style={[styles.tabButton, tab === 'email' && styles.tabButtonActive]}>
                <Button onPress={() => setTab('email')}>
                  <FontAwesome name="envelope" size={18} color="#fff" />
                  <Text style={styles.tabButtonText}>Email</Text>
                </Button>
              </View>
              <View style={[styles.tabButton, tab === 'phone' && styles.tabButtonActive]}>
                <Button onPress={() => setTab('phone')}>
                  <MaterialIcons name="smartphone" size={18} color="#fff" />
                  <Text style={styles.tabButtonText}>Phone</Text>
                </Button>
              </View>
            </View>

            {/* Tab Content */}
            {tab === 'email' && !showOtp && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  placeholder="your.email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <View style={styles.button}>
                  <Button onPress={handleEmailLogin}>
                    <Text style={styles.buttonText}>Send OTP</Text>
                  </Button>
                </View>
              </View>
            )}
            {tab === 'email' && showOtp && (
              <View style={styles.tabContent}>
                <View style={styles.otpHeader}>
                  <Ionicons name="lock-closed" size={40} color="#007bff" />
                  <Text style={styles.otpText}>
                    We sent a 6-digit code to{"\n"}
                    <Text style={styles.otpEmail}>{email}</Text>
                  </Text>
                </View>
                <Text style={styles.label}>Enter OTP</Text>
                <TextInput
                  placeholder="123456"
                  value={otp}
                  onChangeText={setOtp}
                  style={styles.input}
                  maxLength={6}
                  keyboardType="numeric"
                />
                <View style={styles.button}>
                  <Button onPress={handleOtpVerify}>
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                  </Button>
                </View>
                <View style={styles.button}>
                  <Button onPress={() => setShowOtp(false)}>
                    <Text style={styles.buttonText}>Back to Email</Text>
                  </Button>
                </View>
              </View>
            )}
            {tab === 'phone' && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
                <View style={styles.button}>
                  <Button onPress={handleEmailLogin}>
                    <Text style={styles.buttonText}>Send SMS Code</Text>
                  </Button>
                </View>
              </View>
            )}

            {/* Trust Indicators */}
            <View style={styles.trustIndicators}>
              <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark" size={16} color="#007bff" />
                <Text style={styles.trustText}>Bank-level security</Text>
                <View style={styles.dot} />
                <Text style={styles.trustText}>IRS approved</Text>
                <View style={styles.dot} />
                <Text style={styles.trustText}>Data encrypted</Text>
              </View>
            </View>

            {/* Quick Access Button for Testing */}
            <View style={styles.quickAccessSection}>
              <View style={styles.separator} />
              <Text style={styles.quickAccessText}>For Testing</Text>
              <View style={styles.button}>
                <Button 
                  onPress={() => navigation.navigate('Home')}
                  style={styles.quickAccessButton}
                >
                  <Ionicons name="home" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Continue to Dashboard</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaWrapper>
    );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff' },
  heroSection: { height: 200, justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: 200 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  heroTextContainer: { position: 'absolute', bottom: 16, left: 16 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  heroSubtitle: { color: '#fff', fontSize: 16 },
  authContent: { flex: 1, padding: 16 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { alignItems: 'center', marginBottom: 16 },
  iconCircle: { backgroundColor: '#007bff', borderRadius: 32, padding: 12, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  cardDescription: { color: '#666', textAlign: 'center', marginBottom: 8 },
  tabsList: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  tabButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, marginHorizontal: 8, backgroundColor: '#eee', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#e0f0ff' },
  tabButtonText: { marginLeft: 4, color: '#fff', fontWeight: 'bold' },
  tabContent: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: { marginBottom: 12, backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10 },
  button: { marginVertical: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  otpHeader: { alignItems: 'center', marginBottom: 8 },
  otpText: { textAlign: 'center', color: '#333', marginTop: 8 },
  otpEmail: { fontWeight: 'bold', color: '#007bff' },
  trustIndicators: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  trustText: { fontSize: 12, color: '#888', marginHorizontal: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#888', marginHorizontal: 6 },
  quickAccessSection: { marginTop: 24, paddingTop: 16 },
  separator: { height: 1, backgroundColor: '#eee', marginBottom: 12 },
  quickAccessText: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 8 },
  quickAccessButton: { backgroundColor: '#28a745', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

export default AuthScreen;