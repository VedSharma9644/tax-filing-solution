import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignupScreen from '../screens/AuthScreen';
import CreateProfileScreen from '../screens/ProfileSetup';
import HomeScreen from '../screens/Dashboard';
import TaxFormScreen from '../screens/TaxWizard';
import DocumentUploadScreen from '../screens/DocumentUpload';
import DocumentReviewScreen from '../screens/DocumentReview';
import PaymentScreen from '../screens/Payment';
import SettingsScreen from '../screens/Settings';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Signup">
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateProfile" 
        component={CreateProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="TaxForm" component={TaxFormScreen} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DocumentReview" 
        component={DocumentReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator; 