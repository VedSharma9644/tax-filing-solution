// config/firebase.js
// Firebase initialization for React Native Firebase
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Verify Firebase is initialized
// On iOS, this should auto-initialize from GoogleService-Info.plist
// On Android, this should auto-initialize from google-services.json
try {
  const apps = firebase.apps;
  if (apps.length === 0) {
    // This should not happen if plist/json files are properly configured
    // But we'll log it for debugging
    console.warn('⚠️ Firebase apps array is empty - checking if default app exists...');
  } else {
    console.log('✅ Firebase initialized successfully', {
      appCount: apps.length,
      defaultApp: firebase.app().name,
    });
  }
  
  // Verify default app exists
  const defaultApp = firebase.app();
  if (!defaultApp) {
    console.error('❌ Firebase default app not found!');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Don't throw - let the app continue, but log the error
  // This helps identify issues during Apple review
}

export { auth };
export default firebase;
