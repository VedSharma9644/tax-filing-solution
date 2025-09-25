import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GoogleLoginButtonProps {
  onLoginSuccess: (userInfo: any) => void;
  onLoginError: (error: any) => void;
}

const GoogleLoginButtonSimple: React.FC<GoogleLoginButtonProps> = ({ 
  onLoginSuccess, 
  onLoginError 
}) => {
  const handleGoogleLogin = async () => {
    try {
      // Simulate Google Login for demo purposes
      Alert.alert(
        'Google Sign-In',
        'This is a demo version. In production, this would open Google OAuth.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Continue as Demo User',
            onPress: () => {
              const demoUserInfo = {
                id: 'demo_user_123',
                email: 'demo@taxfilingapp.com',
                name: 'Demo User',
                picture: 'https://via.placeholder.com/150',
                given_name: 'Demo',
                family_name: 'User',
                verified_email: true,
              };
              onLoginSuccess(demoUserInfo);
            }
          }
        ]
      );
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

export default GoogleLoginButtonSimple;
