import notificationTriggers from './notificationTriggers';
import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AdminNotificationService {
  constructor() {
    this.pollingInterval = null;
    this.lastCheckTime = null;
    this.isPolling = false;
  }

  /**
   * Start polling for admin actions
   */
  startPolling(token, intervalMs = 10000) { // Default 10 seconds (reduced for better responsiveness)
    if (this.isPolling) {
      console.log('⚠️ Admin notification polling already active');
      return;
    }

    this.isPolling = true;
    this.lastCheckTime = new Date();
    
    console.log('🔄 Starting admin notification polling...');
    
    this.pollingInterval = setInterval(async () => {
      await this.checkForAdminActions(token);
    }, intervalMs);

    // Initial check
    this.checkForAdminActions(token);
  }

  /**
   * Stop polling for admin actions
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('⏹️ Admin notification polling stopped');
  }

  /**
   * Check for new admin actions
   */
  async checkForAdminActions(token) {
    try {
      if (!token) {
        console.log('❌ No token available for admin action check');
        return;
      }

      console.log('🔄 Checking for admin actions...');
      
      // Get the latest tax form to check for changes
      const response = await ApiService.getTaxFormHistory(token);
      
      if (response.success && response.data && response.data.length > 0) {
        const latestForm = response.data[0];
        console.log(`📋 Found tax form: ${latestForm.id}, status: ${latestForm.status}`);
        console.log(`📋 Full form data:`, JSON.stringify(latestForm, null, 2));
        await this.processTaxFormChanges(latestForm);
      } else {
        console.log('📭 No tax forms found');
      }

      this.lastCheckTime = new Date();
      console.log(`⏰ Last check time updated: ${this.lastCheckTime.toISOString()}`);
    } catch (error) {
      console.error('❌ Error checking for admin actions:', error);
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
    
    console.log(`🔍 Checking status for form ${taxForm.id}: stored=${storedStatus}, current=${taxForm.status}`);
    
    // If no stored status, this is the first time we're seeing this form
    if (!storedStatus) {
      console.log(`📝 First time seeing form ${taxForm.id}, storing initial status: ${taxForm.status}`);
      await this.storeStatus(taxForm.id, taxForm.status);
      return;
    }
    
    // Check if status actually changed
    if (storedStatus !== taxForm.status) {
      console.log(`📊 Status changed from ${storedStatus} to ${taxForm.status}`);
      console.log(`🔔 Triggering notification for status change...`);
      
      try {
        await notificationTriggers.executeTrigger(
          'adminStatusChanged',
          storedStatus,
          taxForm.status,
          taxForm.id
        );
        console.log(`✅ Notification trigger executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing notification trigger:`, error);
      }
    } else {
      console.log(`✅ Status unchanged: ${taxForm.status}`);
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
      console.log(`📄 New admin document: ${document.name}`);
      
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
      console.log(`💾 Debug - Attempting to store status for ${formId}: ${status}`);
      console.log(`💾 Debug - AsyncStorage available:`, typeof AsyncStorage);
      
      await AsyncStorage.setItem(`admin_status_${formId}`, JSON.stringify(status));
      console.log(`✅ Debug - Successfully stored status for ${formId}: ${status}`);
    } catch (error) {
      console.error('❌ Error storing status:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
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
      console.error('❌ Error getting stored documents:', error);
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
      interval: this.pollingInterval ? 'active' : 'inactive'
    };
  }

  /**
   * Force check for admin actions (for testing)
   */
  async forceCheck(token) {
    console.log('🔧 Force checking for admin actions...');
    await this.checkForAdminActions(token);
  }

  /**
   * Clear stored data for a form (for testing)
   */
  async clearStoredData(formId) {
    try {
      console.log(`🗑️ Debug - Attempting to clear stored data for ${formId}`);
      console.log(`🗑️ Debug - AsyncStorage available:`, typeof AsyncStorage);
      
      await AsyncStorage.removeItem(`admin_status_${formId}`);
      await AsyncStorage.removeItem(`admin_documents_${formId}`);
      console.log(`🗑️ Cleared stored data for form: ${formId}`);
    } catch (error) {
      console.error('❌ Error clearing stored data:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
  }

  /**
   * Test AsyncStorage functionality
   */
  async testAsyncStorage() {
    try {
      console.log(`🧪 Testing AsyncStorage functionality...`);
      console.log(`🧪 AsyncStorage type:`, typeof AsyncStorage);
      
      // Test basic operations
      await AsyncStorage.setItem('test_key', 'test_value');
      const value = await AsyncStorage.getItem('test_key');
      await AsyncStorage.removeItem('test_key');
      
      console.log(`✅ AsyncStorage test successful. Retrieved value: ${value}`);
      return true;
    } catch (error) {
      console.error('❌ AsyncStorage test failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      return false;
    }
  }

  /**
   * Manually trigger a status change notification (for testing)
   */
  async triggerStatusChangeNotification(oldStatus, newStatus, formId = 'TEST123') {
    try {
      console.log(`🧪 Manually triggering status change: ${oldStatus} → ${newStatus}`);
      await notificationTriggers.executeTrigger(
        'adminStatusChanged',
        oldStatus,
        newStatus,
        formId
      );
      console.log(`✅ Manual status change notification triggered`);
    } catch (error) {
      console.error('❌ Error triggering manual status change:', error);
    }
  }

  /**
   * Get stored status for debugging
   */
  async getStoredStatusDebug(formId) {
    try {
      console.log(`🔍 Debug - Attempting to get stored status for ${formId}`);
      console.log(`🔍 Debug - AsyncStorage available:`, typeof AsyncStorage);
      
      const storedStatus = await AsyncStorage.getItem(`admin_status_${formId}`);
      console.log(`🔍 Debug - Stored status for ${formId}: ${storedStatus}`);
      return storedStatus;
    } catch (error) {
      console.error('❌ Error getting stored status:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      return null;
    }
  }
}

// Create singleton instance
const adminNotificationService = new AdminNotificationService();

export default adminNotificationService;
