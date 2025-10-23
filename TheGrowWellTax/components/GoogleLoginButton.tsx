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

      
      // Initialize Google Sign-In if not already done
      initializeGoogleSignin();
      
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      
      if (userInfo.data) {
        const { idToken, user } = userInfo.data;
        
        if (idToken) {
          
          try {
            // Send ID token to backend for verification
            const response = await googleLogin(null, idToken);
            
            if (response.success) {
              onLoginSuccess(response.user);
            } else {
              onLoginError(new Error(response.error || 'Authentication failed'));
            }
          } catch (error) {
            onLoginError(error);
          }
        } else {
          onLoginError(new Error('No ID token received from Google'));
        }
      } else {
        onLoginError(new Error('No user data received from Google'));
      }
    } catch (error: any) {
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        // Don't show error for user cancellation
        return;
      } else if (error.code === 'IN_PROGRESS') {
        onLoginError(new Error('Sign-in already in progress'));
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        
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
