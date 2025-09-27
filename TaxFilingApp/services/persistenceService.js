import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate user-specific storage keys
const getStorageKeys = (userId) => ({
  TAX_FORM_DATA: `tax_form_data_${userId}`,
  DEPENDENTS: `dependents_${userId}`,
  NUMBER_OF_DEPENDENTS: `number_of_dependents_${userId}`,
  CURRENT_STEP: `current_step_${userId}`,
  FORM_VERSION: 'form_version', // Global version, not user-specific
});

// Current form version for migration handling
const CURRENT_FORM_VERSION = '1.0.0';

/**
 * Save tax form data to local storage
 * @param {Object} formData - The tax form data object
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<boolean>} - Success status
 */
export const saveTaxFormData = async (formData, userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return false;
    }
    
    const storageKeys = getStorageKeys(userId);
    const dataToSave = {
      ...formData,
      version: CURRENT_FORM_VERSION,
      lastSaved: new Date().toISOString(),
      userId: userId, // Store user ID for verification
    };
    
    await AsyncStorage.setItem(storageKeys.TAX_FORM_DATA, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Load tax form data from local storage
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<Object|null>} - The saved form data or null if not found
 */
export const loadTaxFormData = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return null;
    }
    
    const storageKeys = getStorageKeys(userId);
    const savedData = await AsyncStorage.getItem(storageKeys.TAX_FORM_DATA);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // Verify user ID matches (security check)
      if (parsedData.userId !== userId) {
        console.error('❌ User ID mismatch in saved data - potential security issue');
        return null;
      }
      
      // Check if data needs migration (for future versions)
      if (parsedData.version !== CURRENT_FORM_VERSION) {
        // Future: Add migration logic here
      }
      
      return parsedData;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Save dependents data to local storage
 * @param {Array} dependents - Array of dependent objects
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<boolean>} - Success status
 */
export const saveDependents = async (dependents, userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return false;
    }
    
    const storageKeys = getStorageKeys(userId);
    await AsyncStorage.setItem(storageKeys.DEPENDENTS, JSON.stringify(dependents));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Load dependents data from local storage
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<Array>} - Array of dependents or empty array
 */
export const loadDependents = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return [];
    }
    
    const storageKeys = getStorageKeys(userId);
    const savedData = await AsyncStorage.getItem(storageKeys.DEPENDENTS);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      return parsedData;
    }
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Save number of dependents to local storage
 * @param {string} numberOfDependents - Number of dependents as string
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<boolean>} - Success status
 */
export const saveNumberOfDependents = async (numberOfDependents, userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return false;
    }
    
    const storageKeys = getStorageKeys(userId);
    await AsyncStorage.setItem(storageKeys.NUMBER_OF_DEPENDENTS, numberOfDependents);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Load number of dependents from local storage
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<string>} - Number of dependents or empty string
 */
export const loadNumberOfDependents = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return '';
    }
    
    const storageKeys = getStorageKeys(userId);
    const savedData = await AsyncStorage.getItem(storageKeys.NUMBER_OF_DEPENDENTS);
    return savedData || '';
  } catch (error) {
    return '';
  }
};

/**
 * Save current step to local storage
 * @param {number} step - Current step number
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<boolean>} - Success status
 */
export const saveCurrentStep = async (step, userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return false;
    }
    
    const storageKeys = getStorageKeys(userId);
    await AsyncStorage.setItem(storageKeys.CURRENT_STEP, step.toString());
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Load current step from local storage
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<number>} - Current step or 1
 */
export const loadCurrentStep = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return 1;
    }
    
    const storageKeys = getStorageKeys(userId);
    const savedData = await AsyncStorage.getItem(storageKeys.CURRENT_STEP);
    return savedData ? parseInt(savedData, 10) : 1;
  } catch (error) {
    return 1;
  }
};

/**
 * Save all form data at once
 * @param {Object} formData - Complete form data
 * @param {Array} dependents - Dependents array
 * @param {string} numberOfDependents - Number of dependents
 * @param {number} currentStep - Current step
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<boolean>} - Success status
 */
export const saveAllFormData = async (formData, dependents, numberOfDependents, currentStep, userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return false;
    }
    
    await Promise.all([
      saveTaxFormData(formData, userId),
      saveDependents(dependents, userId),
      saveNumberOfDependents(numberOfDependents, userId),
      saveCurrentStep(currentStep, userId),
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Load all form data at once
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<Object>} - Complete form state
 */
export const loadAllFormData = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return getDefaultFormState();
    }
    
    const [formData, dependents, numberOfDependents, currentStep] = await Promise.all([
      loadTaxFormData(userId),
      loadDependents(userId),
      loadNumberOfDependents(userId),
      loadCurrentStep(userId),
    ]);

    return {
      formData: formData || getDefaultFormState().formData,
      dependents: dependents || [],
      numberOfDependents: numberOfDependents || '',
      currentStep: currentStep || 1,
    };
  } catch (error) {
    console.error('Error loading form data:', error);
    return getDefaultFormState();
  }
};

/**
 * Get default form state
 * @returns {Object} - Default form state
 */
const getDefaultFormState = () => ({
  formData: {
    socialSecurityNumber: '',
    previousYearTaxDocuments: [],
    w2Forms: [],
    hasAdditionalIncome: false,
    additionalIncomeSources: [],
    medicalDocuments: [],
    educationDocuments: [],
    dependentChildrenDocuments: [],
    homeownerDeductionDocuments: [],
    personalIdDocuments: [],
  },
  dependents: [],
  numberOfDependents: '',
  currentStep: 1,
});

/**
 * Clear all saved form data for a specific user
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllFormData = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return false;
    }
    
    const storageKeys = getStorageKeys(userId);
    await AsyncStorage.multiRemove([
      storageKeys.TAX_FORM_DATA,
      storageKeys.DEPENDENTS,
      storageKeys.NUMBER_OF_DEPENDENTS,
      storageKeys.CURRENT_STEP,
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if there's saved form data for a specific user
 * @param {string} userId - User ID for data isolation
 * @returns {Promise<boolean>} - True if data exists
 */
export const hasSavedFormData = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ User ID required for data isolation');
      return false;
    }
    
    const storageKeys = getStorageKeys(userId);
    const formData = await AsyncStorage.getItem(storageKeys.TAX_FORM_DATA);
    return formData !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get storage usage information
 * @returns {Promise<Object>} - Storage usage stats
 */
export const getStorageInfo = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const taxFormKeys = keys.filter(key => key.startsWith('tax_'));
    
    return {
      totalKeys: keys.length,
      taxFormKeys: taxFormKeys.length,
      keys: taxFormKeys,
    };
  } catch (error) {
    return { totalKeys: 0, taxFormKeys: 0, keys: [] };
  }
};
