import * as AuthSession from 'expo-auth-session';

// Google OAuth Configuration
export const GOOGLE_AUTH_CONFIG = {
  // Android client ID from Google Cloud Console (project 3649f)
  clientId: '693306869303-j2dui567dqbq7ktos9dju9kgu7n69uf1.apps.googleusercontent.com',
  
  // Redirect URI for APK builds - using Expo auth session
  redirectUri: AuthSession.makeRedirectUri({
    useProxy: true
  }),
  
  // Scopes for Google OAuth
  scopes: ['openid', 'profile', 'email'],
  
  // Google OAuth endpoints
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
};

export default GOOGLE_AUTH_CONFIG;
