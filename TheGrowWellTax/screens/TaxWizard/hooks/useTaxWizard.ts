import { useState, useCallback, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Alert } from 'react-native';
import { TaxFormData, UploadedDocument, Dependent, AdditionalIncomeSource } from '../types';
import { uploadToGCS, deleteFromGCS } from '../utils/documentUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  saveAllFormData, 
  loadAllFormData, 
  clearAllFormData, 
  hasSavedFormData 
} from '../../../services/persistenceService';
import { logUserFlow, validateUserId, logUploadFlow } from '../../../utils/debugHelper';

export const useTaxWizard = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const initialStep = route.params?.step || 1;
  
  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState<TaxFormData>({
    socialSecurityNumber: '',
    previousYearTaxDocuments: [],
    w2Forms: [],
    hasAdditionalIncome: false,
    additionalIncomeSources: [],
    additionalIncomeGeneralDocuments: [],
    medicalDocuments: [],
    educationDocuments: [],
    dependentChildrenDocuments: [],
    homeownerDeductionDocuments: [],
    personalIdDocuments: [],
  });

  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [numberOfDependents, setNumberOfDependents] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
  const [imageErrorStates, setImageErrorStates] = useState<{[key: string]: boolean}>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        if (!user?.id) {
          console.log('🔍 No user ID available, skipping data load');
          setIsDataLoaded(true);
          return;
        }
        
        logUserFlow('Loading Saved Data', user.id);
        const savedData = await loadAllFormData(user.id);
        
        if (savedData.formData) {
          // Merge saved data with default values to ensure all fields exist
          setFormData({
            socialSecurityNumber: '',
            previousYearTaxDocuments: [],
            w2Forms: [],
            hasAdditionalIncome: false,
            additionalIncomeSources: [],
            additionalIncomeGeneralDocuments: [],
            medicalDocuments: [],
            educationDocuments: [],
            dependentChildrenDocuments: [],
            homeownerDeductionDocuments: [],
            personalIdDocuments: [],
            ...savedData.formData, // Spread saved data to override defaults
            // Ensure new fields are initialized if missing
            additionalIncomeGeneralDocuments: savedData.formData.additionalIncomeGeneralDocuments || [],
          });
        }
        if (savedData.dependents) {
          setDependents(savedData.dependents);
        }
        if (savedData.numberOfDependents) {
          setNumberOfDependents(savedData.numberOfDependents);
        }
        if (savedData.currentStep && savedData.currentStep !== step) {
          // Navigate to the saved step if different from current
          // Note: This might need to be handled by the parent component
        }
        
        setIsDataLoaded(true);
        logUserFlow('Data Loaded Successfully', user.id, { hasData: !!savedData.formData });
      } catch (error) {
        console.error('Error loading saved data:', error);
        setIsDataLoaded(true); // Still set to true to prevent infinite loading
      }
    };

    loadSavedData();
  }, [user?.id]);

  // Auto-save data whenever form data changes
  useEffect(() => {
    if (isDataLoaded && user?.id) {
      const saveData = async () => {
        logUserFlow('Auto-saving Data', user.id);
        await saveAllFormData(formData, dependents, numberOfDependents, step, user.id);
      };
      
      // Debounce saves to avoid too frequent writes
      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, dependents, numberOfDependents, step, isDataLoaded, user?.id]);

  const nextStep = useCallback(() => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      navigation.navigate('Home');
    }
  }, [step, totalSteps, navigation]);

  const previousStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.navigate('Home');
    }
  }, [step, navigation]);

  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 1 && targetStep <= totalSteps) {
      setStep(targetStep);
    }
  }, [totalSteps]);

  const updateFormData = useCallback((field: keyof TaxFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateNumberOfDependents = useCallback((value: string) => {
    setNumberOfDependents(value);
    
    const numDeps = parseInt(value) || 0;
    
    if (numDeps === 0 || value === '') {
      // Clear existing dependents when number is 0 or empty
      setDependents([]);
    } else if (numDeps > dependents.length) {
      // Add new dependents if the number increased
      const newDependents: Dependent[] = [];
      for (let i = dependents.length; i < numDeps; i++) {
        newDependents.push({
          id: Math.random().toString(36).substr(2, 9),
          name: '',
          age: '',
          relationship: '',
        });
      }
      setDependents(prev => [...prev, ...newDependents]);
    } else if (numDeps < dependents.length) {
      // Remove excess dependents if the number decreased
      setDependents(prev => prev.slice(0, numDeps));
    }
  }, [dependents.length]);


  const updateDependent = useCallback((id: string, field: keyof Dependent, value: string) => {
    setDependents(prev => prev.map(dep => 
      dep.id === id ? { ...dep, [field]: value } : dep
    ));
  }, []);

  const removeDependent = useCallback((id: string) => {
    setDependents(prev => prev.filter(dep => dep.id !== id));
  }, []);

  // Upload document for a specific additional income source
  const uploadIncomeSourceDocument = useCallback(async (file: any, incomeSourceId: string) => {
    const userId = user?.id;
    if (!userId || !token) {
      Alert.alert('Error', 'Please log in to upload documents');
      return;
    }

    const isImage = file.mimeType?.startsWith('image/');

    const document: UploadedDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name || 'Document',
      type: file.mimeType || 'application/octet-stream',
      size: file.size || 0,
      status: 'uploading',
      progress: 0,
      category: 'additional_income',
      uri: file.uri,
      timestamp: new Date(),
      previewUrl: file.uri,
      isImage: isImage,
    };

    // Update the specific income source's documents
    setFormData(prev => ({
      ...prev,
      additionalIncomeSources: prev.additionalIncomeSources.map(source => 
        source.id === incomeSourceId 
          ? { ...source, documents: [...(source.documents || []), document] }
          : source
      )
    }));

    // Upload to Google Cloud Storage
    setIsUploading(true);
    try {
      console.log('🔐 Debug - Token value:', token ? 'Token exists' : 'Token is null/undefined');
      console.log('📤 Uploading income source document:', {
        fileName: document.name,
        incomeSourceId,
        userId,
        category: 'additional_income'
      });

      const result = await uploadToGCS(file, userId, 'additional_income', (progress) => {
        // Update progress for this specific document
        setFormData(prev => ({
          ...prev,
          additionalIncomeSources: prev.additionalIncomeSources.map(source => 
            source.id === incomeSourceId 
              ? {
                  ...source, 
                  documents: source.documents?.map(doc => 
                    doc.id === document.id ? { ...doc, progress } : doc
                  ) || []
                }
              : source
          )
        }));
      }, token);

      // Update document with success status
      setFormData(prev => ({
        ...prev,
        additionalIncomeSources: prev.additionalIncomeSources.map(source => 
          source.id === incomeSourceId 
            ? {
                ...source, 
                documents: source.documents?.map(doc => 
                  doc.id === document.id 
                    ? { 
                        ...doc, 
                        status: 'completed' as const,
                        progress: 100,
                        gcsPath: result.gcsPath,
                        publicUrl: result.publicUrl
                      } 
                    : doc
                ) || []
              }
            : source
        )
      }));

      console.log('✅ Income source document uploaded successfully:', result);
    } catch (error) {
      console.error('❌ Income source document upload error:', error);
      
      // Update document with error status
      setFormData(prev => ({
        ...prev,
        additionalIncomeSources: prev.additionalIncomeSources.map(source => 
          source.id === incomeSourceId 
            ? {
                ...source, 
                documents: source.documents?.map(doc => 
                  doc.id === document.id 
                    ? { ...doc, status: 'error' as const, progress: 0 } 
                    : doc
                ) || []
              }
            : source
        )
      }));

      Alert.alert('Upload Failed', error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [user, token]);

  const uploadDocument = useCallback(async (file: any, category: string) => {
    // Use the authenticated user's ID
    const userId = user?.id;
    
    // Debug logging
    logUserFlow('Upload Start', userId, { category, fileName: file.name });
    
    // Debug: Log the actual file object structure
    console.log('🔍 File object structure:', {
      keys: Object.keys(file),
      name: file.name,
      fileName: file.fileName,
      type: file.type,
      mimeType: file.mimeType,
      size: file.size,
      fileSize: file.fileSize,
      uri: file.uri,
      width: file.width,
      height: file.height
    });

    // Calculate file size in MB for debugging
    const fileSizeBytes = file.size || file.fileSize || 0;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    console.log(`📏 File size: ${fileSizeBytes} bytes (${fileSizeMB} MB)`);
    
    // Warn if file is very large
    if (fileSizeBytes > 5 * 1024 * 1024) { // 5MB
      console.warn(`⚠️ Large file detected: ${fileSizeMB} MB - may cause upload issues`);
    }
    
    if (!userId) {
      console.error('❌ No user ID available for upload');
      throw new Error('User not authenticated. Please log in to upload documents.');
    }
    
    // Validate user ID
    if (!validateUserId(userId, 'uploadDocument')) {
      throw new Error('Invalid user ID. Please log in again.');
    }
    
    logUploadFlow(userId, category, file.name);
    
    // Determine if the file is an image for preview
    const isImage = file.type?.startsWith('image/') || 
      file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
      file.mimeType?.startsWith('image/');


    const document: UploadedDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name || file.fileName || 'Document',
      type: file.mimeType || file.type || 'application/octet-stream',
      size: file.size || file.fileSize || 0,
      status: 'uploading',
      progress: 0,
      category,
      uri: file.uri,
      timestamp: new Date(),
      previewUrl: file.uri, // Use local URI for preview during upload
      isImage: isImage,
    };

    // Update the appropriate document array based on category using functional update
    setFormData(prev => {
      const updateFunction = (docs: UploadedDocument[]) => [...docs, document];
      
      switch (category) {
        case 'previousYearTax':
          return { ...prev, previousYearTaxDocuments: updateFunction(prev.previousYearTaxDocuments) };
        case 'w2Forms':
          return { ...prev, w2Forms: updateFunction(prev.w2Forms) };
        case 'additionalIncomeGeneral':
          return { ...prev, additionalIncomeGeneralDocuments: updateFunction(prev.additionalIncomeGeneralDocuments) };
        case 'medical':
          return { ...prev, medicalDocuments: updateFunction(prev.medicalDocuments) };
        case 'education':
          return { ...prev, educationDocuments: updateFunction(prev.educationDocuments) };
        case 'dependentChildren':
          return { ...prev, dependentChildrenDocuments: updateFunction(prev.dependentChildrenDocuments) };
        case 'homeownerDeduction':
          return { ...prev, homeownerDeductionDocuments: updateFunction(prev.homeownerDeductionDocuments) };
        case 'personalId':
          return { ...prev, personalIdDocuments: updateFunction(prev.personalIdDocuments) };
        default:
          return prev;
      }
    });

    // Upload to Google Cloud Storage
    setIsUploading(true);
    try {
      console.log('🔐 Debug - Token value:', token ? 'Token exists' : 'Token is null/undefined');
      console.log('🔐 Debug - Token length:', token?.length || 0);
      
      const gcsResult = await uploadToGCS(file, userId, category, (progress) => {
        // Update progress for the specific document using functional update
        setFormData(prev => {
          const updateProgress = (docs: UploadedDocument[]) => 
            docs.map(doc => doc.id === document.id ? { ...doc, progress } : doc);
          
          switch (category) {
            case 'previousYearTax':
              return { ...prev, previousYearTaxDocuments: updateProgress(prev.previousYearTaxDocuments) };
            case 'w2Forms':
              return { ...prev, w2Forms: updateProgress(prev.w2Forms) };
            case 'additionalIncomeGeneral':
              return { ...prev, additionalIncomeGeneralDocuments: updateProgress(prev.additionalIncomeGeneralDocuments) };
            case 'medical':
              return { ...prev, medicalDocuments: updateProgress(prev.medicalDocuments) };
            case 'education':
              return { ...prev, educationDocuments: updateProgress(prev.educationDocuments) };
            case 'dependentChildren':
              return { ...prev, dependentChildrenDocuments: updateProgress(prev.dependentChildrenDocuments) };
            case 'homeownerDeduction':
              return { ...prev, homeownerDeductionDocuments: updateProgress(prev.homeownerDeductionDocuments) };
            case 'personalId':
              return { ...prev, personalIdDocuments: updateProgress(prev.personalIdDocuments) };
            default:
              return prev;
          }
        });
      }, token);

      // Mark as completed with GCS information using functional update
      setFormData(prev => {
        const markCompleted = (docs: UploadedDocument[]) => 
          docs.map(doc => doc.id === document.id ? { 
            ...doc, 
            status: 'completed' as const, 
            progress: 100,
            gcsPath: gcsResult.gcsPath,
            publicUrl: gcsResult.publicUrl,
            previewUrl: doc.uri || gcsResult.publicUrl || doc.previewUrl, // Prioritize original URI for preview
          } : doc);
        
        switch (category) {
          case 'previousYearTax':
            return { ...prev, previousYearTaxDocuments: markCompleted(prev.previousYearTaxDocuments) };
          case 'w2Forms':
            return { ...prev, w2Forms: markCompleted(prev.w2Forms) };
          case 'additionalIncomeGeneral':
            return { ...prev, additionalIncomeGeneralDocuments: markCompleted(prev.additionalIncomeGeneralDocuments) };
          case 'medical':
            return { ...prev, medicalDocuments: markCompleted(prev.medicalDocuments) };
          case 'education':
            return { ...prev, educationDocuments: markCompleted(prev.educationDocuments) };
          case 'dependentChildren':
            return { ...prev, dependentChildrenDocuments: markCompleted(prev.dependentChildrenDocuments) };
          case 'homeownerDeduction':
            return { ...prev, homeownerDeductionDocuments: markCompleted(prev.homeownerDeductionDocuments) };
          case 'personalId':
            return { ...prev, personalIdDocuments: markCompleted(prev.personalIdDocuments) };
          default:
            return prev;
        }
      });
    } catch (error) {
      // Upload failed - error handling
      console.error('❌ Upload failed:', error);
      
      // Show detailed error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log('📱 Showing error to user:', errorMessage);
      
      // Import Alert dynamically to avoid issues
      import('react-native').then(({ Alert }) => {
        Alert.alert(
          'Upload Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
      });
      
      // Mark as error using functional update
      setFormData(prev => {
        const markError = (docs: UploadedDocument[]) => 
          docs.map(doc => doc.id === document.id ? { ...doc, status: 'error' as const } : doc);
        
        switch (category) {
          case 'previousYearTax':
            return { ...prev, previousYearTaxDocuments: markError(prev.previousYearTaxDocuments) };
          case 'w2Forms':
            return { ...prev, w2Forms: markError(prev.w2Forms) };
          case 'additionalIncomeGeneral':
            return { ...prev, additionalIncomeGeneralDocuments: markError(prev.additionalIncomeGeneralDocuments) };
          case 'medical':
            return { ...prev, medicalDocuments: markError(prev.medicalDocuments) };
          case 'education':
            return { ...prev, educationDocuments: markError(prev.educationDocuments) };
          case 'dependentChildren':
            return { ...prev, dependentChildrenDocuments: markError(prev.dependentChildrenDocuments) };
          case 'homeownerDeduction':
            return { ...prev, homeownerDeductionDocuments: markError(prev.homeownerDeductionDocuments) };
          case 'personalId':
            return { ...prev, personalIdDocuments: markError(prev.personalIdDocuments) };
          default:
            return prev;
        }
      });
    } finally {
      setIsUploading(false);
    }
  }, [formData, updateFormData, user?.id]);

  const deleteDocument = useCallback(async (id: string, category: string) => {
    // Find the document to get GCS path
    let documentToDelete: UploadedDocument | undefined;
    
    switch (category) {
      case 'previousYearTax':
        documentToDelete = (formData.previousYearTaxDocuments || []).find(doc => doc.id === id);
        break;
      case 'w2Forms':
        documentToDelete = (formData.w2Forms || []).find(doc => doc.id === id);
        break;
      case 'additionalIncomeGeneral':
        documentToDelete = (formData.additionalIncomeGeneralDocuments || []).find(doc => doc.id === id);
        break;
      case 'medical':
        documentToDelete = (formData.medicalDocuments || []).find(doc => doc.id === id);
        break;
      case 'education':
        documentToDelete = (formData.educationDocuments || []).find(doc => doc.id === id);
        break;
      case 'dependentChildren':
        documentToDelete = (formData.dependentChildrenDocuments || []).find(doc => doc.id === id);
        break;
      case 'homeownerDeduction':
        documentToDelete = (formData.homeownerDeductionDocuments || []).find(doc => doc.id === id);
        break;
      case 'personalId':
        documentToDelete = (formData.personalIdDocuments || []).find(doc => doc.id === id);
        break;
    }

    // Delete from GCS if document exists and has GCS path
    if (documentToDelete && documentToDelete.gcsPath) {
      try {
        await deleteFromGCS(documentToDelete.gcsPath);
      } catch (error) {
        // Failed to delete from GCS
        // Continue with local deletion even if GCS deletion fails
      }
    }

    // Remove from local state
    const removeFunction = (prev: UploadedDocument[]) => prev.filter(doc => doc.id !== id);
    
    // Use functional update to ensure we have the latest state
    setFormData(prev => {
      switch (category) {
        case 'previousYearTax':
          return { ...prev, previousYearTaxDocuments: removeFunction(prev.previousYearTaxDocuments) };
        case 'w2Forms':
          return { ...prev, w2Forms: removeFunction(prev.w2Forms) };
        case 'additionalIncomeGeneral':
          return { ...prev, additionalIncomeGeneralDocuments: removeFunction(prev.additionalIncomeGeneralDocuments) };
        case 'medical':
          return { ...prev, medicalDocuments: removeFunction(prev.medicalDocuments) };
        case 'education':
          return { ...prev, educationDocuments: removeFunction(prev.educationDocuments) };
        case 'dependentChildren':
          return { ...prev, dependentChildrenDocuments: removeFunction(prev.dependentChildrenDocuments) };
        case 'homeownerDeduction':
          return { ...prev, homeownerDeductionDocuments: removeFunction(prev.homeownerDeductionDocuments) };
        case 'personalId':
          return { ...prev, personalIdDocuments: removeFunction(prev.personalIdDocuments) };
        default:
          return prev;
      }
    });
  }, [formData, updateFormData]);

  const handleImageLoad = useCallback((documentId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: false }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: false }));
  }, []);

  const handleImageError = useCallback((documentId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: false }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: true }));
  }, []);

  const initializeImageStates = useCallback((documentId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: true }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: false }));
  }, []);

  // Clear all saved data (call this when form is successfully submitted)
  const clearSavedData = useCallback(async () => {
    try {
      if (!user?.id) {
        console.error('❌ No user ID available for clearing data');
        return;
      }
      
      logUserFlow('Clearing Saved Data', user.id);
      await clearAllFormData(user.id);
      console.log('✅ All saved form data cleared for user:', user.id);
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  }, [user?.id]);

  // Check if there's saved data
  const checkForSavedData = useCallback(async () => {
    try {
      if (!user?.id) {
        return false;
      }
      return await hasSavedFormData(user.id);
    } catch (error) {
      return false;
    }
  }, [user?.id]);

  // Delete document for a specific additional income source
  const deleteIncomeSourceDocument = useCallback(async (documentId: string, incomeSourceId: string) => {
    // Find the document to get GCS path
    const incomeSource = formData.additionalIncomeSources.find(source => source.id === incomeSourceId);
    const documentToDelete = incomeSource?.documents?.find(doc => doc.id === documentId);

    // Delete from GCS if document exists and has GCS path
    if (documentToDelete && documentToDelete.gcsPath) {
      try {
        await deleteFromGCS(documentToDelete.gcsPath);
        console.log('✅ Document deleted from GCS:', documentToDelete.gcsPath);
      } catch (error) {
        console.error('❌ Failed to delete document from GCS:', error);
        // Continue with local deletion even if GCS deletion fails
      }
    }

    // Remove from local state
    setFormData(prev => ({
      ...prev,
      additionalIncomeSources: prev.additionalIncomeSources.map(source => 
        source.id === incomeSourceId 
          ? {
              ...source, 
              documents: source.documents?.filter(doc => doc.id !== documentId) || []
            }
          : source
      )
    }));

    console.log('✅ Income source document deleted locally:', documentId);
  }, [formData]);

  return {
    // State
    step,
    totalSteps,
    progress,
    formData,
    dependents,
    numberOfDependents,
    isUploading,
    imageLoadingStates,
    imageErrorStates,
    
    // Actions
    nextStep,
    previousStep,
    goToStep,
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
    
    // Data persistence
    isDataLoaded,
    clearSavedData,
    checkForSavedData,
    
    // Navigation
    navigation,
  };
};
