import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import { secureStorage } from '../utils/secureStorage';

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
        setToken(accessToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      // Fallback to regular storage
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (fallbackError) {
        console.error('Fallback auth loading failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOTP = async (email) => {
    try {
      const response = await ApiService.sendEmailOTP(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const sendPhoneOTP = async (phone) => {
    try {
      const response = await ApiService.sendPhoneOTP(phone);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (email, phone, otp) => {
    try {
      const response = await ApiService.verifyOTP(email, phone, otp);
      
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

  const logout = async () => {
    try {
      await secureStorage.clear();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback to regular storage cleanup
      try {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      } catch (fallbackError) {
        console.error('Fallback logout cleanup failed:', fallbackError);
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
    sendEmailOTP,
    sendPhoneOTP,
    verifyOTP,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
