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

  useEffect(() => { loadStoredAuth(); }, []);

  const loadStoredAuth = async () => {
    try {
      const { accessToken, refreshToken } = await secureStorage.getAuthTokens();
      const storedUser = await secureStorage.getUserData();
      if (accessToken && storedUser) {
        const ok = await validateStoredToken(accessToken);
        if (ok) { setToken(accessToken); setUser(storedUser); }
        else {
          if (refreshToken) {
            const r = await refreshAccessToken();
            if (!r) await secureStorage.clear();
          } else await secureStorage.clear();
        }
      }
    } catch (e) { console.error(e); }
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
        await secureStorage.setAuthTokens(res.accessToken, res.refreshToken);
        setToken(res.accessToken);
        if (res.user) { await secureStorage.setUserData(res.user); setUser(res.user); }
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
      const backend = await ApiService.firebasePhoneLogin(idToken).catch(()=>null);
      if (backend?.success) {
        await secureStorage.setAuthTokens(backend.accessToken, null);
        await secureStorage.setUserData(backend.user);
        setUser(backend.user); setToken(backend.accessToken);
        return { success: true, user: backend.user };
      } else {
        await secureStorage.setAuthTokens(idToken, null);
        await secureStorage.setUserData(firebaseUser);
        setUser(firebaseUser); setToken(idToken);
        return { success: true, user: firebaseUser };
      }
    } catch (err) {
      console.error('verifyPhoneOTP error', err);
      throw err;
    }
  };

  const emailPasswordSignup = async (email, password) => {
    const cred = await auth().createUserWithEmailAndPassword(email, password);
    const idToken = await cred.user.getIdToken();
    const backend = await ApiService.firebaseEmailLogin(idToken);
    if (!backend?.success) throw new Error(backend?.error||'backend error');
    await secureStorage.setAuthTokens(backend.accessToken, backend.refreshToken);
    await secureStorage.setUserData(backend.user);
    setUser(backend.user); setToken(backend.accessToken);
    return { success: true, user: backend.user };
  };

  const emailPasswordLogin = async (email, password) => {
    const cred = await auth().signInWithEmailAndPassword(email, password);
    const idToken = await cred.user.getIdToken();
    const backend = await ApiService.firebaseEmailLogin(idToken);
    if (!backend?.success) throw new Error(backend?.error||'backend error');
    await secureStorage.setAuthTokens(backend.accessToken, backend.refreshToken);
    await secureStorage.setUserData(backend.user);
    setUser(backend.user); setToken(backend.accessToken);
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
      setUser(backend.user);
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
      await secureStorage.setUserData(updatedUser);
      setUser(updatedUser);
    } catch (err) {
      console.error('updateUser error', err);
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
      setUser(backend.user);
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
