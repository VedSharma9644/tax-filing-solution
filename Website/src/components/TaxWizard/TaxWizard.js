import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TaxWizard.css';
import Colors from '../../utils/colors';
import useTaxWizard from './hooks/useTaxWizard';
import Step1TaxDocuments from './components/Step1TaxDocuments';
import Step2AdditionalIncome from './components/Step2AdditionalIncome';
import Step3DeductionDocuments from './components/Step3DeductionDocuments';
import Step4PersonalInfo from './components/Step4PersonalInfo';
import Step5ReviewDocuments from './components/Step5ReviewDocuments';
import MilestoneProgressBar from './components/MilestoneProgressBar';
import ApiService from '../../config/api';

const TaxWizard = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    step,
    totalSteps,
    formData,
    dependents,
    numberOfDependents,
    isUploading,
    imageLoadingStates,
    imageErrorStates,
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
  } = useTaxWizard();

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

  const milestoneSteps = [
    { id: 1, title: 'W-2 Form', icon: 'document-text' },
    { id: 2, title: 'Income', icon: 'cash' },
    { id: 3, title: 'Deduction', icon: 'receipt' },
    { id: 4, title: 'Info', icon: 'person' },
    { id: 5, title: 'Review', icon: 'checkmark-circle' },
  ];

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Authentication Required. Please log in to submit your tax form.');
        navigate('/');
        return;
      }

      // Check if there are any ongoing uploads
      if (isUploading) {
        alert('Please wait for all documents to finish uploading before submitting.');
        return;
      }

      // Prepare submission data - flatten all documents into a single array
      const allDocuments = [
        ...(formData.previousYearTaxDocuments || []),
        ...(formData.w2Forms || []),
        ...(formData.additionalIncomeGeneralDocuments || []),
        ...(formData.medicalDocuments || []),
        ...(formData.educationDocuments || []),
        ...(formData.dependentChildrenDocuments || []),
        ...(formData.homeownerDeductionDocuments || []),
        ...(formData.personalIdDocuments || []),
        // Include documents from additional income sources
        ...(formData.additionalIncomeSources || []).flatMap(source => source.documents || [])
      ];

      const submissionData = {
        socialSecurityNumber: formData.socialSecurityNumber,
        documents: allDocuments,
        dependents: dependents || [],
        additionalIncomeSources: formData.additionalIncomeSources || [],
        formType: '1040',
        taxYear: new Date().getFullYear(),
        filingStatus: 'single'
      };

      // Submit to backend
      const result = await ApiService.submitTaxForm(submissionData, token);

      // Clear saved data after successful submission
      await clearSavedData();

      // Show success message and navigate to dashboard
      alert(
        `Your tax form has been submitted successfully!\n\n` +
        `Form ID: ${result.taxFormId}\n` +
        `Documents: ${result.data.documentCount}\n` +
        `Dependents: ${result.data.dependentCount}\n\n` +
        `You will be redirected to the dashboard.`
      );

      // Navigate to dashboard
      navigate('/dashboard');
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

      alert(`Submission Error: ${errorMessage}`);
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
            dependents={dependents}
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
          <div className="tax-wizard-placeholder">
            <p className="tax-wizard-placeholder-text">Step {step} - Coming Soon</p>
            <p className="tax-wizard-placeholder-description">
              This step is being refactored and will be available soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="tax-wizard-page" style={{ backgroundColor: Colors.background.secondary }}>
      <div className="tax-wizard-container">
        {/* Header */}
        <div className="tax-wizard-header">
          <div className="tax-wizard-header-row">
            <button 
              className="tax-wizard-back-button" 
              onClick={() => navigate('/dashboard')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="tax-wizard-step-title">{getStepTitle()}</h1>
            <div className="tax-wizard-header-spacer"></div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <MilestoneProgressBar
          currentStep={step}
          totalSteps={totalSteps}
          onStepPress={goToStep}
          steps={milestoneSteps}
        />

        {/* Step Content */}
        <div className="tax-wizard-content">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="tax-wizard-navigation">
          <button
            className="tax-wizard-nav-button tax-wizard-nav-button-previous"
            onClick={previousStep}
            disabled={step === 1}
          >
            Previous
          </button>
          
          <button
            className="tax-wizard-nav-button tax-wizard-nav-button-next"
            onClick={step === totalSteps ? handleSubmit : nextStep}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting 
              ? 'Submitting...' 
              : isUploading 
                ? 'Uploading...' 
                : step === totalSteps 
                  ? 'Submit Form' 
                  : 'Next'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxWizard;

