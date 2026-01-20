import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/api';

const useTaxWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
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

  const [dependents, setDependents] = useState([]);
  const [numberOfDependents, setNumberOfDependents] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrorStates, setImageErrorStates] = useState({});

  const totalSteps = 5;

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('taxWizardData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.step) setStep(parsed.step);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.dependents) setDependents(parsed.dependents);
        if (parsed.numberOfDependents) setNumberOfDependents(parsed.numberOfDependents);
      } catch (error) {
        console.error('Error loading saved tax wizard data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      step,
      formData,
      dependents,
      numberOfDependents
    };
    localStorage.setItem('taxWizardData', JSON.stringify(dataToSave));
  }, [step, formData, dependents, numberOfDependents]);

  const nextStep = useCallback(() => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  }, [step, totalSteps]);

  const previousStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const goToStep = useCallback((stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
      setStep(stepNumber);
    }
  }, [totalSteps]);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateNumberOfDependents = useCallback((value) => {
    setNumberOfDependents(value);
    const num = parseInt(value) || 0;
    if (num > dependents.length) {
      // Add new dependents
      const newDependents = [];
      for (let i = dependents.length; i < num; i++) {
        newDependents.push({
          id: Date.now().toString() + i,
          name: '',
          age: '',
          relationship: ''
        });
      }
      setDependents([...dependents, ...newDependents]);
    } else if (num < dependents.length) {
      // Remove dependents
      setDependents(dependents.slice(0, num));
    }
  }, [dependents]);

  const updateDependent = useCallback((id, field, value) => {
    setDependents(prev => prev.map(dep => 
      dep.id === id ? { ...dep, [field]: value } : dep
    ));
  }, []);

  const removeDependent = useCallback((id) => {
    setDependents(prev => prev.filter(dep => dep.id !== id));
    setNumberOfDependents(prev => {
      const num = parseInt(prev) || 0;
      return Math.max(0, num - 1).toString();
    });
  }, []);

  const uploadDocument = useCallback(async (file, category) => {
    setIsUploading(true);
    
    const document = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name || 'Document',
      type: file.type || 'application/octet-stream',
      size: file.size || 0,
      status: 'uploading',
      progress: 0,
      category,
      timestamp: new Date(),
      uri: URL.createObjectURL(file), // Create preview URL
      isImage: file.type?.startsWith('image/') || false,
    };

    // Add document to formData immediately for preview
    setFormData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), document]
    }));

    // Initialize image states
    initializeImageStates(document.id);

    try {
      // Get user ID and token from localStorage
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?.id;
      const token = localStorage.getItem('accessToken');

      if (!userId || !token) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('category', category);

      // Upload to backend endpoint (backend handles encryption)
      const response = await fetch(`${API_BASE_URL}/upload/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 Upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('❌ Backend error response:', errorData);
          // Backend returns: { success: false, error: '...', details: '...' }
          errorMessage = errorData.details || errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => '');
          console.error('❌ Backend error (non-JSON):', errorText);
          if (errorText) {
            try {
              const parsed = JSON.parse(errorText);
              errorMessage = parsed.details || parsed.error || parsed.message || errorMessage;
            } catch {
              errorMessage = errorText.substring(0, 200);
            }
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);

      // Update document with upload result
      setFormData(prev => ({
        ...prev,
        [category]: prev[category].map(doc => 
          doc.id === document.id 
            ? { 
                ...doc, 
                status: 'completed', 
                progress: 100,
                gcsPath: result.gcsPath,
                publicUrl: result.publicUrl,
                fileName: result.fileName
              }
            : doc
        )
      }));

      setIsUploading(false);
    } catch (error) {
      console.error('❌ Upload error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Update document status to error
      setFormData(prev => ({
        ...prev,
        [category]: prev[category].map(doc => 
          doc.id === document.id 
            ? { ...doc, status: 'error', progress: 0 }
            : doc
        )
      }));
      setIsUploading(false);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to upload file. Please check your connection and try again.';
      alert(`Upload Error: ${errorMessage}`);
      throw error;
    }
  }, [initializeImageStates]);

  const deleteDocument = useCallback((id, category) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter(doc => doc.id !== id)
    }));
    
    // Clean up image states
    setImageLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[id];
      return newStates;
    });
    setImageErrorStates(prev => {
      const newStates = { ...prev };
      delete newStates[id];
      return newStates;
    });
  }, []);

  const uploadIncomeSourceDocument = useCallback(async (file, incomeSourceId) => {
    setIsUploading(true);
    
    const document = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name || 'Document',
      type: file.type || 'application/octet-stream',
      size: file.size || 0,
      status: 'uploading',
      progress: 0,
      category: 'additional_income',
      timestamp: new Date(),
      uri: URL.createObjectURL(file),
      isImage: file.type?.startsWith('image/') || false,
    };

    // Add document to the specific income source immediately for preview
    setFormData(prev => ({
      ...prev,
      additionalIncomeSources: prev.additionalIncomeSources.map(source => 
        source.id === incomeSourceId 
          ? { ...source, documents: [...(source.documents || []), document] }
          : source
      )
    }));

    try {
      // Get user ID and token from localStorage
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?.id;
      const token = localStorage.getItem('accessToken');

      if (!userId || !token) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('category', 'additional_income');

      // Upload to backend endpoint (backend handles encryption)
      console.log('📤 Uploading income source file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        incomeSourceId,
        userId,
        apiUrl: `${API_BASE_URL}/upload/document`
      });

      const response = await fetch(`${API_BASE_URL}/upload/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 Income source upload response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('❌ Backend error response (income source):', errorData);
          // Backend returns: { success: false, error: '...', details: '...' }
          errorMessage = errorData.details || errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => '');
          console.error('❌ Backend error (non-JSON, income source):', errorText);
          if (errorText) {
            try {
              const parsed = JSON.parse(errorText);
              errorMessage = parsed.details || parsed.error || parsed.message || errorMessage;
            } catch {
              errorMessage = errorText.substring(0, 200);
            }
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Income source upload successful:', result);

      // Update document with upload result
      setFormData(prev => ({
        ...prev,
        additionalIncomeSources: prev.additionalIncomeSources.map(source => 
          source.id === incomeSourceId 
            ? {
                ...source, 
                documents: source.documents.map(doc => 
                  doc.id === document.id 
                    ? { 
                        ...doc, 
                        status: 'completed', 
                        progress: 100,
                        gcsPath: result.gcsPath,
                        publicUrl: result.publicUrl,
                        fileName: result.fileName
                      }
                    : doc
                )
              }
            : source
        )
      }));

      setIsUploading(false);
    } catch (error) {
      console.error('❌ Income source document upload error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Update document status to error
      setFormData(prev => ({
        ...prev,
        additionalIncomeSources: prev.additionalIncomeSources.map(source => 
          source.id === incomeSourceId 
            ? {
                ...source, 
                documents: source.documents.map(doc => 
                  doc.id === document.id 
                    ? { ...doc, status: 'error', progress: 0 } 
                    : doc
                )
              }
            : source
        )
      }));
      setIsUploading(false);
      
      // Show user-friendly error message
      let errorMessage = error.message || 'Failed to upload file. Please check your connection and try again.';
      
      // Provide specific guidance for KMS encryption errors
      if (errorMessage.includes('encrypt') || errorMessage.includes('DEK') || errorMessage.includes('KMS')) {
        errorMessage = 'File encryption failed on the server. Please check the backend server logs for KMS configuration issues. The backend administrator needs to verify Google Cloud KMS credentials and configuration.';
      }
      
      alert(`Upload Error: ${errorMessage}`);
      console.error('💡 Tip: Check the backend server terminal/logs for detailed KMS error information.');
      throw error;
    }
  }, []);

  const deleteIncomeSourceDocument = useCallback((documentId, incomeSourceId) => {
    setFormData(prev => ({
      ...prev,
      additionalIncomeSources: prev.additionalIncomeSources.map(source => 
        source.id === incomeSourceId 
          ? {
              ...source, 
              documents: source.documents.filter(doc => doc.id !== documentId)
            }
          : source
      )
    }));
  }, []);

  const handleImageLoad = useCallback((documentId) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: false }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: false }));
  }, []);

  const handleImageError = useCallback((documentId) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: false }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: true }));
  }, []);

  const initializeImageStates = useCallback((documentId) => {
    setImageLoadingStates(prev => ({ ...prev, [documentId]: true }));
    setImageErrorStates(prev => ({ ...prev, [documentId]: false }));
  }, []);

  const clearSavedData = useCallback(async () => {
    localStorage.removeItem('taxWizardData');
    setStep(1);
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
    });
    setDependents([]);
    setNumberOfDependents('');
  }, []);

  return {
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
  };
};

export default useTaxWizard;

