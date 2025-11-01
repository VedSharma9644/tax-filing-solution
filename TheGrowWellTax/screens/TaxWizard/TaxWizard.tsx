import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useTaxWizard } from './hooks/useTaxWizard';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import Step1TaxDocuments from './components/Step1TaxDocuments';
import Step2AdditionalIncome from './components/Step2AdditionalIncome';
import Step3DeductionDocuments from './components/Step3DeductionDocuments';
import Step4PersonalInfo from './components/Step4PersonalInfo';
import Step5ReviewDocuments from './components/Step5ReviewDocuments';
import DataLoadingScreen from './components/DataLoadingScreen';
import MilestoneProgressBar from './components/MilestoneProgressBar';
import { useAuth } from '../../contexts/AuthContext';
import TaxFormService from '../../services/taxFormService';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundColors } from '../../utils/colors';
import { TaxWizardStyles } from '../../utils/taxWizardStyles';

const TaxWizard: React.FC = () => {
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    step,
    totalSteps,
    progress,
    formData,
    dependents,
    numberOfDependents,
    isUploading,
    imageLoadingStates,
    imageErrorStates,
    isDataLoaded,
    nextStep,
    previousStep,
    updateFormData,
    updateNumberOfDependents,
    updateDependent,
    removeDependent,
    uploadDocument,
    deleteDocument,
    uploadIncomeSourceDocument,
    deleteIncomeSourceDocument,
    handleImageLoad,
    handleImageError,
    initializeImageStates,
    clearSavedData,
    goToStep,
    navigation,
  } = useTaxWizard();

  // Show loading screen while data is being loaded
  if (!isDataLoaded) {
    return <DataLoadingScreen />;
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);

      // Check if user is authenticated
      if (!user || !token) {
        Alert.alert('Authentication Required', 'Please log in to submit your tax form.');
        return;
      }

      // Validate form data before submission
      const validation = TaxFormService.validateFormData(formData);
      if (!validation.isValid) {
        Alert.alert(
          'Validation Error',
          validation.errors.join('\n'),
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if there are any ongoing uploads
      if (isUploading) {
        Alert.alert(
          'Upload in Progress',
          'Please wait for all documents to finish uploading before submitting.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        dependents: dependents
      };

      // Submit to backend
      const result = await TaxFormService.submitTaxForm(submissionData, token);

      // Clear saved data after successful submission
      await clearSavedData();

      // Show success message and navigate to home
      Alert.alert(
        'Success!',
        `Your tax form has been submitted successfully.\n\nForm ID: ${result.taxFormId}\nDocuments: ${result.data.documentCount}\nDependents: ${result.data.dependentCount}\n\nYou will be redirected to the home screen.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home to prevent duplicate submissions
              navigation.navigate('Home');
            },
          },
        ],
        {
          // Auto-dismiss after 5 seconds and navigate to home
          onDismiss: () => {
            navigation.navigate('Home');
          }
        }
      );

      // Backup navigation after 6 seconds (in case Alert doesn't auto-dismiss)
      setTimeout(() => {
        navigation.navigate('Home');
      }, 6000);
    } catch (error) {
      console.error('Tax form submission error:', error);
      
      let errorMessage = 'Failed to submit form. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.message.includes('Validation')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Submission Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1TaxDocuments
            formData={formData}
            isUploading={isUploading}
            imageLoadingStates={imageLoadingStates}
            imageErrorStates={imageErrorStates}
            onUploadDocument={uploadDocument}
            onDeleteDocument={deleteDocument}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            onInitializeImageStates={initializeImageStates}
          />
        );
      case 2:
        return (
          <Step2AdditionalIncome
            formData={formData}
            onUpdateFormData={updateFormData}
            onUploadIncomeSourceDocument={uploadIncomeSourceDocument}
            onDeleteIncomeSourceDocument={deleteIncomeSourceDocument}
            onUploadDocument={uploadDocument}
            onDeleteDocument={deleteDocument}
            isUploading={isUploading}
          />
        );
      case 3:
        return (
          <Step3DeductionDocuments
            formData={formData}
            dependents={dependents}
            numberOfDependents={numberOfDependents}
            isUploading={isUploading}
            imageLoadingStates={imageLoadingStates}
            imageErrorStates={imageErrorStates}
            onUploadDocument={uploadDocument}
            onDeleteDocument={deleteDocument}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            onInitializeImageStates={initializeImageStates}
            onUpdateNumberOfDependents={updateNumberOfDependents}
            onUpdateDependent={updateDependent}
            onRemoveDependent={removeDependent}
          />
        );
      case 4:
        return (
          <Step4PersonalInfo
            formData={formData}
            isUploading={isUploading}
            imageLoadingStates={imageLoadingStates}
            imageErrorStates={imageErrorStates}
            onUpdateFormData={updateFormData}
            onUploadDocument={uploadDocument}
            onDeleteDocument={deleteDocument}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            onInitializeImageStates={initializeImageStates}
          />
        );
      case 5:
        return (
          <Step5ReviewDocuments
            formData={formData}
            isUploading={isUploading}
            imageLoadingStates={imageLoadingStates}
            imageErrorStates={imageErrorStates}
            onUploadDocument={uploadDocument}
            onDeleteDocument={deleteDocument}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            onInitializeImageStates={initializeImageStates}
          />
        );
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Step {step} - Coming Soon</Text>
            <Text style={styles.placeholderDescription}>
              This step is being refactored and will be available soon.
            </Text>
          </View>
        );
    }
  };

  const getStepTitle = () => {
    const stepTitles = [
      'Tax Related Documents',
      'Additional Income',
      'Deduction Documents',
      'Personal Information',
      'Review Documents',
    ];
    return stepTitles[step - 1] || `Step ${step}`;
  };

  // Define the steps for the milestone progress bar
  const milestoneSteps = [
    { id: 1, title: 'W-2 Form', icon: 'document-text' },
    { id: 2, title: 'Income', icon: 'cash' },
    { id: 3, title: 'Deduction', icon: 'receipt' },
    { id: 4, title: 'Info', icon: 'person' },
    { id: 5, title: 'Review', icon: 'checkmark-circle' },
  ];

  return (
    <SafeAreaWrapper edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.stepTitle} numberOfLines={1}>{getStepTitle()}</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Milestone Progress Bar */}
        <MilestoneProgressBar
          currentStep={step}
          totalSteps={totalSteps}
          onStepPress={goToStep}
          steps={milestoneSteps}
        />

        {/* Step Content */}
        <View style={styles.content}>
          {renderStep()}
        </View>

        {/* Navigation */}
        <View style={TaxWizardStyles.navigationContainer}>
          <Button
            variant="outline"
            onPress={previousStep}
            style={TaxWizardStyles.previousButton}
          >
            <Text style={TaxWizardStyles.previousButtonText}>Previous</Text>
          </Button>
          
          <Button
            onPress={step === totalSteps ? handleSubmit : nextStep}
            style={TaxWizardStyles.nextButton}
            disabled={isSubmitting || isUploading}
          >
            <Text style={TaxWizardStyles.nextButtonText}>
              {isSubmitting 
                ? 'Submitting...' 
                : isUploading 
                  ? 'Uploading...' 
                  : step === totalSteps 
                    ? 'Submit Form' 
                    : 'Next'
              }
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: TaxWizardStyles.container,
  header: TaxWizardStyles.header,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    color: '#fff',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    flex: 1,
    textAlign: 'center',
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  headerSpacer: {
    width: 32, // Reduced width to give more space to title
  },
  stepCounter: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  placeholderDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TaxWizard;
