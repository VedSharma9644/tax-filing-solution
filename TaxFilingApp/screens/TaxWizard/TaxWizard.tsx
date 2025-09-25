import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useTaxWizard } from './hooks/useTaxWizard';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import Step1TaxDocuments from './components/Step1TaxDocuments';
import Step2DeductionDocuments from './components/Step2DeductionDocuments';
import Step3PersonalInfo from './components/Step3PersonalInfo';
import Step4ReviewDocuments from './components/Step4ReviewDocuments';
import DataLoadingScreen from './components/DataLoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import TaxFormService from '../../services/taxFormService';

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
    handleImageLoad,
    handleImageError,
    initializeImageStates,
    clearSavedData,
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

      // Show success message
      Alert.alert(
        'Success!',
        `Your tax form has been submitted successfully.\n\nForm ID: ${result.taxFormId}\nDocuments: ${result.data.documentCount}\nDependents: ${result.data.dependentCount}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home
              // navigation.navigate('Home');
            },
          },
        ]
      );
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
          <Step2DeductionDocuments
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
      case 3:
        return (
          <Step3PersonalInfo
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
      case 4:
        return (
          <Step4ReviewDocuments
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
      'Deduction Related Documents',
      'Personal Information',
      'Review Documents',
    ];
    return stepTitles[step - 1] || `Step ${step}`;
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepTitle}>{getStepTitle()}</Text>
          <Text style={styles.stepCounter}>Step {step} of {totalSteps}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Progress value={progress} />
          <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
        </View>

        {/* Step Content */}
        <View style={styles.content}>
          {renderStep()}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <Button
            variant="outline"
            onPress={previousStep}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </Button>
          
          <Button
            onPress={step === totalSteps ? handleSubmit : nextStep}
            style={styles.navButton}
            disabled={isSubmitting || isUploading}
          >
            <Text style={styles.navButtonText}>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stepCounter: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    padding: 20,
    paddingTop: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
