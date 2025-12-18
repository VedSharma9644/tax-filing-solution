import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';

interface AppleLoginButtonProps {
  onLoginSuccess: (userInfo: any) => void;
  onLoginError: (error: any) => void;
}

const AppleLoginButton: React.FC<AppleLoginButtonProps> = ({ 
  onLoginSuccess, 
  onLoginError 
}) => {
  const { appleLogin } = useAuth();

  const handleAppleLogin = async () => {
    // Only show on iOS
    if (Platform.OS !== 'ios') {
      onLoginError(new Error('Apple Sign-In is only available on iOS'));
      return;
    }

    try {
      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        onLoginError(new Error('Apple Sign-In is not available on this device'));
        return;
      }

      console.log('AppleLoginButton: Starting Apple Sign-In...');
      
      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('AppleLoginButton: Apple Sign-In successful', {
        user: credential.user,
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode,
        hasFullName: !!credential.fullName,
        fullName: credential.fullName,
      });

      if (!credential.identityToken) {
        onLoginError(new Error('No identity token received from Apple'));
        return;
      }

      // Extract name from credential (only available on first sign-in)
      let fullName = null;
      if (credential.fullName) {
        const { givenName, familyName } = credential.fullName;
        if (givenName || familyName) {
          fullName = `${givenName || ''} ${familyName || ''}`.trim();
        }
      }

      // Send identity token to backend for verification
      const response = await appleLogin(credential.identityToken, credential.authorizationCode, fullName);
      
      console.log('AppleLoginButton: appleLogin response', { 
        success: response?.success,
        hasUser: !!response?.user 
      });
      
      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        onLoginError(new Error(response.error || 'Authentication failed'));
      }
    } catch (error: any) {
      console.error('AppleLoginButton: Apple Sign-In error', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - don't show error
        return;
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        onLoginError(new Error('Invalid response from Apple'));
      } else {
        onLoginError(error);
      }
    }
  };

  // Only render on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleAppleLogin}>
      <View style={styles.buttonContent}>
        <Ionicons name="logo-apple" size={20} color="#fff" />
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000',
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

export default AppleLoginButton;

