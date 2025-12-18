import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BackgroundColors } from '../utils/colors';
import { useAuth } from '../contexts/AuthContext';
import ProfileService from '../services/profileService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { secureStorage } from '../utils/secureStorage';

const ProfileSetup = () => {
  const { user, token, updateUser, loading: authLoading } = useAuth();
  const [currentToken, setCurrentToken] = useState(token);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: '',
    occupation: '',
    employer: '',
  });
  const navigation = useNavigation<any>();
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  // Ensure we have the token - check both context and storage
  useEffect(() => {
    const loadToken = async () => {
      console.log('ProfileSetup: Loading token...', { token: !!token, authLoading, hasUser: !!user });
      
      if (token) {
        console.log('ProfileSetup: Token found in context');
        setCurrentToken(token);
        return;
      }
      
      // If auth finished loading, try to get from storage
      if (!authLoading) {
        try {
          console.log('ProfileSetup: Loading token from storage...');
          const tokens = await secureStorage.getAuthTokens();
          if (tokens?.accessToken) {
            console.log('ProfileSetup: Token loaded from storage');
            setCurrentToken(tokens.accessToken);
          } else {
            console.log('ProfileSetup: No token in storage');
          }
        } catch (e) {
          console.error('ProfileSetup: Error loading token:', e);
        }
      }
    };
    loadToken();
  }, [token, authLoading, user]);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - save profile data
      await handleSaveProfile();
    }
  };

  const handleSaveProfile = async () => {
    console.log('ProfileSetup: Saving profile...', { 
      hasUser: !!user, 
      currentToken: !!currentToken, 
      token: !!token,
      authLoading 
    });

    // Wait for auth to finish loading if still loading
    if (authLoading && !user) {
      Alert.alert('Please wait', 'Authentication is being verified...');
      return;
    }

    // Get token - prefer currentToken state, fallback to context token, then storage
    let authToken = currentToken || token;
    if (!authToken) {
      console.log('ProfileSetup: Token not in state/context, loading from storage...');
      // Try to get token from secure storage as fallback
      try {
        const tokens = await secureStorage.getAuthTokens();
        authToken = tokens?.accessToken;
        if (authToken) {
          console.log('ProfileSetup: Token loaded from storage');
          setCurrentToken(authToken); // Update state for next time
        } else {
          console.log('ProfileSetup: No token in storage either');
        }
      } catch (e) {
        console.error('ProfileSetup: Error getting token from storage:', e);
      }
    } else {
      console.log('ProfileSetup: Using token from state/context');
    }

    if (!authToken) {
      console.error('ProfileSetup: No token available anywhere!');
      Alert.alert('Error', 'Authentication token missing. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        Alert.alert('Required Fields', 'Please provide first name and last name');
        setLoading(false);
        return;
      }

      // Prepare profile data
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        filingStatus: formData.filingStatus || undefined,
        occupation: formData.occupation || undefined,
        employer: formData.employer || undefined,
      };

      // Save to backend
      const response = await ProfileService.updateProfile(authToken, profileData);
      
      if (response.success) {
        // Update AuthContext user immediately so changes are reflected throughout the app
        if (response.user) {
          await updateUser({
            ...user,
            ...response.user,
            profileComplete: true
          });
        } else {
          // If response doesn't include full user object, update with form data
          await updateUser({
            ...user,
            ...profileData,
            profileComplete: true
          });
        }
        
        Alert.alert('Success', 'Profile saved successfully!');
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Error', response.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.navigate('Signup');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date && event.type !== 'dismissed') {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      updateFormData('dateOfBirth', formattedDate);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome name="user" size={32} color="#fff" />
            </View>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepDescription}>Tell us about yourself</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                placeholder="John"
                placeholderTextColor="#000"
                value={formData.firstName}
                onChangeText={val => updateFormData('firstName', val)}
                style={styles.input}
              />
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                placeholder="Doe"
                placeholderTextColor="#000"
                value={formData.lastName}
                onChangeText={val => updateFormData('lastName', val)}
                style={styles.input}
              />
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={styles.datePickerButton}
              >
                <Text style={[styles.datePickerText, !formData.dateOfBirth && styles.datePickerPlaceholder]}>
                  {formData.dateOfBirth || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
              <Text style={styles.label}>Filing Status</Text>
              <TextInput
                placeholder="Single, Married, or Head of Household"
                placeholderTextColor="#000"
                value={formData.filingStatus}
                onChangeText={val => updateFormData('filingStatus', val)}
                style={styles.input}
              />
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome name="map-marker" size={32} color="#fff" />
            </View>
            <Text style={styles.stepTitle}>Address Information</Text>
            <Text style={styles.stepDescription}>Where do you live?</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                placeholder="123 Main Street"
                placeholderTextColor="#000"
                value={formData.address}
                onChangeText={val => updateFormData('address', val)}
                style={styles.input}
              />
              <Text style={styles.label}>City</Text>
              <TextInput
                placeholder="New York"
                placeholderTextColor="#000"
                value={formData.city}
                onChangeText={val => updateFormData('city', val)}
                style={styles.input}
              />
              <Text style={styles.label}>State</Text>
              <TextInput
                placeholder="State (e.g., NY, CA, TX, FL)"
                placeholderTextColor="#000"
                value={formData.state}
                onChangeText={val => updateFormData('state', val)}
                style={styles.input}
              />
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                placeholder="10001"
                placeholderTextColor="#000"
                value={formData.zipCode}
                onChangeText={val => updateFormData('zipCode', val)}
                style={styles.input}
              />
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <FontAwesome name="dollar" size={32} color="#fff" />
            </View>
            <Text style={styles.stepTitle}>Employment Information</Text>
            <Text style={styles.stepDescription}>Tell us about your work</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation</Text>
              <TextInput
                placeholder="Software Engineer"
                placeholderTextColor="#000"
                value={formData.occupation}
                onChangeText={val => updateFormData('occupation', val)}
                style={styles.input}
              />
              <Text style={styles.label}>Employer Name</Text>
              <TextInput
                placeholder="ABC Company Inc."
                placeholderTextColor="#000"
                value={formData.employer}
                onChangeText={val => updateFormData('employer', val)}
                style={styles.input}
              />
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>What's Next?</Text>
                <Text style={styles.infoText}>
                  • Upload your tax documents (W-2, 1099, etc.)
                  • Review and complete your tax return
                  • E-file directly with the IRS
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Show loading only if auth is still loading AND we don't have a user yet
  // If we have a user, show the form - we'll get the token when needed
  if (authLoading && !user) {
    return (
      <SafeAreaWrapper style={{ backgroundColor: '#001826' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // If we have a user but no token, log it but still show the form
  // The token will be retrieved when saving the profile
  if (user && !currentToken && !token) {
    console.log('ProfileSetup: User exists but no token yet - will retrieve on save');
  }

  return (
    <SafeAreaWrapper style={{ backgroundColor: '#001826' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressBarContainer}>
          <Progress value={progress} />
        </View>
        {renderStep()}
        <View style={styles.buttonRow}>
          <Button onPress={handleBack} variant="outline" style={styles.buttonNav}>
            <Ionicons name="arrow-back" size={18} color="#000" style={{ marginRight: 4, alignSelf: 'center' }} />
            <Text style={[styles.buttonText, { color: '#000', lineHeight: 18 }]}>Back</Text>
          </Button>
          <Button onPress={handleNext} style={[styles.buttonNav, loading && styles.buttonDisabled]} disabled={loading}>
            {loading ? (
              <Text style={[styles.buttonText, { lineHeight: 18 }]}>Saving...</Text>
            ) : (
              <>
                <Text style={[styles.buttonText, { lineHeight: 18 }]}>
                  {step === totalSteps ? 'Finish' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 4, alignSelf: 'center' }} />
              </>
            )}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#001826', padding: 16 },
  progressBarContainer: { marginBottom: 24 },
  stepContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { backgroundColor: '#007bff', borderRadius: 32, padding: 16, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#fff' },
  stepDescription: { color: '#fff', marginBottom: 16 },
  inputGroup: { width: '100%', marginTop: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#fff' },
  input: { marginBottom: 12, backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10, color: '#000' },
  datePickerButton: { marginBottom: 12, backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10, justifyContent: 'center', minHeight: 48 },
  datePickerText: { color: '#000', fontSize: 16 },
  datePickerPlaceholder: { color: '#999' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  buttonNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, minHeight: 48 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.6 },
  selectTrigger: { height: 48, borderColor: '#ccc', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10 },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#555' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
  },
});

export default ProfileSetup;