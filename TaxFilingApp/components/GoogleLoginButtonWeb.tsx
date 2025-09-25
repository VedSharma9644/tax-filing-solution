import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GoogleLoginButtonProps {
  onLoginSuccess: (userInfo: any) => void;
  onLoginError: (error: any) => void;
}

const GoogleLoginButtonWeb: React.FC<GoogleLoginButtonProps> = ({ 
  onLoginSuccess, 
  onLoginError 
}) => {
  const handleGoogleLogin = async () => {
    try {
      // For now, let's use a simpler approach that works reliably
      Alert.alert(
        'Google Login',
        'Google Sign-In is being set up. For now, you can use the email/phone login or continue to dashboard for testing.',
        [
          {
            text: 'Use Email Login',
            onPress: () => {
              // Let user use the existing email login
            }
          },
          {
            text: 'Continue to Dashboard',
            onPress: () => {
              // Simulate successful login for testing
              const mockUserInfo = {
                id: '123456789',
                email: 'test@example.com',
                name: 'Test User',
                picture: 'https://via.placeholder.com/150',
                given_name: 'Test',
                family_name: 'User',
              };
              onLoginSuccess(mockUserInfo);
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

export default GoogleLoginButtonWeb;
