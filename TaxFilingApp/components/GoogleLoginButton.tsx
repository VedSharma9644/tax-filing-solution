import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';

interface GoogleLoginButtonProps {
  onLoginSuccess: (userInfo: any) => void;
  onLoginError: (error: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onLoginSuccess, 
  onLoginError 
}) => {
  const handleGoogleLogin = async () => {
    try {
      // Use a simpler OAuth flow that works better with Expo Go
      const redirectUri = 'https://auth.expo.io/@vedsharma9644/TaxFilingApp';
      
      console.log('Using redirect URI:', redirectUri);

      const request = new AuthSession.AuthRequest({
        clientId: '462462706245-p5slnpl2q03gsgpiu6thumfnp1buvo7a.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Token,
        extraParams: {},
        additionalParameters: {},
        prompt: AuthSession.Prompt.SelectAccount,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        console.log('OAuth success, params:', result.params);
        
        // Get access token directly from result
        const accessToken = result.params.access_token;
        
        if (accessToken) {
          console.log('Access token received, fetching user info...');
          
          // Get user info
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
          );
          
          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            console.log('User info received:', userInfo);
            onLoginSuccess(userInfo);
          } else {
            console.log('Failed to fetch user info:', userInfoResponse.status);
            onLoginError(new Error('Failed to fetch user info'));
          }
        } else {
          console.log('No access token in result params');
          onLoginError(new Error('No access token received'));
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google Login');
      } else {
        console.log('OAuth failed, result type:', result.type);
        console.log('Error details:', result.error);
        onLoginError(new Error(`Authentication failed: ${result.error || 'Unknown error'}`));
      }
    } catch (error: any) {
      console.log('Google Login Error:', error);
      onLoginError(error);
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
