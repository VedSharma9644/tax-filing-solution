import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { GOOGLE_AUTH_CONFIG, initializeGoogleSignin } from '../config/googleAuth';

interface GoogleLoginButtonProps {
  onLoginSuccess: (userInfo: any) => void;
  onLoginError: (error: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onLoginSuccess, 
  onLoginError 
}) => {
  const { googleLogin } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google Sign-In...');
      
      // Initialize Google Sign-In if not already done
      initializeGoogleSignin();
      
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      console.log('Google Sign-In successful:', userInfo);
      
      if (userInfo.data) {
        const { idToken, user } = userInfo.data;
        
        if (idToken) {
          console.log('ID Token received, calling backend...');
          
          try {
            // Send ID token to backend for verification
            const response = await googleLogin(null, idToken);
            
            if (response.success) {
              console.log('Backend authentication successful:', response);
              onLoginSuccess(response.user);
            } else {
              console.log('Backend authentication failed:', response.error);
              onLoginError(new Error(response.error || 'Authentication failed'));
            }
          } catch (error) {
            console.log('Backend authentication error:', error);
            onLoginError(error);
          }
        } else {
          console.log('No ID token received');
          onLoginError(new Error('No ID token received from Google'));
        }
      } else {
        console.log('No user data received');
        onLoginError(new Error('No user data received from Google'));
      }
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('User cancelled Google Sign-In');
        // Don't show error for user cancellation
        return;
      } else if (error.code === 'IN_PROGRESS') {
        console.log('Google Sign-In already in progress');
        onLoginError(new Error('Sign-in already in progress'));
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        console.log('Google Play Services not available');
        onLoginError(new Error('Google Play Services not available'));
      } else {
        onLoginError(error);
      }
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
      <View style={styles.buttonContent}>
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default GoogleLoginButton;
