import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BackgroundColors } from '../utils/colors';

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigation.navigate('Home');
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
                value={formData.firstName}
                onChangeText={val => updateFormData('firstName', val)}
                style={styles.input}
              />
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                placeholder="Doe"
                value={formData.lastName}
                onChangeText={val => updateFormData('lastName', val)}
                style={styles.input}
              />
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                value={formData.dateOfBirth}
                onChangeText={val => updateFormData('dateOfBirth', val)}
                style={styles.input}
              />
              <Text style={styles.label}>Filing Status</Text>
              <TextInput
                placeholder="Single, Married, or Head of Household"
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
                value={formData.address}
                onChangeText={val => updateFormData('address', val)}
                style={styles.input}
              />
              <Text style={styles.label}>City</Text>
              <TextInput
                placeholder="New York"
                value={formData.city}
                onChangeText={val => updateFormData('city', val)}
                style={styles.input}
              />
              <Text style={styles.label}>State</Text>
              <TextInput
                placeholder="State (e.g., NY, CA, TX, FL)"
                value={formData.state}
                onChangeText={val => updateFormData('state', val)}
                style={styles.input}
              />
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                placeholder="10001"
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
                value={formData.occupation}
                onChangeText={val => updateFormData('occupation', val)}
                style={styles.input}
              />
              <Text style={styles.label}>Employer Name</Text>
              <TextInput
                placeholder="ABC Company Inc."
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
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressBarContainer}>
          <Progress value={progress} />
        </View>
        {renderStep()}
        <View style={styles.buttonRow}>
          <Button onPress={handleBack} variant="outline" style={styles.buttonNav}>
            <Ionicons name="arrow-back" size={18} color="#007bff" style={{ marginRight: 4, alignSelf: 'center' }} />
            <Text style={[styles.buttonText, { color: '#007bff', lineHeight: 18 }]}>Back</Text>
          </Button>
          <Button onPress={handleNext} style={styles.buttonNav}>
            <Text style={[styles.buttonText, { lineHeight: 18 }]}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 4, alignSelf: 'center' }} />
          </Button>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: BackgroundColors.primary, padding: 16 },
  progressBarContainer: { marginBottom: 24 },
  stepContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { backgroundColor: '#007bff', borderRadius: 32, padding: 16, marginBottom: 12 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  stepDescription: { color: '#666', marginBottom: 16 },
  inputGroup: { width: '100%', marginTop: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: { marginBottom: 12, backgroundColor: '#fff', borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  buttonNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, minHeight: 48 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
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