/**
 * Centralized Styles for TaxWizard Components
 * 
 * This file contains all style definitions used throughout the TaxWizard flow.
 * Import specific styles to maintain consistency across all tax form steps.
 */

import { StyleSheet, Dimensions } from 'react-native';
import { BackgroundColors, TextColors, BrandColors } from './colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const TaxWizardStyles = StyleSheet.create({
  // Main Container Styles
  container: {
    flex: 1,
    backgroundColor: BackgroundColors.secondary,
  },
  
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: BackgroundColors.secondary,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: BackgroundColors.secondary,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TextColors.primary,
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: TextColors.secondary,
    marginBottom: 16,
  },

  // Progress Bar Styles
  progressContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: BackgroundColors.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
    borderRadius: 4,
  },
  
  progressText: {
    fontSize: 14,
    color: TextColors.secondary,
    textAlign: 'center',
    marginTop: 8,
  },

  // Card Styles
  card: {
    backgroundColor: BackgroundColors.primary,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Tax Form Component Command Card Style
  taxFormComponentCommand: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  
  cardHeader: {
    marginBottom: 16,
    padding: 0, // Remove padding from card headers
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TextColors.primary,
    marginBottom: 4,
  },
  
  cardDescription: {
    fontSize: 14,
    color: TextColors.secondary,
  },

  // Button Styles
  primaryButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BrandColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  
  secondaryButtonText: {
    color: BrandColors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  disabledButton: {
    backgroundColor: TextColors.tertiary,
    opacity: 0.6,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TextColors.black,
    marginBottom: 8,
  },
  
  input: {
    backgroundColor: '#f8f9fa', // Off-white background
    borderWidth: 1,
    borderColor: BackgroundColors.tertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333', // Black text for better contrast
  },
  
  inputFocused: {
    borderColor: BrandColors.primary,
  },
  
  inputError: {
    borderColor: BrandColors.danger,
  },
  
  errorText: {
    fontSize: 12,
    color: BrandColors.danger,
    marginTop: 4,
  },

  // Upload Styles
  uploadContainer: {
    borderWidth: 2,
    borderColor: BackgroundColors.tertiary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  
  uploadContainerActive: {
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
  },
  
  uploadIcon: {
    marginBottom: 12,
  },
  
  uploadText: {
    fontSize: 16,
    color: TextColors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  
  uploadSubtext: {
    fontSize: 14,
    color: TextColors.secondary,
    textAlign: 'center',
  },

  // Document List Styles
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BackgroundColors.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  
  documentIcon: {
    marginRight: 12,
  },
  
  documentInfo: {
    flex: 1,
  },
  
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: TextColors.primary,
    marginBottom: 2,
  },
  
  documentSize: {
    fontSize: 12,
    color: TextColors.secondary,
  },
  
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Navigation Styles
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: BackgroundColors.tertiary,
    backgroundColor: BackgroundColors.secondary,
  },
  
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Previous Button Style (White background, black text)
  previousButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  previousButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },

  // Next Button Style (Green background, white text)
  nextButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    backgroundColor: '#16A34A',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Status Styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  statusIcon: {
    marginRight: 8,
  },
  
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  statusSuccess: {
    color: BrandColors.success,
  },
  
  statusWarning: {
    color: BrandColors.warning,
  },
  
  statusError: {
    color: BrandColors.danger,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BackgroundColors.secondary,
  },
  
  loadingText: {
    fontSize: 16,
    color: TextColors.secondary,
    marginTop: 16,
  },

  // Responsive Styles
  responsivePadding: {
    paddingHorizontal: Math.min(16, screenWidth * 0.04),
  },
  
  responsiveMargin: {
    marginHorizontal: Math.min(16, screenWidth * 0.04),
  },
});

// Export commonly used style groups
export const ContainerStyles = {
  main: TaxWizardStyles.container,
  scroll: TaxWizardStyles.scrollContainer,
  card: TaxWizardStyles.card,
  taxFormComponentCommand: TaxWizardStyles.taxFormComponentCommand,
};

export const ButtonStyles = {
  primary: TaxWizardStyles.primaryButton,
  secondary: TaxWizardStyles.secondaryButton,
  disabled: TaxWizardStyles.disabledButton,
};

export const InputStyles = {
  container: TaxWizardStyles.inputContainer,
  input: TaxWizardStyles.input,
  label: TaxWizardStyles.inputLabel,
  error: TaxWizardStyles.inputError,
};

export const UploadStyles = {
  container: TaxWizardStyles.uploadContainer,
  active: TaxWizardStyles.uploadContainerActive,
  text: TaxWizardStyles.uploadText,
  subtext: TaxWizardStyles.uploadSubtext,
};
