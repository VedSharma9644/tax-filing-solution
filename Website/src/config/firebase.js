// Firebase Web SDK Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6WJ7L4irLmJpxPt9Bjo86RWGrkDwvU6A",
  authDomain: "tax-filing-app-3649f.firebaseapp.com",
  projectId: "tax-filing-app-3649f",
  storageBucket: "tax-filing-app-3649f.appspot.com",
  messagingSenderId: "693306869303",
  appId: "1:693306869303:web:27d180144611ba2a91a1b2",
  measurementId: "G-XTXE3ELZ69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Analytics (browser only)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;

