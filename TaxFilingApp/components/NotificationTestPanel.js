import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import notificationTriggers from '../services/notificationTriggers';

const NotificationTestPanel = ({ visible = false, onClose }) => {
  const { sendLocalNotification, scheduleNotification, forceAdminCheck, clearAdminData, getAdminPollingStatus, triggerStatusChangeNotification, getStoredStatusDebug, testAsyncStorage } = useNotifications();
  const { token } = useAuth();

  if (!visible) return null;

  const testNotifications = [
    {
      title: 'Document Uploaded',
      body: 'Your W-2 form has been uploaded successfully.',
      trigger: () => notificationTriggers.executeTrigger('documentUploaded', 'W-2 Form', 'W2_2024.pdf')
    },
    {
      title: 'Tax Deadline Reminder',
      body: 'Only 45 days left to file your taxes.',
      trigger: () => notificationTriggers.executeTrigger('taxDeadlineReminder', 45)
    },
    {
      title: 'Refund Processed',
      body: 'Your refund of $1,250 has been approved.',
      trigger: () => notificationTriggers.executeTrigger('refundProcessed', 1250)
    },
    {
      title: 'Document Rejected',
      body: 'Your document was rejected due to poor quality.',
      trigger: () => notificationTriggers.executeTrigger('documentRejected', 'W-2 Form', 'Poor image quality')
    },
    {
      title: 'Appointment Scheduled',
      body: 'Your consultation is scheduled for tomorrow at 2 PM.',
      trigger: () => notificationTriggers.executeTrigger('appointmentScheduled', 'Tomorrow', '2:00 PM')
    },
    {
      title: 'Welcome Message',
      body: 'Welcome to TaxEase! We\'re here to help.',
      trigger: () => notificationTriggers.executeTrigger('welcomeMessage', 'John')
    },
    {
      title: 'Admin Status Changed',
      body: 'Application status updated to approved.',
      trigger: () => notificationTriggers.executeTrigger('adminStatusChanged', 'under_review', 'approved', 'APP123')
    },
    {
      title: 'Draft Document Uploaded',
      body: 'Tax professional uploaded a draft document.',
      trigger: () => notificationTriggers.executeTrigger('adminDraftDocumentUploaded', 'Tax Return', 'draft_return_2024.pdf', 'APP123')
    },
    {
      title: 'Final Document Uploaded',
      body: 'Final tax document is ready for filing.',
      trigger: () => notificationTriggers.executeTrigger('adminFinalDocumentUploaded', 'Final Return', 'final_return_2024.pdf', 'APP123')
    }
  ];

  const handleTestNotification = async (notification) => {
    try {
      await notification.trigger();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error('Test notification error:', error);
    }
  };

  const handleScheduleNotification = async () => {
    try {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 2); // 2 minutes from now
      
      await scheduleNotification(
        'Scheduled Test Notification',
        'This notification was scheduled 2 minutes ago.',
        futureDate,
        { screen: 'Dashboard', type: 'info' }
      );
      
      Alert.alert('Success', 'Notification scheduled for 2 minutes from now!');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification');
      console.error('Schedule notification error:', error);
    }
  };

  const handleForceAdminCheck = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'No authentication token available');
        return;
      }
      
      await forceAdminCheck(token);
      Alert.alert('Success', 'Force admin check completed! Check console for logs.');
    } catch (error) {
      Alert.alert('Error', 'Failed to force admin check');
      console.error('Force admin check error:', error);
    }
  };

  const handleClearAdminData = async () => {
    try {
      // Clear data for all possible form IDs
      await clearAdminData('APP123');
      await clearAdminData('TEST123');
      Alert.alert('Success', 'Admin data cleared! Next status change should trigger notification.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear admin data');
      console.error('Clear admin data error:', error);
    }
  };

  const handleCheckPollingStatus = () => {
    const status = getAdminPollingStatus();
    Alert.alert(
      'Polling Status', 
      `Active: ${status.isActive}\nLast Check: ${status.lastCheck ? status.lastCheck.toISOString() : 'Never'}\nInterval: ${status.interval}`
    );
  };

  const handleTriggerStatusChange = async () => {
    try {
      await triggerStatusChangeNotification('under_review', 'processing', 'TEST123');
      Alert.alert('Success', 'Status change notification triggered! Check notifications.');
    } catch (error) {
      Alert.alert('Error', 'Failed to trigger status change notification');
      console.error('Trigger status change error:', error);
    }
  };

  const handleCheckStoredStatus = async () => {
    try {
      const storedStatus1 = await getStoredStatusDebug('APP123');
      const storedStatus2 = await getStoredStatusDebug('TEST123');
      Alert.alert('Stored Status', `APP123: ${storedStatus1 || 'None'}\nTEST123: ${storedStatus2 || 'None'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get stored status');
      console.error('Get stored status error:', error);
    }
  };

  const handleTestDirectNotification = async () => {
    try {
      await sendLocalNotification(
        'Direct Test Notification',
        'This is a direct test of the notification service.',
        { screen: 'Dashboard', type: 'info', test: true }
      );
      Alert.alert('Success', 'Direct notification sent! Check if it appears.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send direct notification');
      console.error('Direct notification error:', error);
    }
  };

  const handleTestContextNotification = async () => {
    try {
      await sendLocalNotification(
        'Context Test Notification',
        'This notification should appear in the notification screen.',
        { screen: 'Dashboard', type: 'info', test: true }
      );
      Alert.alert('Success', 'Context notification sent! Check the notification screen.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send context notification');
      console.error('Context notification error:', error);
    }
  };

  const handleTestAsyncStorage = async () => {
    try {
      const success = await testAsyncStorage();
      if (success) {
        Alert.alert('Success', 'AsyncStorage is working correctly!');
      } else {
        Alert.alert('Error', 'AsyncStorage test failed. Check console for details.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test AsyncStorage');
      console.error('AsyncStorage test error:', error);
    }
  };

  const handleTestDraftDocument = async () => {
    try {
      await notificationTriggers.executeTrigger(
        'adminDraftDocumentUploaded',
        'Draft Tax Return',
        'test-draft-return.pdf',
        'TEST123'
      );
      Alert.alert('Success', 'Draft document notification triggered! Check notifications.');
    } catch (error) {
      Alert.alert('Error', 'Failed to trigger draft document notification');
      console.error('Draft document notification error:', error);
    }
  };

  const handleTestFinalDocument = async () => {
    try {
      await notificationTriggers.executeTrigger(
        'adminFinalDocumentUploaded',
        'Final Tax Return',
        'test-final-return.pdf',
        'TEST123'
      );
      Alert.alert('Success', 'Final document notification triggered! Check notifications.');
    } catch (error) {
      Alert.alert('Error', 'Failed to trigger final document notification');
      console.error('Final document notification error:', error);
    }
  };

  const handleTestNotificationService = async () => {
    try {
      // Test if notification service can send a simple notification
      await sendLocalNotification(
        'Service Test',
        'Simple notification service is working correctly! (Using Alert fallback)',
        { screen: 'Dashboard', type: 'success', test: true }
      );
      Alert.alert('Success', 'Simple notification service test passed! No expo-notifications dependency.');
    } catch (error) {
      Alert.alert('Error', 'Notification service test failed');
      console.error('Notification service test error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Test Panel</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        {testNotifications.map((notification, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testButton}
            onPress={() => handleTestNotification(notification)}
          >
            <Text style={styles.testButtonText}>{notification.title}</Text>
            <Ionicons name="send" size={16} color="#007bff" />
          </TouchableOpacity>
        ))}
        
        <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={handleScheduleNotification}
        >
          <Text style={styles.scheduleButtonText}>Schedule Test (2 min)</Text>
          <Ionicons name="time" size={16} color="#28a745" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Admin Debug Tools</Text>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleForceAdminCheck}
        >
          <Text style={styles.debugButtonText}>Force Admin Check</Text>
          <Ionicons name="refresh" size={16} color="#007bff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleClearAdminData}
        >
          <Text style={styles.debugButtonText}>Clear Admin Data</Text>
          <Ionicons name="trash" size={16} color="#dc3545" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleCheckPollingStatus}
        >
          <Text style={styles.debugButtonText}>Check Polling Status</Text>
          <Ionicons name="information-circle" size={16} color="#6c757d" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleTriggerStatusChange}
        >
          <Text style={styles.debugButtonText}>Test Status Change</Text>
          <Ionicons name="arrow-forward" size={16} color="#28a745" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleCheckStoredStatus}
        >
          <Text style={styles.debugButtonText}>Check Stored Status</Text>
          <Ionicons name="search" size={16} color="#ffc107" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleTestDirectNotification}
        >
          <Text style={styles.debugButtonText}>Test Direct Notification</Text>
          <Ionicons name="notifications" size={16} color="#17a2b8" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleTestContextNotification}
        >
          <Text style={styles.debugButtonText}>Test Context Notification</Text>
          <Ionicons name="list" size={16} color="#6f42c1" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleTestAsyncStorage}
        >
          <Text style={styles.debugButtonText}>Test AsyncStorage</Text>
          <Ionicons name="storage" size={16} color="#fd7e14" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Document Upload Tests</Text>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleTestDraftDocument}
        >
          <Text style={styles.debugButtonText}>Test Draft Document</Text>
          <Ionicons name="document-text" size={16} color="#17a2b8" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleTestFinalDocument}
        >
          <Text style={styles.debugButtonText}>Test Final Document</Text>
          <Ionicons name="checkmark-circle" size={16} color="#28a745" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Service Tests</Text>
        <TouchableOpacity
          style={styles.debugButton}
          onPress={handleTestNotificationService}
        >
          <Text style={styles.debugButtonText}>Test Notification Service</Text>
          <Ionicons name="checkmark-done" size={16} color="#28a745" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  testButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  scheduleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  debugButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  debugButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default NotificationTestPanel;
