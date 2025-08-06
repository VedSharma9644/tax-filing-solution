import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import CustomHeader from '../components/CustomHeader';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const scrollY = useRef(new Animated.Value(0)).current;

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'W-2 uploaded successfully',
      message: 'Your W-2 form has been processed and is ready for review.',
      time: '2 hours ago',
      read: false,
      icon: 'check-circle'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Tax deadline reminder',
      message: 'Only 45 days left to file your taxes. Don\'t miss the deadline!',
      time: '1 day ago',
      read: false,
      icon: 'alert-triangle'
    },
    {
      id: 3,
      type: 'info',
      title: 'Refund processed',
      message: 'Your tax refund of $1,250 has been approved and will be deposited within 5-7 business days.',
      time: '3 days ago',
      read: true,
      icon: 'dollar-sign'
    },
    {
      id: 4,
      type: 'success',
      title: 'Document verification complete',
      message: 'All your uploaded documents have been verified and are ready for processing.',
      time: '1 week ago',
      read: true,
      icon: 'shield-checkmark'
    },
    {
      id: 5,
      type: 'info',
      title: 'Welcome to TaxEase!',
      message: 'Thank you for choosing TaxEase for your tax filing needs. We\'re here to help you every step of the way.',
      time: '2 weeks ago',
      read: true,
      icon: 'information-circle'
    }
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'info': return '#007bff';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'alert-triangle';
      case 'info': return 'information-circle';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <CustomHeader 
          title="Notifications" 
          showAvatar={false}
          scrollY={scrollY}
        />
        <Animated.ScrollView 
          style={styles.notificationsList} 
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {notifications.map((notification) => (
            <Card key={notification.id} style={[styles.notificationCard, !notification.read && styles.unreadCard]}>
              <CardContent>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationIcon}>
                    <Feather 
                      name={notification.icon as any} 
                      size={24} 
                      color={getIconColor(notification.type)} 
                    />
                  </View>
                  <View style={styles.notificationText}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
          
          {/* Empty State (if no notifications) */}
          {notifications.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No notifications</Text>
              <Text style={styles.emptyStateMessage}>You're all caught up!</Text>
            </View>
          )}
        </Animated.ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  unreadCard: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default NotificationsScreen; 