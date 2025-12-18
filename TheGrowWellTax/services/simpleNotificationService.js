import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class SimpleNotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.expoPushToken = null;
  }

  /**
   * Initialize notification service with proper expo-notifications
   */
  async initialize() {
    try {
      console.log('🚀 Initializing notification service with expo-notifications...');
      
      // Request permissions
      const permissionStatus = await this.requestPermissions();
      if (permissionStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
        return false;
      }

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        // Status update channel
        await Notifications.setNotificationChannelAsync('status-updates', {
          name: 'Status Updates',
          description: 'Notifications about your tax application status',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      // Get or generate push token
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '5d65c201-b77b-4289-a079-46c6e1f2949d', // From app.json
        });
        this.expoPushToken = token.data;
        await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
        console.log('✅ Expo push token:', this.expoPushToken);
      } catch (error) {
        console.warn('⚠️ Could not get Expo push token (may need physical device):', error.message);
        // Continue without push token - local notifications will still work
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      const data = response.notification.request.content.data;
      if (data && data.screen) {
        console.log('🧭 Would navigate to screen:', data.screen);
        // Navigation will be handled by the app's navigation system
      }
    });
  }

  /**
   * Send local notification (works on Android when app is installed)
   */
  async sendLocalNotification(title, body, data = {}) {
    try {
      console.log(`📤 Sending notification: "${title}" - "${body}"`);
      
      // Determine channel for Android
      const channelId = data.type === 'admin_status_change' ? 'status-updates' : 'default';
      
      // Send notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // null means show immediately
      });

      console.log(`✅ Notification sent successfully`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(title, body, triggerDate, data = {}) {
    try {
      console.log(`⏰ Scheduling notification: "${title}" for ${triggerDate}`);
      
      const channelId = data.type === 'admin_status_change' ? 'status-updates' : 'default';
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: triggerDate, // Date object or trigger config
      });

      console.log('✅ Notification scheduled successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All scheduled notifications cancelled');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel notifications:', error);
      return false;
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled;
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get stored push token
   */
  async getStoredPushToken() {
    try {
      if (this.expoPushToken) {
        return this.expoPushToken;
      }
      
      const stored = await AsyncStorage.getItem('expoPushToken');
      if (stored) {
        this.expoPushToken = stored;
        return stored;
      }
      
      // Try to get new token
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '5d65c201-b77b-4289-a079-46c6e1f2949d',
        });
        this.expoPushToken = token.data;
        await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
        return this.expoPushToken;
      } catch (error) {
        console.warn('⚠️ Could not get push token:', error.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get stored push token:', error);
      return null;
    }
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsStatus() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings.status;
    } catch (error) {
      console.error('❌ Failed to get permissions status:', error);
      return 'undetermined';
    }
  }

  /**
   * Request permissions
   */
  async requestPermissions() {
    try {
      // Check if device is physical (required for push notifications)
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        // Still return granted for local notifications
        return 'granted';
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ Permission not granted for notifications');
        return finalStatus;
      }

      console.log('✅ Notification permissions granted');
      return finalStatus;
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return 'denied';
    }
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    console.log('🧹 Cleaning up notification service');
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }
}

// Create singleton instance
const simpleNotificationService = new SimpleNotificationService();

export default simpleNotificationService;
