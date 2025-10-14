import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import CustomHeader from '../components/CustomHeader';
import { BackgroundColors, TextColors } from '../utils/colors';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

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

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return notificationTime.toLocaleDateString();
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
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
            <TouchableOpacity 
              key={notification.id} 
              onPress={() => markAsRead(notification.id)}
              style={[styles.notificationCard, !notification.read && styles.unreadCard]}
            >
              <CardContent>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationIcon}>
                    <Feather 
                      name={getIconName(notification.type)} 
                      size={24} 
                      color={getIconColor(notification.type)} 
                    />
                  </View>
                  <View style={styles.notificationText}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>{notification.body}</Text>
                    <Text style={styles.notificationTime}>{formatTime(notification.timestamp)}</Text>
                  </View>
                </View>
              </CardContent>
            </TouchableOpacity>
          ))}
          
          {/* Empty State (if no notifications) */}
          {notifications.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={64} color="#ffffff" />
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
    backgroundColor: BackgroundColors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BackgroundColors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
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
    backgroundColor: BackgroundColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: TextColors.primary,
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
    color: TextColors.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: TextColors.tertiary,
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
    color: TextColors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: TextColors.secondary,
    textAlign: 'center',
  },
});

export default NotificationsScreen; 