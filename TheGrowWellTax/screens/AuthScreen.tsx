import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Button } from './ui/button';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Constants from 'expo-constants';
import { BackgroundColors } from '../utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthScreen = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpData, setOtpData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigation = useNavigation<any>();
  const { sendPhoneOTP, verifyPhoneOTP } = useAuth();

  // Load persisted OTP data on component mount
  useEffect(() => {
    const loadPersistedOtpData = async () => {
      try {
        const persistedData = await AsyncStorage.getItem('otpData');
        if (persistedData) {
          const parsedData = JSON.parse(persistedData);
          // Note: We can't persist the confirmation object directly as it's not serializable
          // But we can persist the phone number and show OTP screen
          if (parsedData.phone) {
            setPhone(parsedData.phone);
            setShowOtp(true);
            Alert.alert(
              'Session Restored', 
              'Please enter the OTP sent to your phone number. If you need a new code, go back and resend.',
              [
                { text: 'OK' },
                { text: 'Resend', onPress: () => handlePhoneLogin() }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error loading persisted OTP data:', error);
      }
    };

    loadPersistedOtpData();
  }, []);

  // Persist OTP data when it changes
  useEffect(() => {
    if (otpData) {
      AsyncStorage.setItem('otpData', JSON.stringify({ phone: otpData.phone }));
    }
  }, [otpData]);

  // Clear persisted data when OTP is verified or user goes back
  const clearPersistedData = async () => {
    try {
      await AsyncStorage.removeItem('otpData');
    } catch (error) {
      console.error('Error clearing persisted OTP data:', error);
    }
  };


  const handlePhoneLogin = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    if (!phone.startsWith('+')) {
      Alert.alert('Error', 'Phone number must include country code (e.g., +1 for US, +91 for India)');
      return;
    }

    setLoading(true);
    try {
      const response = await sendPhoneOTP(phone);
      if (response.success) {
        // Store confirmation object directly as returned by Firebase
        setOtpData({ phone, confirmation: response.confirmation });
        setShowOtp(true);
        setRetryCount(0); // Reset retry count on successful send
        Alert.alert('Success', `SMS sent to ${phone}. Check your phone for the verification code.`);
      }
    } catch (error) {
      console.error('Phone login error:', error);
      
      // Handle specific error types
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        Alert.alert(
          'Network Error', 
          'Please check your internet connection and try again.',
          [
            { text: 'Cancel' },
            { text: 'Retry', onPress: () => handlePhoneLogin() }
          ]
        );
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert(
          'Too Many Requests', 
          'Please wait a few minutes before requesting another SMS code.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to send SMS. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    if (!otpData || !otpData.confirmation) {
      Alert.alert('Error', 'Session expired. Please start over.');
      setShowOtp(false);
      return;
    }

    setLoading(true);
    try {
      // Use Firebase Phone Auth confirmation.confirm() method directly
      const response = await verifyPhoneOTP(otpData.confirmation, otp);
      
      if (response && response.success) {
        // Clear persisted data on successful verification
        await clearPersistedData();
        Alert.alert('Success', response.message, [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Home')
          }
        ]);
      } else {
        // Handle case where response is undefined or doesn't have success property
        console.error('Invalid response from verifyPhoneOTP:', response);
        Alert.alert('Error', 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      
      // Handle specific error types
      if (error.message?.includes('Invalid verification code')) {
        setRetryCount(prev => prev + 1);
        const remainingAttempts = 5 - retryCount;
        
        if (remainingAttempts > 0) {
          Alert.alert(
            'Invalid Code', 
            `Incorrect OTP. ${remainingAttempts} attempts remaining.`,
            [
              { text: 'Try Again' },
              { text: 'Resend Code', onPress: () => handlePhoneLogin() }
            ]
          );
        } else {
          Alert.alert(
            'Too Many Attempts', 
            'Please request a new verification code.',
            [
              { text: 'OK', onPress: () => {
                setShowOtp(false);
                setRetryCount(0);
                setOtp('');
              }}
            ]
          );
        }
      } else if (error.message?.includes('expired')) {
        Alert.alert(
          'Code Expired', 
          'The verification code has expired. Please request a new one.',
          [
            { text: 'OK', onPress: () => {
              setShowOtp(false);
              setRetryCount(0);
              setOtp('');
            }}
          ]
        );
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        Alert.alert(
          'Network Error', 
          'Please check your internet connection and try again.',
          [
            { text: 'Cancel' },
            { text: 'Retry', onPress: () => handleOtpVerify() }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to verify OTP. Please check the code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = (userInfo: any) => {
    console.log('Google Login Success:', userInfo);
    Alert.alert('Success', 'Google login successful!', [
      {
        text: 'Continue',
        onPress: () => {
          // Navigation happens automatically when user state changes
          console.log('Google login successful, user state updated automatically');
        }
      }
    ]);
  };

  const handleGoogleLoginError = (error: any) => {
    console.log('Google Login Error:', error);
    Alert.alert('Error', 'Google login failed. Please try again.');
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
            source={require('../assets/mipmap-xxxhdpi.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Welcome to GrowWell Tax</Text>
            <Text style={styles.heroSubtitle}>File your taxes confidently and securely</Text>
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

            {/* Phone Authentication */}
            {!showOtp && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>Phone Number (with country code)</Text>
                <TextInput
                  placeholder="+1234567890"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
                <Text style={styles.helpText}>Include country code (e.g., +1 for US, +91 for India)</Text>
                <View style={styles.button}>
                  <Button onPress={handlePhoneLogin} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Send SMS Code</Text>
                    )}
                  </Button>
                </View>
              </View>
            )}

            {/* OTP Input */}
            {showOtp && (
              <View style={styles.tabContent}>
                <View style={styles.otpHeader}>
                  <Ionicons name="lock-closed" size={40} color="#007bff" />
                  <Text style={styles.otpText}>
                    We sent a 6-digit code to{"\n"}
                    <Text style={styles.otpPhone}>{otpData.phone}</Text>
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
                  <Button onPress={handleOtpVerify} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Verify & Continue</Text>
                    )}
                  </Button>
                </View>
                <View style={styles.button}>
                  <Button onPress={async () => {
                    await clearPersistedData();
                    setShowOtp(false);
                    setRetryCount(0);
                    setOtp('');
                  }}>
                    <Text style={styles.buttonText}>Back to Phone</Text>
                  </Button>
                </View>
              </View>
            )}

            {/* Trust Indicators */}
            <View style={styles.trustIndicators}>
              <View style={styles.trustRow}>
                <Ionicons name="checkmark-circle" size={16} color="#0E502B" />
                <Text style={styles.trustText}>Bank-level security</Text>
                <View style={styles.dot} />
                <Ionicons name="checkmark-circle" size={16} color="#0E502B" />
                <Text style={styles.trustText}>Data encrypted</Text>
              </View>
            </View>

            {/* Google Login */}
            <View style={styles.googleLoginSection}>
              <GoogleLoginButton 
                onLoginSuccess={handleGoogleLoginSuccess}
                onLoginError={handleGoogleLoginError}
              />
            </View>

          </View>
        </View>
      </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaWrapper>
    );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#001826' },
  heroSection: { 
    height: 200, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: 40
  },
  heroImage: { 
    width: 120, 
    height: 120, 
    marginBottom: 16
  },
  heroTextContainer: { 
    alignItems: 'center',
    paddingHorizontal: 20
  },
  heroTitle: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  heroSubtitle: { 
    color: '#fff', 
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9
  },
  authContent: { 
    flex: 1, 
    padding: 20,
    paddingTop: 0
  },
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 24, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  cardHeader: { 
    alignItems: 'center', 
    marginBottom: 24 
  },
  iconCircle: { 
    backgroundColor: '#0E502B', 
    borderRadius: 32, 
    padding: 12, 
    marginBottom: 16 
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#000'
  },
  cardDescription: { 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 8,
    fontSize: 14
  },
  tabContent: { marginBottom: 16 },
  label: { 
    fontSize: 14, 
    fontWeight: '500', 
    marginBottom: 8,
    color: '#333'
  },
  input: { 
    marginBottom: 16, 
    backgroundColor: '#fff', 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12,
    color: '#333',
    fontSize: 16
  },
  button: { marginVertical: 8 },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
  },
  googleButton: {
    backgroundColor: '#001826',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  googleIcon: {
    marginRight: 8
  },
  otpHeader: { alignItems: 'center', marginBottom: 16 },
  otpText: { textAlign: 'center', color: '#333', marginTop: 8 },
  otpPhone: { fontWeight: 'bold', color: '#0E502B' },
  trustIndicators: { 
    marginTop: 24, 
    paddingTop: 16 
  },
  trustRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  trustText: { 
    fontSize: 12, 
    color: '#666', 
    marginHorizontal: 8 
  },
  dot: { 
    width: 4, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: '#ccc', 
    marginHorizontal: 8 
  },
  googleLoginSection: { 
    marginTop: 16
  },
  helpText: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 4, 
    marginBottom: 8 
  },
});

export default AuthScreen;