import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, TouchableOpacity } from 'react-native';
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

const ProfileSetup = () => {
  const { user, token, updateUser } = useAuth();
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

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step - save profile data
      await handleSaveProfile();
    }
  };

  const handleSaveProfile = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication token missing');
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
      const response = await ProfileService.updateProfile(token, profileData);
      
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
});

export default ProfileSetup;