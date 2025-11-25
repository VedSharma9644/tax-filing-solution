import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert, ActivityIndicator, Keyboard, TouchableOpacity } from 'react-native';
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
  
  // Email/Password states
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('email'); // Default to email
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const navigation = useNavigation<any>();
  const { sendPhoneOTP, verifyPhoneOTP, emailPasswordSignup, emailPasswordLogin } = useAuth();
  
  // Refs for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);

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

  // Keyboard event listeners for enhanced handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 100 : 200);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Optional: Handle keyboard hide if needed
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Function to scroll to input field
  const scrollToInput = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === 'ios' ? 100 : 200);
  };

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

  const handleEmailPasswordAuth = async () => {
    // Validate email
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Validate confirm password for signup
    if (isSignup && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isSignup) {
        response = await emailPasswordSignup(email, password);
      } else {
        response = await emailPasswordLogin(email, password);
      }

      if (response && response.success) {
        Alert.alert('Success', response.message || (isSignup ? 'Account created successfully!' : 'Login successful!'), [
          {
            text: 'Continue',
            onPress: () => {
              // Navigation happens automatically when user state changes
              console.log('Email/password auth successful, user state updated automatically');
            }
          }
        ]);
      }
    } catch (error: any) {
      console.error('Email/Password Auth Error:', error);
      Alert.alert('Error', error.message || (isSignup ? 'Failed to create account. Please try again.' : 'Failed to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios' ? false : true}
        >
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

            {/* Auth Mode Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => {
                  setAuthMode('email');
                  setShowOtp(false);
                }}
                style={[styles.tabButton, authMode === 'email' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabButtonText, authMode === 'email' && styles.tabButtonTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setAuthMode('phone');
                  setShowOtp(false);
                }}
                style={[styles.tabButton, authMode === 'phone' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabButtonText, authMode === 'phone' && styles.tabButtonTextActive]}>
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email/Password Authentication */}
            {authMode === 'email' && (
              <View style={styles.tabContent}>
                {/* Signup/Login Toggle */}
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    onPress={() => setIsSignup(false)}
                    style={[styles.toggleButton, !isSignup && styles.toggleButtonActive]}
                  >
                    <Text style={[styles.toggleButtonText, !isSignup && styles.toggleButtonTextActive]}>
                      Login
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsSignup(true)}
                    style={[styles.toggleButton, isSignup && styles.toggleButtonActive]}
                  >
                    <Text style={[styles.toggleButtonText, isSignup && styles.toggleButtonTextActive]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  placeholder="your.email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={scrollToInput}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry
                  onFocus={scrollToInput}
                />

                {isSignup && (
                  <>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.input}
                      secureTextEntry
                      onFocus={scrollToInput}
                    />
                  </>
                )}

                <View style={styles.button}>
                  <Button onPress={handleEmailPasswordAuth} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {isSignup ? 'Create Account' : 'Sign In'}
                      </Text>
                    )}
                  </Button>
                </View>

                {/* Demo Account Info */}
                {!isSignup && (
                  <View style={styles.demoAccountContainer}>
                    <Text style={styles.demoAccountTitle}>Demo Account for Reviewers</Text>
                    <Text style={styles.demoAccountText}>Email: demo@growwelltax.com</Text>
                    <Text style={styles.demoAccountText}>Password: Demo123!</Text>
                    <Text style={styles.demoAccountNote}>
                      Note: If this is your first time, please create the account first by switching to "Sign Up" tab above.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Phone Authentication */}
            {authMode === 'phone' && !showOtp && (
              <View style={styles.tabContent}>
                <Text style={styles.label}>Phone Number (with country code)</Text>
                <TextInput
                  placeholder="+1234567890"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  keyboardType="phone-pad"
                  onFocus={scrollToInput}
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
            {authMode === 'phone' && showOtp && (
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
                  onFocus={scrollToInput}
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
  container: { 
    flexGrow: 1, 
    backgroundColor: '#001826',
    paddingBottom: Platform.OS === 'ios' ? 20 : 40 // Extra padding for keyboard
  },
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#0E502B',
  },
  tabButtonText: {
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
  },
  toggleButtonText: {
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  demoAccountContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  demoAccountTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  demoAccountText: {
    fontSize: 12,
    color: '#2e7d32',
    marginBottom: 4,
  },
  demoAccountNote: {
    fontSize: 11,
    color: '#2e7d32',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AuthScreen;