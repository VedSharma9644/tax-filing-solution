import notificationService from './notificationService';

class NotificationTriggers {
  constructor() {
    this.triggers = new Map();
    this.addNotificationCallback = null;
  }

  /**
   * Register a notification trigger
   */
  registerTrigger(name, triggerFunction) {
    this.triggers.set(name, triggerFunction);
    console.log(`📝 Registered notification trigger: ${name}`);
  }

  /**
   * Execute a notification trigger
   */
  async executeTrigger(name, ...args) {
    console.log(`🎯 Attempting to execute trigger: ${name} with args:`, args);
    const trigger = this.triggers.get(name);
    if (trigger) {
      try {
        console.log(`🔔 Executing trigger: ${name}`);
        await trigger(...args);
        console.log(`✅ Executed notification trigger: ${name}`);
      } catch (error) {
        console.error(`❌ Error executing trigger ${name}:`, error);
      }
    } else {
      console.warn(`⚠️ Trigger not found: ${name}`);
      console.log(`📋 Available triggers:`, this.listTriggers());
    }
  }

  /**
   * List all registered triggers
   */
  listTriggers() {
    return Array.from(this.triggers.keys());
  }

  /**
   * Remove a trigger
   */
  removeTrigger(name) {
    const removed = this.triggers.delete(name);
    if (removed) {
      console.log(`🗑️ Removed notification trigger: ${name}`);
    }
    return removed;
  }

  /**
   * Set callback for adding notifications to context
   */
  setAddNotificationCallback(callback) {
    this.addNotificationCallback = callback;
    console.log('📝 Set add notification callback');
  }

  /**
   * Add notification to context if callback is available
   */
  addNotificationToContext(notification) {
    if (this.addNotificationCallback) {
      this.addNotificationCallback(notification);
    }
  }
}

// Create singleton instance
const notificationTriggers = new NotificationTriggers();

// Pre-defined notification triggers
notificationTriggers.registerTrigger('documentUploaded', async (documentType, fileName) => {
  await notificationService.sendLocalNotification(
    'Document Uploaded Successfully',
    `Your ${documentType} document "${fileName}" has been uploaded and is ready for review.`,
    { screen: 'DocumentReview', type: 'success' }
  );
});

notificationTriggers.registerTrigger('taxDeadlineReminder', async (daysLeft) => {
  await notificationService.sendLocalNotification(
    'Tax Deadline Reminder',
    `Only ${daysLeft} days left to file your taxes. Don't miss the deadline!`,
    { screen: 'TaxWizard', type: 'warning' }
  );
});

notificationTriggers.registerTrigger('refundProcessed', async (amount) => {
  await notificationService.sendLocalNotification(
    'Refund Processed',
    `Your tax refund of $${amount} has been approved and will be deposited within 5-7 business days.`,
    { screen: 'Dashboard', type: 'success' }
  );
});

notificationTriggers.registerTrigger('documentRejected', async (documentType, reason) => {
  await notificationService.sendLocalNotification(
    'Document Needs Attention',
    `Your ${documentType} document was rejected: ${reason}. Please upload a new document.`,
    { screen: 'DocumentUpload', type: 'error' }
  );
});

notificationTriggers.registerTrigger('appointmentScheduled', async (date, time) => {
  await notificationService.sendLocalNotification(
    'Appointment Scheduled',
    `Your tax consultation appointment is scheduled for ${date} at ${time}.`,
    { screen: 'AppointmentScreen', type: 'info' }
  );
});

notificationTriggers.registerTrigger('welcomeMessage', async (userName) => {
  await notificationService.sendLocalNotification(
    'Welcome to TaxEase!',
    `Hi ${userName}! Thank you for choosing TaxEase for your tax filing needs. We're here to help you every step of the way.`,
    { screen: 'Dashboard', type: 'info' }
  );
});

notificationTriggers.registerTrigger('formSubmitted', async () => {
  await notificationService.sendLocalNotification(
    'Tax Form Submitted',
    'Your tax form has been successfully submitted and is now under review by our tax professionals.',
    { screen: 'Dashboard', type: 'success' }
  );
});

notificationTriggers.registerTrigger('reviewComplete', async () => {
  await notificationService.sendLocalNotification(
    'Review Complete',
    'Your tax form review is complete. You can now proceed with filing your taxes.',
    { screen: 'DocumentReview', type: 'success' }
  );
});

// Schedule recurring notifications
notificationTriggers.registerTrigger('scheduleWeeklyReminder', async () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  await notificationService.scheduleNotification(
    'Weekly Tax Progress Check',
    'How is your tax filing progress going? Don\'t forget to upload any missing documents.',
    nextWeek,
    { screen: 'Dashboard', type: 'info' }
  );
});

notificationTriggers.registerTrigger('scheduleDeadlineReminder', async (daysBeforeDeadline = 7) => {
  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + daysBeforeDeadline);
  
  await notificationService.scheduleNotification(
    'Tax Deadline Approaching',
    `Tax filing deadline is approaching! Make sure to complete your tax return soon.`,
    reminderDate,
    { screen: 'TaxWizard', type: 'warning' }
  );
});

// Admin Action Triggers
notificationTriggers.registerTrigger('adminStatusChanged', async (oldStatus, newStatus, applicationId) => {
  const statusMessages = {
    'submitted': 'Your tax application has been submitted and is under review.',
    'under_review': 'Your tax application is now under review by our tax professionals.',
    'processing': 'Your tax application is being processed. We\'ll notify you when it\'s complete.',
    'approved': 'Great news! Your tax application has been approved.',
    'rejected': 'Your tax application requires attention. Please check for any issues.',
    'completed': 'Your tax application has been completed successfully.'
  };

  const message = statusMessages[newStatus] || `Your application status has been updated to: ${newStatus}`;
  const notificationData = { 
    screen: 'Dashboard', 
    type: newStatus === 'approved' || newStatus === 'completed' ? 'success' : 
          newStatus === 'rejected' ? 'error' : 'info',
    applicationId: applicationId,
    oldStatus: oldStatus,
    newStatus: newStatus
  };
  
  // Send local notification
  await notificationService.sendLocalNotification(
    'Application Status Updated',
    message,
    notificationData
  );

  // Add to notification context
  notificationTriggers.addNotificationToContext({
    title: 'Application Status Updated',
    body: message,
    type: 'admin_status_change',
    data: notificationData
  });
});

notificationTriggers.registerTrigger('adminDraftDocumentUploaded', async (documentType, fileName, applicationId) => {
  const message = `A new draft ${documentType} document "${fileName}" has been uploaded by your tax professional. You can review it in your documents.`;
  const notificationData = {
    screen: 'DocumentReview',
    type: 'info',
    applicationId: applicationId,
    documentType: documentType,
    fileName: fileName,
    isDraft: true
  };

  // Send local notification
  await notificationService.sendLocalNotification(
    'Draft Document Available',
    message,
    notificationData
  );

  // Add to notification context
  notificationTriggers.addNotificationToContext({
    title: 'Draft Document Available',
    body: message,
    type: 'admin_document_upload',
    data: notificationData
  });
});

notificationTriggers.registerTrigger('adminFinalDocumentUploaded', async (documentType, fileName, applicationId) => {
  const message = `Your final ${documentType} document "${fileName}" is now available! Your tax return is complete and ready for filing.`;
  const notificationData = {
    screen: 'DocumentReview',
    type: 'success',
    applicationId: applicationId,
    documentType: documentType,
    fileName: fileName,
    isFinal: true
  };

  // Send local notification
  await notificationService.sendLocalNotification(
    'Final Document Ready',
    message,
    notificationData
  );

  // Add to notification context
  notificationTriggers.addNotificationToContext({
    title: 'Final Document Ready',
    body: message,
    type: 'admin_document_upload',
    data: notificationData
  });
});

export default notificationTriggers;
