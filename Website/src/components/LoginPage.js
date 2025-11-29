import React, { useState } from 'react';
import './LoginPage.css';
import Colors from '../utils/colors';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import ApiService from '../config/api';

const LoginPage = () => {
  const [authMode, setAuthMode] = useState('phone'); // 'phone' or 'email'
  const [isSignup, setIsSignup] = useState(false);
  
  // Phone auth states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // Email auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle phone login
  const handlePhoneLogin = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    if (!phone.startsWith('+')) {
      setError('Phone number must include country code (e.g., +1 for US, +91 for India)');
      return;
    }

    setLoading(true);
    setError('');

    // Variable to capture API error response (needs to be in outer scope)
    let apiErrorResponse = null;

    try {
      // Clean up any existing verifiers first
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing previous verifier:', e);
        }
        delete window.recaptchaVerifier;
      }
      
      // Clear the reCAPTCHA container (it exists permanently in DOM)
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      } else {
        throw new Error('reCAPTCHA container not found. Please refresh the page.');
      }
      
      // Set up reCAPTCHA verifier with invisible size
      // Firebase v9+ signature: RecaptchaVerifier(auth, containerId, options)
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified successfully');
          },
          'expired-callback': () => {
            console.error('reCAPTCHA expired');
            setError('reCAPTCHA expired. Please try again.');
          },
          'error-callback': (error) => {
            console.error('reCAPTCHA error:', error);
            setError('reCAPTCHA error: ' + error.message);
          }
        }
      );
      
      // Store verifier globally for cleanup
      window.recaptchaVerifier = recaptchaVerifier;

      // signInWithPhoneNumber will automatically render and verify reCAPTCHA
      console.log('Sending SMS with phone:', phone);
      console.log('Current origin:', window.location.origin);
      console.log('Current URL:', window.location.href);
      
      // Intercept fetch to capture the exact API error response
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(async response => {
          const url = args[0];
          if (typeof url === 'string' && url.includes('sendVerificationCode')) {
            if (!response.ok) {
              const clonedResponse = response.clone();
              try {
                apiErrorResponse = await clonedResponse.json();
                console.error('🔴 API Error Response:', JSON.stringify(apiErrorResponse, null, 2));
              } catch (e) {
                const text = await clonedResponse.text();
                console.error('🔴 API Error Response (text):', text);
                apiErrorResponse = text;
              }
            }
          }
          return response;
        });
      };
      
      try {
        const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
        window.fetch = originalFetch; // Restore original fetch
        setConfirmationResult(confirmation);
        setShowOtp(true);
        setError('');
      } finally {
        window.fetch = originalFetch; // Always restore original fetch
      }
    } catch (error) {
      console.error('Phone login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      console.error('Error details:', error.customData);
      console.error('Error server response:', error.customData?.serverResponse);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/invalid-app-credential') {
        const errorDetails = error.customData?.serverResponse || error.message;
        console.error('🔴 INVALID APP CREDENTIAL ERROR DETAILS:');
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Custom data:', error.customData);
        console.error('Server response:', error.customData?.serverResponse);
        console.error('Current Firebase config:', {
          apiKey: auth.app.options.apiKey,
          appId: auth.app.options.appId,
          projectId: auth.app.options.projectId,
          authDomain: auth.app.options.authDomain
        });
        console.error('Current URL:', window.location.href);
        console.error('Current origin:', window.location.origin);
        if (apiErrorResponse) {
          console.error('🔴 API Error Response captured:', apiErrorResponse);
        }
        
        // Provide specific guidance based on common issues
        let specificGuidance = 'Most likely causes:\n';
        specificGuidance += '1. OAuth client missing "http://localhost:3001" in Authorized JavaScript origins\n';
        specificGuidance += '2. API key restrictions blocking the request\n';
        specificGuidance += '3. Web app not properly linked to OAuth client\n';
        specificGuidance += '\nSee INVALID_APP_CREDENTIAL_FIX.md for step-by-step fix.';
        
        setError(`Firebase configuration error. ${specificGuidance}`);
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait before trying again.');
      } else if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Please check and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(error.message || 'Failed to send SMS. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      setError('Session expired. Please start over.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(otp);
      
      if (result.user) {
        const idToken = await result.user.getIdToken();
        const backendResponse = await ApiService.firebasePhoneLogin(idToken);
        
        if (backendResponse.success) {
          // Store tokens and user data
          localStorage.setItem('accessToken', backendResponse.accessToken);
          localStorage.setItem('refreshToken', backendResponse.refreshToken || '');
          localStorage.setItem('user', JSON.stringify(backendResponse.user));
          
          // Redirect based on profile completion status
          const isProfileComplete = backendResponse.user?.profileComplete === true;
          window.location.href = isProfileComplete ? '/dashboard' : '/profile-setup';
        }
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      setError(error.message || 'Failed to verify OTP. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password auth
  const handleEmailPasswordAuth = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userCredential;
      
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      if (userCredential.user) {
        const idToken = await userCredential.user.getIdToken();
        const backendResponse = await ApiService.firebaseEmailLogin(idToken);
        
        if (backendResponse.success) {
          // Store tokens and user data
          localStorage.setItem('accessToken', backendResponse.accessToken);
          localStorage.setItem('refreshToken', backendResponse.refreshToken || '');
          localStorage.setItem('user', JSON.stringify(backendResponse.user));
          
          // Redirect based on profile completion status
          const isProfileComplete = backendResponse.user?.profileComplete === true;
          window.location.href = isProfileComplete ? '/dashboard' : '/profile-setup';
        }
      }
    } catch (error) {
      console.error('Email/Password Auth Error:', error);
      setError(error.message || (isSignup ? 'Failed to create account. Please try again.' : 'Failed to sign in. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Starting Google Sign-In...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      console.log('Calling signInWithPopup...');
      const result = await signInWithPopup(auth, provider);
      
      console.log('Google Sign-In successful:', result.user.email);
      
      if (result.user) {
        // Use Firebase ID token approach - this is more reliable for web
        // The backend endpoint /auth/firebase-google-login uses Firebase Admin SDK
        // which properly handles Firebase tokens from signInWithPopup
        console.log('Getting Firebase ID token...');
        const firebaseIdToken = await result.user.getIdToken();
        console.log('Got Firebase ID token, calling backend...');
        
        const backendResponse = await ApiService.firebaseGoogleLogin(firebaseIdToken);
        console.log('Backend response:', backendResponse);
        
        if (backendResponse.success) {
          // Store tokens and user data
          localStorage.setItem('accessToken', backendResponse.tokens?.accessToken || backendResponse.accessToken);
          localStorage.setItem('refreshToken', backendResponse.tokens?.refreshToken || backendResponse.refreshToken || '');
          localStorage.setItem('user', JSON.stringify(backendResponse.user));
          
          console.log('Login successful, checking profile completion...');
          // Redirect based on profile completion status
          const isProfileComplete = backendResponse.user?.profileComplete === true;
          window.location.href = isProfileComplete ? '/dashboard' : '/profile-setup';
        } else {
          throw new Error(backendResponse.error || 'Backend authentication failed');
        }
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup was blocked by browser. Please allow popups and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please contact support.');
      } else {
        setError(error.message || 'Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ backgroundColor: Colors.background.secondary }}>
      {/* reCAPTCHA container - MUST be outside conditional rendering to prevent React from destroying it */}
      <div id="recaptcha-container" style={{ display: 'none' }}></div>
      
      <div className="login-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to GrowWell Tax</h1>
            <p className="hero-subtitle">File your taxes confidently and securely</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <div className="card-header">
            <div className="icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h2 className="card-title">Secure Login</h2>
            <p className="card-description">
              Your data is protected with enterprise-grade security
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Auth Mode Tabs */}
          <div className="tab-container">
            <button
              className={`tab-button ${authMode === 'phone' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('phone');
                setShowOtp(false);
                setError('');
              }}
            >
              Phone
            </button>
            <button
              className={`tab-button ${authMode === 'email' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('email');
                setShowOtp(false);
                setError('');
              }}
            >
              Email
            </button>
          </div>

          {/* Phone Authentication */}
          {authMode === 'phone' && !showOtp && (
            <div className="auth-form">
              <label className="form-label">Phone Number (with country code)</label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
              />
              <p className="help-text">Include country code (e.g., +1 for US, +91 for India)</p>
              
              <button
                className="btn-primary"
                onClick={handlePhoneLogin}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send SMS Code'}
              </button>
            </div>
          )}

          {/* OTP Input */}
          {authMode === 'phone' && showOtp && (
            <div className="auth-form">
              <div className="otp-header">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <p className="otp-text">
                  We sent a 6-digit code to<br/>
                  <strong>{phone}</strong>
                </p>
              </div>
              
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="form-input"
                maxLength={6}
              />
              
              <button
                className="btn-primary"
                onClick={handleOtpVerify}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowOtp(false);
                  setOtp('');
                  setError('');
                }}
              >
                Back to Phone
              </button>
            </div>
          )}

          {/* Email/Password Authentication */}
          {authMode === 'email' && (
            <div className="auth-form">
              {/* Signup/Login Toggle */}
              <div className="toggle-container">
                <button
                  className={`toggle-button ${!isSignup ? 'active' : ''}`}
                  onClick={() => setIsSignup(false)}
                >
                  Login
                </button>
                <button
                  className={`toggle-button ${isSignup ? 'active' : ''}`}
                  onClick={() => setIsSignup(true)}
                >
                  Sign Up
                </button>
              </div>

              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />

              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />

              {isSignup && (
                <>
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                  />
                </>
              )}

              <button
                className="btn-primary"
                onClick={handleEmailPasswordAuth}
                disabled={loading}
              >
                {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
              </button>

              {/* Demo Account Info */}
              {!isSignup && (
                <div className="demo-account">
                  <h4>Demo Account for Reviewers</h4>
                  <p>Email: demo@growwelltax.com</p>
                  <p>Password: Demo123!</p>
                </div>
              )}
            </div>
          )}

          {/* Trust Indicators */}
          <div className="trust-indicators">
            <span>✓ Bank-level security</span>
            <span>•</span>
            <span>✓ Data encrypted</span>
          </div>

          {/* Google Login */}
          <div className="google-login-section">
            <button
              className="btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

