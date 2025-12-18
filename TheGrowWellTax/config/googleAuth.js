import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Google Sign-In Configuration
export const GOOGLE_AUTH_CONFIG = {
  // Android client ID from Google Cloud Console (project 3649f)
  // Using the correct Android client for com.creayaa.thegrowwell
  androidClientId: '693306869303-3c6quk9783jffvnh4lv7g33o7qimjkf0.apps.googleusercontent.com',
  
  // iOS client ID from GoogleService-Info.plist
  iosClientId: '693306869303-qmb0bk8040v91rd8o5lhpcp8mquia2ek.apps.googleusercontent.com',
  
  // Web client ID (for server-side verification)
  // Updated after adding Google Play Store SHA-1 keys
  webClientId: '693306869303-m2bkqknr160oiqpkdmeqg7mv24pnokk7.apps.googleusercontent.com',
  
  // Scopes for Google Sign-In
  scopes: ['openid', 'profile', 'email'],
};

// Initialize Google Sign-In
export const initializeGoogleSignin = () => {
  GoogleSignin.configure({
    webClientId: GOOGLE_AUTH_CONFIG.webClientId,
    iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
    scopes: GOOGLE_AUTH_CONFIG.scopes,
    offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
  });
};

export default GOOGLE_AUTH_CONFIG;
