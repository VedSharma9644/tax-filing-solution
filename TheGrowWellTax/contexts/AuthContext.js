import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/secureStorage';
import auth from '@react-native-firebase/auth';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load stored authentication data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const { accessToken, refreshToken } = await secureStorage.getAuthTokens();
      const storedUser = await secureStorage.getUserData();
      
      if (accessToken && storedUser) {
        // Validate token with backend before setting user
        const isValid = await validateStoredToken(accessToken);
        if (isValid) {
          setToken(accessToken);
          setUser(storedUser);
        } else {
          // Token is invalid, try to refresh
          if (refreshToken) {
            const refreshSuccess = await refreshAccessToken();
            if (!refreshSuccess) {
              // Refresh failed, clear stored data
              await secureStorage.clear();
            }
          } else {
            // No refresh token, clear stored data
            await secureStorage.clear();
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // Fallback to regular storage
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          const isValid = await validateStoredToken(storedToken);
          if (isValid) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Clear invalid tokens
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback auth loading failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Validate stored token with backend
  const validateStoredToken = async (token) => {
    try {
      const response = await ApiService.validateToken(token);
      return response && response.success;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async () => {
    try {
      const { refreshToken } = await secureStorage.getAuthTokens();
      if (!refreshToken) {
        console.log('No refresh token available');
        return false;
      }

      const response = await ApiService.refreshToken(refreshToken);
      if (response && response.success) {
        // Store new tokens
        await secureStorage.setAuthTokens(response.accessToken, response.refreshToken);
        setToken(response.accessToken);
        
        // Update user data if provided
        if (response.user) {
          await secureStorage.setUserData(response.user);
          setUser(response.user);
        }
        
        return true;
      } else {
        console.log('Token refresh failed:', response?.error);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const sendPhoneOTP = async (phone) => {
    try {
      // Validate phone number format
      if (!phone.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1234567890)');
      }

      console.log('Sending SMS via Firebase to:', phone);
      
      // Use React Native Firebase Phone Authentication for mobile
      const confirmation = await auth().signInWithPhoneNumber(phone);
      
      console.log('Firebase confirmation received:', confirmation);
      console.log('Confirmation type:', typeof confirmation);
      console.log('Confirmation methods:', Object.getOwnPropertyNames(confirmation));
      
      return {
        success: true,
        message: `SMS sent to ${phone}! Check your phone for the verification code.`,
        confirmation: confirmation
      };
    } catch (error) {
      console.error('Firebase Phone Auth Error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please wait before trying again.');
      } else if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number format. Please check and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw error;
      }
    }
  };

  const verifyPhoneOTP = async (confirmation, otpCode) => {
    try {
      console.log('Verifying OTP with confirmation:', confirmation);
      console.log('OTP Code:', otpCode);
      
      // Use React Native Firebase confirmation.confirm() method directly
      const result = await confirmation.confirm(otpCode);
      
      if (result.user) {
        const userData = {
          uid: result.user.uid,
          phone: result.user.phoneNumber,
          displayName: result.user.displayName,
          emailVerified: result.user.emailVerified
        };

        console.log('Firebase Phone Auth Success!');
        console.log('User UID:', result.user.uid);
        console.log('Phone Number:', result.user.phoneNumber);

        // Get Firebase ID token (Firebase doesn't provide accessToken directly)
        const idToken = await result.user.getIdToken();
        console.log('Firebase ID Token obtained:', idToken ? 'Yes' : 'No');

        // Call backend to create/update user and get backend JWT
        try {
          console.log('Calling backend for Firebase Phone Auth...');
          const backendResponse = await ApiService.firebasePhoneLogin(idToken);
          
          if (backendResponse.success) {
            console.log('Backend authentication successful');
            
            // Store backend JWT token and user data
            await secureStorage.setAuthTokens(backendResponse.accessToken, null);
            await secureStorage.setUserData(backendResponse.user);
            
            setUser(backendResponse.user);
            setToken(backendResponse.accessToken);
            
            return {
              success: true,
              message: 'Phone authentication successful!',
              user: backendResponse.user
            };
          } else {
            throw new Error(backendResponse.error || 'Backend authentication failed');
          }
        } catch (backendError) {
          console.error('Backend authentication error:', backendError);
          console.error('Backend error details:', {
            message: backendError.message,
            status: backendError.status,
            response: backendError.response
          });
          
          // Fallback: store Firebase data only (limited functionality)
          await secureStorage.setAuthTokens(idToken, null);
          await secureStorage.setUserData(userData);
          
          setUser(userData);
          setToken(idToken);
          
          return {
            success: true,
            message: `Phone authentication successful! (Backend error: ${backendError.message})`,
            user: userData
          };
        }
      } else {
        // Handle case where result.user is falsy
        console.error('Firebase Phone Auth failed: No user in result');
        throw new Error('Authentication failed: No user data received from Firebase');
      }
    } catch (error) {
      console.error('Phone OTP Verification Error:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid verification code. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('Verification code has expired. Please request a new one.');
      } else if (error.code === 'auth/invalid-verification-id') {
        throw new Error('Invalid verification session. Please start over.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw new Error(error.message || 'Failed to verify OTP. Please try again.');
      }
    }
  };


  const googleLogin = async (authCode, idToken) => {
    try {
      const response = await ApiService.googleLogin(authCode, idToken);
      
      if (response.success) {
        const { user: userData, tokens } = response;
        
        // Store authentication data securely
        await secureStorage.setAuthTokens(tokens.accessToken, tokens.refreshToken);
        await secureStorage.setUserData(userData);
        
        setUser(userData);
        setToken(tokens.accessToken);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async (navigation = null) => {
    try {
      await secureStorage.clear();
      setUser(null);
      setToken(null);
      
      // Navigate to login screen if navigation is provided
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Signup' }],
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback to regular storage cleanup
      try {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // Still navigate even if cleanup fails
        if (navigation) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Signup' }],
          });
        }
      } catch (fallbackError) {
        console.error('Fallback logout cleanup failed:', fallbackError);
        // Navigate even if all cleanup fails
        if (navigation) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Signup' }],
          });
        }
      }
    }
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    token,
    loading,
    sendPhoneOTP,
    verifyPhoneOTP,
    googleLogin,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
