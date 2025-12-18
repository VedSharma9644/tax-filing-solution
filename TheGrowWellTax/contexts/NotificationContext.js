import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import adminNotificationService from '../services/adminNotificationService';
import notificationTriggers from '../services/notificationTriggers';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionsStatus, setPermissionsStatus] = useState('undetermined');
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [adminPollingActive, setAdminPollingActive] = useState(false);

  // Initialize notification service
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('🚀 Initializing notification service...');
      
      // Initialize the notification service
      const success = await notificationService.initialize();
      
      if (success) {
        // Get stored push token (may be null in Expo Go SDK 53+)
        const token = await notificationService.getStoredPushToken();
        setExpoPushToken(token);
        
        // Get permissions status
        const status = await notificationService.getPermissionsStatus();
        setPermissionsStatus(status);
        
        // Load existing notifications
        await loadNotifications();
        
        // Set callback for notification triggers to add notifications to context
        notificationTriggers.setAddNotificationCallback(addNotification);
        
        setIsInitialized(true);
        console.log('✅ Notification service initialized successfully');
      } else {
        console.log('❌ Failed to initialize notification service');
      }
    } catch (error) {
      console.error('❌ Error initializing notifications:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // Load actual notifications from storage or backend
      // Start with empty array - notifications will be added dynamically
      setNotifications([]);
      updateUnreadCount([]);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    }
  };

  const updateUnreadCount = (notificationList) => {
    const unread = notificationList.filter(notification => !notification.read).length;
    setUnreadCount(unread);
  };

  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prevNotifications => {
        const updated = prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        );
        updateUnreadCount(updated);
        return updated;
      });
      
      console.log('✅ Notification marked as read:', notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prevNotifications => {
        const updated = prevNotifications.map(notification => ({
          ...notification,
          read: true
        }));
        updateUnreadCount(updated);
        return updated;
      });
      
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prevNotifications => {
      const updated = [newNotification, ...prevNotifications];
      updateUnreadCount(updated);
      return updated;
    });
    
    console.log('📬 New notification added:', newNotification);
  };

  const removeNotification = async (notificationId) => {
    try {
      setNotifications(prevNotifications => {
        const updated = prevNotifications.filter(notification => notification.id !== notificationId);
        updateUnreadCount(updated);
        return updated;
      });
      
      console.log('🗑️ Notification removed:', notificationId);
    } catch (error) {
      console.error('❌ Error removing notification:', error);
    }
  };

  const sendLocalNotification = async (title, body, data = {}) => {
    try {
      const success = await notificationService.sendLocalNotification(title, body, data);
      if (success) {
        // Add to local notifications list
        addNotification({
          title,
          body,
          type: 'local',
          data
        });
      }
      return success;
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
      return false;
    }
  };

  const scheduleNotification = async (title, body, triggerDate, data = {}) => {
    try {
      const success = await notificationService.scheduleNotification(title, body, triggerDate, data);
      return success;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return false;
    }
  };

  const requestPermissions = async () => {
    try {
      const status = await notificationService.requestPermissions();
      setPermissionsStatus(status);
      return status;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return 'denied';
    }
  };

  const getExpoPushToken = () => {
    return expoPushToken;
  };

  const startAdminPolling = (token) => {
    if (!adminPollingActive) {
      adminNotificationService.startPolling(token);
      setAdminPollingActive(true);
      console.log('🔄 Admin notification polling started');
    }
  };

  const stopAdminPolling = () => {
    if (adminPollingActive) {
      adminNotificationService.stopPolling();
      setAdminPollingActive(false);
      console.log('⏹️ Admin notification polling stopped');
    }
  };

  const getAdminPollingStatus = () => {
    return adminNotificationService.getPollingStatus();
  };

  const forceAdminCheck = (token) => {
    return adminNotificationService.forceCheck(token);
  };

  const clearAdminData = (formId) => {
    return adminNotificationService.clearStoredData(formId);
  };

  const triggerStatusChangeNotification = (oldStatus, newStatus, formId) => {
    return adminNotificationService.triggerStatusChangeNotification(oldStatus, newStatus, formId);
  };

  const getStoredStatusDebug = (formId) => {
    return adminNotificationService.getStoredStatusDebug(formId);
  };

  const testAsyncStorage = () => {
    return adminNotificationService.testAsyncStorage();
  };

  const value = {
    // State
    notifications,
    unreadCount,
    isInitialized,
    permissionsStatus,
    expoPushToken,
    adminPollingActive,
    
    // Actions
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    sendLocalNotification,
    scheduleNotification,
    requestPermissions,
    getExpoPushToken,
    loadNotifications,
    startAdminPolling,
    stopAdminPolling,
    getAdminPollingStatus,
    forceAdminCheck,
    clearAdminData,
    triggerStatusChangeNotification,
    getStoredStatusDebug,
    testAsyncStorage
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
