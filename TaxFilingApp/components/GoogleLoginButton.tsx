import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { GOOGLE_AUTH_CONFIG } from '../config/googleAuth';

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
      console.log('Using redirect URI:', GOOGLE_AUTH_CONFIG.redirectUri);

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_AUTH_CONFIG.clientId,
        scopes: GOOGLE_AUTH_CONFIG.scopes,
        redirectUri: GOOGLE_AUTH_CONFIG.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {},
        additionalParameters: {},
        prompt: AuthSession.Prompt.SelectAccount,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: GOOGLE_AUTH_CONFIG.authorizationEndpoint,
      });

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        console.log('OAuth success, params:', result.params);
        
        // Get authorization code from result
        const authCode = result.params.code;
        
        if (authCode) {
          console.log('Authorization code received, exchanging for tokens...');
          
          try {
            // Exchange authorization code for tokens via our backend
            const response = await googleLogin(authCode, null);
            
            if (response.success) {
              console.log('Google login successful:', response);
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
          console.log('No authorization code in result params');
          onLoginError(new Error('No authorization code received'));
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
