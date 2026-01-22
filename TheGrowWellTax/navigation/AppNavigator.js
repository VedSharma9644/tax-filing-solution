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
import AccountDeletionRequestScreen from '../screens/AccountDeletionRequestScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);
  const hasNavigatedRef = useRef(false); // Track if we've done initial navigation

  // Handle navigation after user state changes
  useEffect(() => {
    if (!loading && user && navigationRef.current) {
      const isProfileComplete = user.profileComplete === true;
      const shouldNavigateTo = isProfileComplete ? 'Home' : 'CreateProfile';
      
      console.log('🔄 [AppNavigator] User state changed - Navigation Effect Triggered');
      console.log('🔄 [AppNavigator] User object:', {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileComplete: user.profileComplete,
        profileCompleteType: typeof user.profileComplete,
        profileCompleteStrict: user.profileComplete === true,
        profileCompleteLoose: !!user.profileComplete,
        isProfileComplete,
        shouldNavigateTo,
        currentRoute: navigationRef.current?.getCurrentRoute()?.name,
        hasNavigated: hasNavigatedRef.current
      });
      console.log('🔄 [AppNavigator] Stack trace:', new Error().stack);
      
      // Get current route to check if we need to navigate
      const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
      
      // Only navigate if:
      // 1. We haven't done initial navigation yet, OR
      // 2. The current route doesn't match where we should be
      if (!hasNavigatedRef.current || currentRoute !== shouldNavigateTo) {
        if (shouldNavigateTo === 'CreateProfile') {
          console.log('🔄 [AppNavigator] Resetting navigation to CreateProfile');
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'CreateProfile' }],
          });
          hasNavigatedRef.current = true;
        } else if (shouldNavigateTo === 'Home') {
          console.log('🔄 [AppNavigator] Resetting navigation to Home');
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
          hasNavigatedRef.current = true;
        }
      } else {
        console.log('🔄 [AppNavigator] Already on correct route, skipping navigation');
      }
    } else {
      console.log('🔄 [AppNavigator] Navigation effect skipped:', {
        loading,
        hasUser: !!user,
        hasNavigationRef: !!navigationRef.current
      });
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
  // IMPORTANT: This is only used as a fallback. The useEffect will handle actual navigation
  // We use a safe default to avoid showing the wrong screen
  const getInitialRoute = () => {
    console.log('🚨 [AppNavigator] getInitialRoute called');
    
    if (!user) {
      console.log('🚨 [AppNavigator] No user, returning Signup');
      return "Signup";
    }
    
    // Check if profile is complete
    // profileComplete is returned by backend based on firstName, lastName, email
    // Only redirect to profile setup if profileComplete is explicitly false or undefined
    const isProfileComplete = user.profileComplete === true;
    
    console.log('🔍 [AppNavigator] getInitialRoute Debug:', {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileComplete: user.profileComplete,
      profileCompleteType: typeof user.profileComplete,
      isProfileComplete,
      redirectTo: isProfileComplete ? 'Home' : 'CreateProfile'
    });
    
    // Default to CreateProfile for safety - useEffect will handle navigation
    // This prevents showing Home screen briefly before redirect
    if (!isProfileComplete) {
      console.log('✅ [AppNavigator] Initial route: CreateProfile (safe default)');
      return "CreateProfile";
    }
    
    console.log('✅ [AppNavigator] Initial route: Home');
    return "Home";
  };

  // Get initial route before rendering
  const initialRoute = getInitialRoute();
  
  // Use key to force remount when user state changes significantly
  // This ensures initialRouteName is respected when screens change
  const navigatorKey = user ? `authenticated-${user.id}` : 'unauthenticated';

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        key={navigatorKey}
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          // Authenticated screens - IMPORTANT: Order matters for initialRouteName
          // Put CreateProfile first if profile is incomplete to ensure it's the default
          <>
            {user.profileComplete !== true ? (
              <>
                <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
              </>
            )}
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
            <Stack.Screen name="AccountDeletionRequest" component={AccountDeletionRequestScreen} />
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