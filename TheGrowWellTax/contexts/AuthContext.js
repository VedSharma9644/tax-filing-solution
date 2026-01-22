// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../utils/secureStorage';
import ApiService from '../services/api';
import auth from '@react-native-firebase/auth';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wrap setUser to add logging
  const setUserWithLogging = (newUser) => {
    console.log('🔍 [AuthContext] setUser called:', {
      previousUser: user ? {
        id: user.id,
        profileComplete: user.profileComplete,
        profileCompleteType: typeof user.profileComplete
      } : null,
      newUser: newUser ? {
        id: newUser.id,
        profileComplete: newUser.profileComplete,
        profileCompleteType: typeof newUser?.profileComplete,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email
      } : null,
      stackTrace: new Error().stack
    });
    setUser(newUser);
  };

  useEffect(() => { loadStoredAuth(); }, []);

  const loadStoredAuth = async () => {
    try {
      const { accessToken, refreshToken } = await secureStorage.getAuthTokens();
      const storedUser = await secureStorage.getUserData();
      console.log('🔍 [AuthContext] loadStoredAuth:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasStoredUser: !!storedUser,
        storedUserProfileComplete: storedUser?.profileComplete,
        storedUserProfileCompleteType: typeof storedUser?.profileComplete
      });
      if (accessToken && storedUser) {
        const ok = await validateStoredToken(accessToken);
        if (ok) { 
          console.log('🔍 [AuthContext] Setting user from stored auth:', {
            userId: storedUser.id,
            profileComplete: storedUser.profileComplete
          });
          setToken(accessToken); 
          setUserWithLogging(storedUser); 
        }
        else {
          if (refreshToken) {
            const r = await refreshAccessToken();
            if (!r) await secureStorage.clear();
          } else await secureStorage.clear();
        }
      }
    } catch (e) { console.error('🔍 [AuthContext] loadStoredAuth error:', e); }
    finally { setLoading(false); }
  };

  const validateStoredToken = async (t) => {
    try { const res = await ApiService.validateToken(t); return !!res?.success; }
    catch { return false; }
  };

  const refreshAccessToken = async () => {
    try {
      const { refreshToken } = await secureStorage.getAuthTokens();
      if (!refreshToken) return false;
      const res = await ApiService.refreshToken(refreshToken);
      if (res?.success) {
        console.log('🔍 [AuthContext] Token refresh successful, updating user:', {
          userId: res.user?.id,
          profileComplete: res.user?.profileComplete,
          profileCompleteType: typeof res.user?.profileComplete,
          userObject: res.user
        });
        await secureStorage.setAuthTokens(res.accessToken, res.refreshToken);
        setToken(res.accessToken);
        if (res.user) { 
          await secureStorage.setUserData(res.user); 
          console.log('🔍 [AuthContext] Setting user from refreshToken response');
          setUserWithLogging(res.user); 
        }
        return true;
      }
      return false;
    } catch { return false; }
  };

  // Native phone OTP (no recaptcha, uses native Firebase)
  const sendPhoneOTP = async (phone) => {
    try {
      if (!phone.startsWith('+')) throw new Error('Phone must include +countrycode');
      const confirmation = await auth().signInWithPhoneNumber(phone);
      return { success: true, confirmation };
    } catch (err) {
      console.error('sendPhoneOTP error', err);
      throw err;
    }
  };

  const verifyPhoneOTP = async (confirmation, code) => {
    try {
      const result = await confirmation.confirm(code);
      const firebaseUser = { uid: result.user.uid, phone: result.user.phoneNumber };
      const idToken = await result.user.getIdToken();
      console.log('🔍 [AuthContext] verifyPhoneOTP: Calling backend firebasePhoneLogin');
      const backend = await ApiService.firebasePhoneLogin(idToken).catch(()=>null);
      if (backend?.success) {
        console.log('🔍 [AuthContext] verifyPhoneOTP: Backend response successful:', {
          userId: backend.user?.id,
          profileComplete: backend.user?.profileComplete,
          profileCompleteType: typeof backend.user?.profileComplete,
          firstName: backend.user?.firstName,
          lastName: backend.user?.lastName,
          email: backend.user?.email,
          fullUserObject: backend.user
        });
        await secureStorage.setAuthTokens(backend.accessToken, null);
        await secureStorage.setUserData(backend.user);
        console.log('🔍 [AuthContext] verifyPhoneOTP: Setting user from backend response');
        setUserWithLogging(backend.user); 
        setToken(backend.accessToken);
        return { success: true, user: backend.user };
      } else {
        console.log('🔍 [AuthContext] verifyPhoneOTP: Backend failed, using Firebase user');
        await secureStorage.setAuthTokens(idToken, null);
        await secureStorage.setUserData(firebaseUser);
        setUserWithLogging(firebaseUser); 
        setToken(idToken);
        return { success: true, user: firebaseUser };
      }
    } catch (err) {
      console.error('🔍 [AuthContext] verifyPhoneOTP error:', err);
      throw err;
    }
  };

  const emailPasswordSignup = async (email, password) => {
    const cred = await auth().createUserWithEmailAndPassword(email, password);
    const idToken = await cred.user.getIdToken();
    const backend = await ApiService.firebaseEmailLogin(idToken);
    if (!backend?.success) throw new Error(backend?.error||'backend error');
    console.log('🔍 [AuthContext] emailPasswordSignup: Backend response:', {
      userId: backend.user?.id,
      profileComplete: backend.user?.profileComplete
    });
    await secureStorage.setAuthTokens(backend.accessToken, backend.refreshToken);
    await secureStorage.setUserData(backend.user);
    setUserWithLogging(backend.user); 
    setToken(backend.accessToken);
    return { success: true, user: backend.user };
  };

  const emailPasswordLogin = async (email, password) => {
    const cred = await auth().signInWithEmailAndPassword(email, password);
    const idToken = await cred.user.getIdToken();
    const backend = await ApiService.firebaseEmailLogin(idToken);
    if (!backend?.success) throw new Error(backend?.error||'backend error');
    console.log('🔍 [AuthContext] emailPasswordLogin: Backend response:', {
      userId: backend.user?.id,
      profileComplete: backend.user?.profileComplete
    });
    await secureStorage.setAuthTokens(backend.accessToken, backend.refreshToken);
    await secureStorage.setUserData(backend.user);
    setUserWithLogging(backend.user); 
    setToken(backend.accessToken);
    return { success: true, user: backend.user };
  };

  // Google Sign-In Login
  const googleLogin = async (authCode, idToken) => {
    try {
      console.log('AuthContext: googleLogin called', { hasIdToken: !!idToken });
      if (!idToken) {
        throw new Error('Google ID token is required');
      }
      console.log('AuthContext: Calling backend googleLogin...');
      const backend = await ApiService.googleLogin(authCode, idToken);
      console.log('AuthContext: Backend response', { 
        success: backend?.success, 
        hasAccessToken: !!backend?.accessToken,
        hasTokens: !!backend?.tokens,
        hasTokensAccessToken: !!backend?.tokens?.accessToken,
        hasRefreshToken: !!backend?.refreshToken,
        hasUser: !!backend?.user 
      });
      
      if (!backend?.success) {
        throw new Error(backend?.error || 'Google login failed');
      }
      
      // Backend returns tokens in nested 'tokens' object
      const accessToken = backend.tokens?.accessToken || backend.accessToken;
      const refreshToken = backend.tokens?.refreshToken || backend.refreshToken;
      
      if (!accessToken) {
        console.error('AuthContext: Backend did not return accessToken!', backend);
        throw new Error('Backend did not return access token');
      }
      
      console.log('AuthContext: Saving tokens to storage...', { 
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken 
      });
      await secureStorage.setAuthTokens(accessToken, refreshToken);
      console.log('AuthContext: Tokens saved, verifying...');
      
      // Verify tokens were saved
      const savedTokens = await secureStorage.getAuthTokens();
      console.log('AuthContext: Tokens verification', { 
        savedAccessToken: !!savedTokens?.accessToken,
        savedRefreshToken: !!savedTokens?.refreshToken 
      });
      
      await secureStorage.setUserData(backend.user);
      console.log('🔍 [AuthContext] googleLogin: Setting user:', {
        userId: backend.user?.id,
        profileComplete: backend.user?.profileComplete
      });
      setUserWithLogging(backend.user);
      setToken(accessToken);
      console.log('AuthContext: User and token set in state', { 
        userId: backend.user?.id,
        tokenLength: accessToken?.length 
      });
      
      return { success: true, user: backend.user };
    } catch (err) {
      console.error('AuthContext: googleLogin error', err);
      throw err;
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      console.log('🔍 [AuthContext] updateUser called:', {
        userId: updatedUser?.id,
        profileComplete: updatedUser?.profileComplete,
        profileCompleteType: typeof updatedUser?.profileComplete,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        email: updatedUser?.email,
        previousUser: user ? {
          id: user.id,
          profileComplete: user.profileComplete
        } : null,
        stackTrace: new Error().stack
      });
      await secureStorage.setUserData(updatedUser);
      console.log('🔍 [AuthContext] updateUser: Setting new user state');
      setUserWithLogging(updatedUser);
    } catch (err) {
      console.error('🔍 [AuthContext] updateUser error:', err);
      throw err;
    }
  };

  // Apple Sign-In Login
  const appleLogin = async (identityToken, authorizationCode, fullName = null) => {
    try {
      console.log('AuthContext: appleLogin called', { 
        hasIdentityToken: !!identityToken,
        hasAuthorizationCode: !!authorizationCode,
        fullName: fullName
      });
      
      if (!identityToken) {
        throw new Error('Apple identity token is required');
      }
      
      console.log('AuthContext: Calling backend appleLogin...');
      const backend = await ApiService.appleLogin(identityToken, authorizationCode, fullName);
      console.log('AuthContext: Backend response', { 
        success: backend?.success, 
        hasAccessToken: !!backend?.accessToken,
        hasRefreshToken: !!backend?.refreshToken,
        hasUser: !!backend?.user 
      });
      
      if (!backend?.success) {
        throw new Error(backend?.error || 'Apple login failed');
      }
      
      // Backend returns tokens in nested 'tokens' object
      const accessToken = backend.tokens?.accessToken || backend.accessToken;
      const refreshToken = backend.tokens?.refreshToken || backend.refreshToken;
      
      if (!accessToken) {
        console.error('AuthContext: Backend did not return accessToken!', backend);
        throw new Error('Backend did not return access token');
      }
      
      console.log('AuthContext: Saving tokens to storage...', { 
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken 
      });
      await secureStorage.setAuthTokens(accessToken, refreshToken);
      console.log('AuthContext: Tokens saved, verifying...');
      
      // Verify tokens were saved
      const savedTokens = await secureStorage.getAuthTokens();
      console.log('AuthContext: Tokens verification', { 
        savedAccessToken: !!savedTokens?.accessToken,
        savedRefreshToken: !!savedTokens?.refreshToken 
      });
      
      await secureStorage.setUserData(backend.user);
      console.log('🔍 [AuthContext] appleLogin: Setting user:', {
        userId: backend.user?.id,
        profileComplete: backend.user?.profileComplete
      });
      setUserWithLogging(backend.user);
      setToken(accessToken);
      console.log('AuthContext: User and token set in state', { 
        userId: backend.user?.id,
        tokenLength: accessToken?.length 
      });
      
      return { success: true, user: backend.user };
    } catch (err) {
      console.error('AuthContext: appleLogin error', err);
      throw err;
    }
  };

  const logout = async () => {
    try { await auth().signOut(); } catch {}
    await secureStorage.clear();
    setUser(null); setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      sendPhoneOTP, verifyPhoneOTP,
      emailPasswordSignup, emailPasswordLogin,
      googleLogin, appleLogin, updateUser,
      logout, isAuthenticated: () => !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};
