import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Google Sign-In Configuration
export const GOOGLE_AUTH_CONFIG = {
  // Android client ID from Google Cloud Console (project 3649f)
  // Using the correct Android client for com.creayaa.thegrowwell
  androidClientId: '693306869303-3c6quk9783jffvnh4lv7g33o7qimjkf0.apps.googleusercontent.com',
  
  // iOS client ID (will be added when you build for iOS)
  iosClientId: '693306869303-3c6quk9783jffvnh4lv7g33o7qimjkf0.apps.googleusercontent.com', // Same for now
  
  // Web client ID (for server-side verification)
  webClientId: '693306869303-h140tfkqn6re5rfa31jo1aqi98nucqac.apps.googleusercontent.com',
  
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
