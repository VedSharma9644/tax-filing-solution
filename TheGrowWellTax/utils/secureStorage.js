import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Secure storage utilities with encryption

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'user',
  ENCRYPTION_KEY: 'encryptionKey',
};

// Generate a simple encryption key (in production, use a more secure method)
const getEncryptionKey = async () => {
  try {
    let key = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEY);
    if (!key) {
      key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}-${Math.random()}`,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      await AsyncStorage.setItem(STORAGE_KEYS.ENCRYPTION_KEY, key);
    }
    return key;
  } catch (error) {
    console.error('Error generating encryption key:', error);
    return null;
  }
};

// Simple XOR encryption (for basic protection)
const encrypt = (text, key) => {
  if (!text || !key) return text;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
};

const decrypt = (encryptedText, key) => {
  if (!encryptedText || !key) return encryptedText;
  
  try {
    const decoded = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch (error) {
    console.error('Error decrypting data:', error);
    return encryptedText;
  }
};

export const secureStorage = {
  // Store encrypted data
  async setItem(key, value) {
    try {
      const encryptionKey = await getEncryptionKey();
      if (!encryptionKey) {
        // Fallback to regular storage if encryption fails
        return await AsyncStorage.setItem(key, JSON.stringify(value));
      }
      
      const encryptedValue = encrypt(JSON.stringify(value), encryptionKey);
      return await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw error;
    }
  },

  // Retrieve and decrypt data
  async getItem(key) {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;
      
      const encryptionKey = await getEncryptionKey();
      if (!encryptionKey) {
        // Fallback to regular storage if encryption fails
        try {
          return JSON.parse(encryptedValue);
        } catch (parseError) {
          console.warn(`Failed to parse unencrypted data for key ${key}, returning raw value`);
          return encryptedValue;
        }
      }
      
      const decryptedValue = decrypt(encryptedValue, encryptionKey);
      try {
        return JSON.parse(decryptedValue);
      } catch (parseError) {
        console.warn(`Failed to parse decrypted data for key ${key}, returning raw value`);
        return decryptedValue;
      }
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  },

  // Remove item
  async removeItem(key) {
    try {
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw error;
    }
  },

  // Clear all secure data
  async clear() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing secure data:', error);
      throw error;
    }
  },

  // Store authentication tokens
  async setAuthTokens(accessToken, refreshToken) {
    const promises = [];
    
    // Only store access token if it's not null/undefined
    if (accessToken) {
      promises.push(this.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken));
    } else {
      promises.push(this.removeItem(STORAGE_KEYS.ACCESS_TOKEN));
    }
    
    // Only store refresh token if it's not null/undefined
    if (refreshToken) {
      promises.push(this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken));
    } else {
      promises.push(this.removeItem(STORAGE_KEYS.REFRESH_TOKEN));
    }
    
    await Promise.all(promises);
  },

  // Get authentication tokens
  async getAuthTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      this.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },

  // Store user data
  async setUserData(user) {
    return await this.setItem(STORAGE_KEYS.USER_DATA, user);
  },

  // Get user data
  async getUserData() {
    return await this.getItem(STORAGE_KEYS.USER_DATA);
  },
};
