import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import SignupScreen from '../screens/AuthScreen';
import CreateProfileScreen from '../screens/ProfileSetup';
import HomeScreen from '../screens/Dashboard';
import TaxFormScreen from '../screens/TaxWizard';
import DocumentUploadScreen from '../screens/DocumentUpload';
import DocumentReviewScreen from '../screens/AdminDocumentReview';
import DocumentReviewScreenNew from '../screens/DocumentReviewScreen';
import PaymentScreen from '../screens/Payment';
import SettingsScreen from '../screens/Settings';
import NotificationsScreen from '../screens/NotificationsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import SupportRequestScreen from '../screens/SupportRequestScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import CacheManagementScreen from '../screens/CacheManagementScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);

  // Handle navigation after user state changes
  useEffect(() => {
    if (!loading && user && navigationRef.current) {
      const isProfileComplete = user.profileComplete === true;
      const shouldNavigateTo = isProfileComplete ? 'Home' : 'CreateProfile';
      
      console.log('🔄 User state changed, navigating to:', shouldNavigateTo);
      
      if (shouldNavigateTo === 'CreateProfile') {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'CreateProfile' }],
        });
      } else if (shouldNavigateTo === 'Home') {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    }
  }, [user, loading]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Determine initial route for authenticated users
  const getInitialRoute = () => {
    console.log('🚨 UPDATED CODE IS RUNNING - Profile Setup Integration v2');
    
    if (!user) return "Signup";
    
    // Check if profile is complete
    // profileComplete is returned by backend based on firstName, lastName, email
    // Only redirect to profile setup if profileComplete is explicitly false or undefined
    const isProfileComplete = user.profileComplete === true;
    
    console.log('🔍 AppNavigator Debug:', {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileComplete: user.profileComplete,
      isProfileComplete,
      redirectTo: isProfileComplete ? 'Home' : 'CreateProfile'
    });
    
    if (!isProfileComplete) {
      console.log('✅ Redirecting to CreateProfile');
      return "CreateProfile";
    }
    
    console.log('✅ Redirecting to Home');
    return "Home";
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
            <Stack.Screen name="TaxForm" component={TaxFormScreen} />
            <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="DocumentReview" component={DocumentReviewScreen} />
            <Stack.Screen name="DocumentReviewNew" component={DocumentReviewScreenNew} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="SupportRequest" component={SupportRequestScreen} />
            <Stack.Screen name="Appointment" component={AppointmentScreen} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
            <Stack.Screen name="CacheManagement" component={CacheManagementScreen} />
          </>
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator; 