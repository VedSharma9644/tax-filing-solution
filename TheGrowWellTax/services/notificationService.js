import simpleNotificationService from './simpleNotificationService';

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Initialize notification service (using simple service)
   */
  async initialize() {
    return await simpleNotificationService.initialize();
  }

  /**
   * Set up notification listeners (delegated to simple service)
   */
  setupNotificationListeners() {
    // Simple service handles this internally
  }

  /**
   * Handle notification received (delegated to simple service)
   */
  handleNotificationReceived(notification) {
    // Simple service handles this internally
  }

  /**
   * Handle notification response (delegated to simple service)
   */
  handleNotificationResponse(response) {
    // Simple service handles this internally
  }

  /**
   * Send local notification (delegated to simple service)
   */
  async sendLocalNotification(title, body, data = {}) {
    return await simpleNotificationService.sendLocalNotification(title, body, data);
  }

  /**
   * Schedule notification for later (delegated to simple service)
   */
  async scheduleNotification(title, body, triggerDate, data = {}) {
    return await simpleNotificationService.scheduleNotification(title, body, triggerDate, data);
  }

  /**
   * Cancel all scheduled notifications (delegated to simple service)
   */
  async cancelAllNotifications() {
    return await simpleNotificationService.cancelAllNotifications();
  }

  /**
   * Get scheduled notifications (delegated to simple service)
   */
  async getScheduledNotifications() {
    return await simpleNotificationService.getScheduledNotifications();
  }

  /**
   * Get stored push token (delegated to simple service)
   */
  async getStoredPushToken() {
    return await simpleNotificationService.getStoredPushToken();
  }

  /**
   * Get notification permissions status (delegated to simple service)
   */
  async getPermissionsStatus() {
    return await simpleNotificationService.getPermissionsStatus();
  }

  /**
   * Request permissions (delegated to simple service)
   */
  async requestPermissions() {
    return await simpleNotificationService.requestPermissions();
  }

  /**
   * Clean up listeners (delegated to simple service)
   */
  cleanup() {
    return simpleNotificationService.cleanup();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;