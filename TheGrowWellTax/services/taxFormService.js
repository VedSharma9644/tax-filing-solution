import ApiService from './api';

class TaxFormService {
  constructor() {
    this.api = ApiService;
  }

  /**
   * Submit tax form data to backend
   * @param {Object} formData - Complete form data including documents and dependents
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Submission result
   */
  async submitTaxForm(formData, token) {
    try {
      console.log('📋 Submitting tax form data...');
      
      // Prepare documents data for submission
      const documents = this.prepareDocumentsForSubmission(formData);
      
      // Prepare dependents data for submission
      const dependents = this.prepareDependentsForSubmission(formData.dependents || []);
      
      const submissionData = {
        socialSecurityNumber: formData.socialSecurityNumber,
        documents: documents,
        dependents: dependents,
        additionalIncomeSources: formData.additionalIncomeSources || [], // Include additional income sources
        formType: '1040', // Default form type
        taxYear: new Date().getFullYear(),
        filingStatus: 'single' // Default filing status
      };

      console.log(`📊 Submission data:`, {
        documentCount: documents.length,
        dependentCount: dependents.length,
        hasSSN: !!formData.socialSecurityNumber
      });

      const response = await this.api.makeRequest('/tax-forms/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      console.log('✅ Tax form submitted successfully');
      return response;
    } catch (error) {
      console.error('❌ Tax form submission error:', error);
      throw error;
    }
  }

  /**
   * Get user's tax form history
   * @param {string} token - User authentication token
   * @returns {Promise<Array>} Array of tax forms
   */
  async getTaxFormHistory(token) {
    try {
      console.log('📋 Fetching tax form history...');
      
      const response = await this.api.makeRequest('/tax-forms/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Retrieved ${response.data.length} tax forms`);
      return response.data;
    } catch (error) {
      console.error('❌ Tax form history error:', error);
      throw error;
    }
  }

  /**
   * Get specific tax form details
   * @param {string} formId - Tax form ID
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} Tax form details
   */
  async getTaxFormDetails(formId, token) {
    try {
      console.log(`📋 Fetching tax form details for ID: ${formId}`);
      
      const response = await this.api.makeRequest(`/tax-forms/${formId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Tax form details retrieved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Tax form details error:', error);
      throw error;
    }
  }

  /**
   * Prepare documents for submission by filtering only completed uploads
   * @param {Object} formData - Form data containing document arrays
   * @returns {Array} Array of completed documents
   */
  prepareDocumentsForSubmission(formData) {
    // Get documents from main categories
    const mainDocuments = [
      ...(formData.previousYearTaxDocuments || []),
      ...(formData.w2Forms || []),
      ...(formData.medicalDocuments || []),
      ...(formData.educationDocuments || []),
      ...(formData.dependentChildrenDocuments || []),
      ...(formData.homeownerDeductionDocuments || []),
      ...(formData.personalIdDocuments || [])
    ];

    // Get documents from additional income sources
    const additionalIncomeDocuments = [];
    if (formData.additionalIncomeSources && Array.isArray(formData.additionalIncomeSources)) {
      formData.additionalIncomeSources.forEach(incomeSource => {
        if (incomeSource.documents && Array.isArray(incomeSource.documents)) {
          additionalIncomeDocuments.push(...incomeSource.documents);
        }
      });
    }

    const allDocuments = [...mainDocuments, ...additionalIncomeDocuments];

    // Filter only completed documents with GCS paths
    const completedDocuments = allDocuments.filter(doc => 
      doc.status === 'completed' && 
      doc.gcsPath && 
      doc.publicUrl
    );

    console.log(`📄 Prepared ${completedDocuments.length} completed documents for submission`);
    return completedDocuments;
  }

  /**
   * Prepare dependents for submission
   * @param {Array} dependents - Array of dependent objects
   * @returns {Array} Array of sanitized dependents
   */
  prepareDependentsForSubmission(dependents) {
    const validDependents = dependents.filter(dep => 
      dep.name && 
      dep.name.trim() !== '' && 
      dep.age && 
      dep.age.trim() !== '' && 
      dep.relationship && 
      dep.relationship.trim() !== ''
    );

    console.log(`👥 Prepared ${validDependents.length} valid dependents for submission`);
    return validDependents;
  }

  /**
   * Validate form data before submission
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result
   */
  validateFormData(formData) {
    const errors = [];

    // Validate SSN
    if (!formData.socialSecurityNumber || formData.socialSecurityNumber.trim() === '') {
      errors.push('Social Security Number is required');
    } else {
      const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
      if (!ssnRegex.test(formData.socialSecurityNumber.replace(/\s/g, ''))) {
        errors.push('Invalid Social Security Number format');
      }
    }

    // Validate documents
    const allDocuments = this.prepareDocumentsForSubmission(formData);
    if (allDocuments.length === 0) {
      errors.push('At least one document must be uploaded and completed');
    }

    // Check for incomplete uploads
    const incompleteUploads = this.getIncompleteUploads(formData);
    if (incompleteUploads.length > 0) {
      errors.push(`Please wait for ${incompleteUploads.length} document(s) to finish uploading`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get list of incomplete uploads
   * @param {Object} formData - Form data containing document arrays
   * @returns {Array} Array of incomplete documents
   */
  getIncompleteUploads(formData) {
    const allDocuments = [
      ...(formData.previousYearTaxDocuments || []),
      ...(formData.w2Forms || []),
      ...(formData.medicalDocuments || []),
      ...(formData.educationDocuments || []),
      ...(formData.dependentChildrenDocuments || []),
      ...(formData.homeownerDeductionDocuments || []),
      ...(formData.personalIdDocuments || [])
    ];

    return allDocuments.filter(doc => 
      doc.status === 'uploading' || doc.status === 'error'
    );
  }
}

export default new TaxFormService();
