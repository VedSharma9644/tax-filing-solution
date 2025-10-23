import notificationTriggers from './notificationTriggers';
import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AdminNotificationService {
  constructor() {
    this.pollingInterval = null;
    this.historyInterval = null;
    this.lastCheckTime = null;
    this.lastHistoryFetch = null;
    this.isPolling = false;
    this.cachedTaxFormData = null;
  }

  /**
   * Start polling for admin actions with optimized intervals
   */
  startPolling(token, adminIntervalMs = 10000, historyIntervalMs = 60000) {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.lastCheckTime = new Date();
    this.lastHistoryFetch = new Date();
    
    
    // Fast polling for admin actions (status changes, notifications)
    this.pollingInterval = setInterval(async () => {
      await this.checkForAdminActions(token);
    }, adminIntervalMs);

    // Slower polling for tax form history (only when needed)
    this.historyInterval = setInterval(async () => {
      await this.fetchTaxFormHistory(token);
    }, historyIntervalMs);

    // Initial checks
    this.checkForAdminActions(token);
    this.fetchTaxFormHistory(token);
  }

  /**
   * Stop polling for admin actions
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.historyInterval) {
      clearInterval(this.historyInterval);
      this.historyInterval = null;
    }
    this.isPolling = false;
   
  }

  /**
   * Fetch tax form history (separate from admin action checking)
   */
  async fetchTaxFormHistory(token) {
    try {
      if (!token) {
        return;
      }

      
      const response = await ApiService.getTaxFormHistory(token);
      
      if (response.success && response.data && response.data.length > 0) {
        this.cachedTaxFormData = response.data;
        this.lastHistoryFetch = new Date();
      } else {
        this.cachedTaxFormData = [];
      }
    } catch (error) {
    }
  }

  /**
   * Check for new admin actions using cached data
   */
  async checkForAdminActions(token) {
    try {
      if (!token) {
        return;
      }

      
      // Use cached data if available and recent (less than 5 minutes old)
      let taxFormData = this.cachedTaxFormData;
      const timeSinceLastFetch = this.lastHistoryFetch ? 
        (new Date() - this.lastHistoryFetch) / 1000 / 60 : 999; // minutes
      
      if (!taxFormData || timeSinceLastFetch > 5) {

        await this.fetchTaxFormHistory(token);
        taxFormData = this.cachedTaxFormData;
      } else {

      }
      
      if (taxFormData && taxFormData.length > 0) {
        const latestForm = taxFormData[0];

        await this.processTaxFormChanges(latestForm);
      } else {

      }

      this.lastCheckTime = new Date();

    } catch (error) {

    }
  }

  /**
   * Process tax form changes and trigger notifications
   */
  async processTaxFormChanges(taxForm) {
    try {
      // Check for status changes
      if (taxForm.status && taxForm.status !== 'submitted') {
        await this.handleStatusChange(taxForm);
      }

      // Check for new admin documents
      if (taxForm.adminDocuments && taxForm.adminDocuments.length > 0) {
        await this.handleAdminDocuments(taxForm);
      }

    } catch (error) {
      console.error('❌ Error processing tax form changes:', error);
    }
  }

  /**
   * Handle status changes
   */
  async handleStatusChange(taxForm) {
    const storedStatus = await this.getStoredStatus(taxForm.id);
    
    
    // If no stored status, this is the first time we're seeing this form
    if (!storedStatus) {
      await this.storeStatus(taxForm.id, taxForm.status);
      return;
    }
    
    // Check if status actually changed
    if (storedStatus !== taxForm.status) {
      
      try {
        await notificationTriggers.executeTrigger(
          'adminStatusChanged',
          storedStatus,
          taxForm.status,
          taxForm.id
        );
      } catch (error) {
      }
    } else {
    }

    // Always store current status
    await this.storeStatus(taxForm.id, taxForm.status);
  }

  /**
   * Handle admin documents
   */
  async handleAdminDocuments(taxForm) {
    const storedDocuments = await this.getStoredDocuments(taxForm.id);
    const currentDocuments = taxForm.adminDocuments || [];

    // Find new documents
    const newDocuments = currentDocuments.filter(currentDoc => 
      !storedDocuments.some(storedDoc => 
        storedDoc.id === currentDoc.id && 
        storedDoc.uploadedAt === currentDoc.uploadedAt
      )
    );

    for (const document of newDocuments) {
      
      if (document.category === 'draft_return') {
        await notificationTriggers.executeTrigger(
          'adminDraftDocumentUploaded',
          'Draft Tax Return',
          document.name,
          taxForm.id
        );
      } else if (document.category === 'final_return') {
        await notificationTriggers.executeTrigger(
          'adminFinalDocumentUploaded',
          'Final Tax Return',
          document.name,
          taxForm.id
        );
      }
    }

    // Store current documents
    await this.storeDocuments(taxForm.id, currentDocuments);
  }

  /**
   * Get stored status for a tax form
   */
  async getStoredStatus(formId) {
    try {
      const stored = await AsyncStorage.getItem(`admin_status_${formId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Error getting stored status:', error);
      return null;
    }
  }

  /**
   * Store status for a tax form
   */
  async storeStatus(formId, status) {
    try {
      
      await AsyncStorage.setItem(`admin_status_${formId}`, JSON.stringify(status));
      
    } catch (error) {

    }
  }

  /**
   * Get stored documents for a tax form
   */
  async getStoredDocuments(formId) {
    try {
      const stored = await AsyncStorage.getItem(`admin_documents_${formId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {

      return [];
    }
  }

  /**
   * Store documents for a tax form
   */
  async storeDocuments(formId, documents) {
    try {
      await AsyncStorage.setItem(`admin_documents_${formId}`, JSON.stringify(documents));
    } catch (error) {
      console.error('❌ Error storing documents:', error);
    }
  }

  /**
   * Manually trigger notification for status change
   */
  async triggerStatusChangeNotification(oldStatus, newStatus, applicationId) {
    await notificationTriggers.executeTrigger(
      'adminStatusChanged',
      oldStatus,
      newStatus,
      applicationId
    );
  }

  /**
   * Manually trigger notification for draft document upload
   */
  async triggerDraftDocumentNotification(documentType, fileName, applicationId) {
    await notificationTriggers.executeTrigger(
      'adminDraftDocumentUploaded',
      documentType,
      fileName,
      applicationId
    );
  }

  /**
   * Manually trigger notification for final document upload
   */
  async triggerFinalDocumentNotification(documentType, fileName, applicationId) {
    await notificationTriggers.executeTrigger(
      'adminFinalDocumentUploaded',
      documentType,
      fileName,
      applicationId
    );
  }

  /**
   * Check if polling is active
   */
  isPollingActive() {
    return this.isPolling;
  }

  /**
   * Get polling status
   */
  getPollingStatus() {
    return {
      isActive: this.isPolling,
      lastCheck: this.lastCheckTime,
      lastHistoryFetch: this.lastHistoryFetch,
      adminInterval: this.pollingInterval ? 'active' : 'inactive',
      historyInterval: this.historyInterval ? 'active' : 'inactive',
      cachedDataAge: this.lastHistoryFetch ? 
        Math.round((new Date() - this.lastHistoryFetch) / 1000 / 60) : null
    };
  }

  /**
   * Force check for admin actions (for testing)
   */
  async forceCheck(token) {

    await this.checkForAdminActions(token);
  }

  /**
   * Clear stored data for a form (for testing)
   */
  async clearStoredData(formId) {
    try {
      
      await AsyncStorage.removeItem(`admin_status_${formId}`);
      await AsyncStorage.removeItem(`admin_documents_${formId}`);
    } catch (error) {
    }
  }

  /**
   * Test AsyncStorage functionality
   */
  async testAsyncStorage() {
    try {
      
      // Test basic operations
      await AsyncStorage.setItem('test_key', 'test_value');
      const value = await AsyncStorage.getItem('test_key');
      await AsyncStorage.removeItem('test_key');
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Manually trigger a status change notification (for testing)
   */
  async triggerStatusChangeNotification(oldStatus, newStatus, formId = 'TEST123') {
    try {
      await notificationTriggers.executeTrigger(
        'adminStatusChanged',
        oldStatus,
        newStatus,
        formId
      );
    } catch (error) {
    }
  }

  /**
   * Get stored status for debugging
   */
  async getStoredStatusDebug(formId) {
    try {
      
      const storedStatus = await AsyncStorage.getItem(`admin_status_${formId}`);
      return storedStatus;
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
const adminNotificationService = new AdminNotificationService();

export default adminNotificationService;
