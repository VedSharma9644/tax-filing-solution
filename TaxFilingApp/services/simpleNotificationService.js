import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SimpleNotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Initialize notification service (simple fallback for Expo Go SDK 53+)
   */
  async initialize() {
    try {
      console.log('🚀 Initializing simple notification service (no expo-notifications)...');
      
      // Request permissions (simplified - just log for now)
      console.log('✅ Simple notification service initialized (using Alert fallback)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize simple notification service:', error);
      return false;
    }
  }

  /**
   * Send local notification (using Alert as fallback)
   */
  async sendLocalNotification(title, body, data = {}) {
    try {
      console.log(`📤 Sending simple notification: "${title}" - "${body}"`);
      console.log(`📤 Notification data:`, data);
      
      // Use Alert as a simple notification fallback
      Alert.alert(title, body, [
        {
          text: 'OK',
          onPress: () => {
            console.log('👆 Notification tapped:', title);
            if (data.screen) {
              console.log('🧭 Would navigate to screen:', data.screen);
              // You can implement navigation logic here
            }
          }
        }
      ]);
      
      console.log(`✅ Simple notification sent successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send simple notification:', error);
      return false;
    }
  }

  /**
   * Schedule notification for later (simplified - just log for now)
   */
  async scheduleNotification(title, body, triggerDate, data = {}) {
    try {
      console.log(`⏰ Would schedule notification: "${title}" for ${triggerDate}`);
      console.log(`⏰ Notification data:`, data);
      
      // For now, just log - you could implement a simple timer-based system here
      console.log('⚠️ Scheduled notifications not implemented in simple mode');
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications (simplified)
   */
  async cancelAllNotifications() {
    try {
      console.log('🗑️ Would cancel all scheduled notifications');
      console.log('⚠️ Cancel notifications not implemented in simple mode');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel notifications:', error);
      return false;
    }
  }

  /**
   * Get scheduled notifications (simplified)
   */
  async getScheduledNotifications() {
    try {
      console.log('📋 Would get scheduled notifications');
      console.log('⚠️ Get scheduled notifications not implemented in simple mode');
      return [];
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get stored push token (always null in simple mode)
   */
  async getStoredPushToken() {
    try {
      console.log('📱 No push token in simple mode');
      return null;
    } catch (error) {
      console.error('❌ Failed to get stored push token:', error);
      return null;
    }
  }

  /**
   * Get notification permissions status (simplified)
   */
  async getPermissionsStatus() {
    try {
      console.log('🔐 Permissions status: granted (simple mode)');
      return 'granted';
    } catch (error) {
      console.error('❌ Failed to get permissions status:', error);
      return 'undetermined';
    }
  }

  /**
   * Request permissions (simplified)
   */
  async requestPermissions() {
    try {
      console.log('🔐 Requesting permissions: granted (simple mode)');
      return { status: 'granted' };
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return { status: 'denied' };
    }
  }

  /**
   * Clean up listeners (simplified)
   */
  cleanup() {
    console.log('🧹 Cleaning up simple notification service');
    // No listeners to clean up in simple mode
  }
}

// Create singleton instance
const simpleNotificationService = new SimpleNotificationService();

export default simpleNotificationService;
