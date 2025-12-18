# Google Sign-In DEVELOPER_ERROR Troubleshooting Guide

## 🔴 Error: `DEVELOPER_ERROR` or `code: 10`

This error is **ALWAYS** a configuration mismatch between your app and Google Cloud Console. Follow these steps to fix it.

---

## ✅ Step 1: Get Your SHA-1 Fingerprint

The Android OAuth client in Google Cloud Console needs your app's SHA-1 certificate fingerprint.

### For Debug Builds (Development):

**Windows (PowerShell):**
```powershell
cd android
.\gradlew signingReport
```

**Windows (Command Prompt):**
```cmd
cd android
gradlew signingReport
```

**macOS/Linux:**
```bash
cd android
./gradlew signingReport
```

Look for output like this:
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: AndroidDebugKey
MD5: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX  ← COPY THIS
SHA-256: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy the SHA1 value** (remove colons, make it lowercase).

### Alternative Method (Direct Keystore):

If the above doesn't work, find your debug keystore and run:

**Windows:**
```cmd
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**macOS/Linux:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### For Release Builds (Production):

If you're testing with a release build, you need the SHA-1 of your release keystore:

```cmd
keytool -list -v -keystore android/app/release.keystore -alias your-key-alias
```

---

## ✅ Step 2: Verify Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **tax-filing-app-3649f** (Project Number: 693306869303)
3. Navigate to: **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client IDs**

### Check Android OAuth Client:

Look for the Android client ID: `693306869303-3c6quk9783jffvnh4lv7g33o7qimjkf0`

**Verify:**
- ✅ **Package name** is: `com.creayaa.thegrowwell`
- ✅ **SHA-1 certificate fingerprint** matches the one you got from Step 1
- ✅ If testing release builds, add the release SHA-1 as well

### Check Web OAuth Client:

Look for the Web client ID: `693306869303-m2bkqknr160oiqpkdmeqg7mv24pnokk7` (Updated after adding Play Store SHA-1 keys)

**Verify:**
- ✅ **Client type** is "Web application" (NOT Android!)
- ✅ This is the one used as `webClientId` in your app

---

## ✅ Step 3: Add/Update SHA-1 Fingerprint in Google Cloud Console

If your SHA-1 is missing or different:

1. Go to **APIs & Services** → **Credentials**
2. Click on your **Android OAuth client** (`693306869303-3c6quk9783jffvnh4lv7g33o7qimjkf0`)
3. Click **Edit**
4. Under **SHA-1 certificate fingerprints**, click **+ ADD SHA-1 CERTIFICATE FINGERPRINT**
5. Paste your SHA-1 fingerprint (without colons, lowercase)
6. Click **Save**
7. **Wait 5-10 minutes** for changes to propagate

---

## ✅ Step 4: Verify Firebase Console Settings

1. Go to [Firebase Console](https://console.firebase.google.com/project/tax-filing-app-3649f)
2. Navigate to: **Authentication** → **Sign-in method**
3. Ensure **Google** provider is **Enabled**
4. Set a **Support email**
5. Click **Save**

---

## ✅ Step 5: Verify Your App Configuration

### Check `config/googleAuth.js`:

```javascript
webClientId: '693306869303-m2bkqknr160oiqpkdmeqg7mv24pnokk7.apps.googleusercontent.com'
```

✅ This should match the **Web client ID** (not Android client ID!)

### Check `android/app/build.gradle`:

```gradle
applicationId 'com.creayaa.thegrowwell'
```

✅ This should match the package name in Google Cloud Console

---

## ✅ Step 6: Clean and Rebuild

After making changes:

```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

Or if using React Native CLI:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

---

## ✅ Step 7: Test Again

1. Uninstall the app from your device/emulator
2. Rebuild and install fresh
3. Try Google Sign-In again

---

## 🔍 Common Issues & Solutions

### Issue: SHA-1 fingerprint doesn't match

**Solution:** 
- Make sure you're using the correct keystore (debug vs release)
- Add both debug and release SHA-1 fingerprints to Google Cloud Console
- Wait 5-10 minutes after adding

### Issue: Package name mismatch

**Solution:**
- Verify `applicationId` in `build.gradle` matches Google Cloud Console
- Check `AndroidManifest.xml` package name
- Ensure Google Cloud Console OAuth client has the correct package name

### Issue: Wrong webClientId

**Solution:**
- `webClientId` must be a **Web client** (client_type: 3), NOT Android client
- Verify in Google Cloud Console that the client type is "Web application"
- Current correct webClientId: `693306869303-m2bkqknr160oiqpkdmeqg7mv24pnokk7.apps.googleusercontent.com` (Updated after adding Play Store SHA-1 keys)

### Issue: Still getting error after fixing

**Solution:**
- Wait 10-15 minutes for Google's servers to update
- Clear app data: Settings → Apps → Your App → Clear Data
- Uninstall and reinstall the app
- Try running the config doctor: `npx @react-native-google-signin/config-doctor`

---

## 🛠️ Quick Diagnostic Commands

### Run Config Doctor:
```bash
npx @react-native-google-signin/config-doctor
```

This will check your configuration and provide specific fixes.

### Verify Current Configuration:

Check your current setup:
- Package name: `com.creayaa.thegrowwell` ✅
- Web Client ID: `693306869303-m2bkqknr160oiqpkdmeqg7mv24pnokk7.apps.googleusercontent.com` ✅ (Updated after adding Play Store SHA-1 keys)
- Android Client ID: `693306869303-3c6quk9783jffvnh4lv7g33o7qimjkf0.apps.googleusercontent.com` ✅

---

## 📋 Checklist

- [ ] Got SHA-1 fingerprint from debug keystore
- [ ] Added SHA-1 to Google Cloud Console Android OAuth client
- [ ] Verified package name matches (`com.creayaa.thegrowwell`)
- [ ] Verified webClientId is Web client type (not Android)
- [ ] Enabled Google Sign-In in Firebase Console
- [ ] Waited 5-10 minutes after making changes
- [ ] Cleaned and rebuilt the app
- [ ] Uninstalled old app and installed fresh build
- [ ] Tested Google Sign-In again

---

## 🔗 Useful Links

- [React Native Google Sign-In Troubleshooting](https://react-native-google-signin.github.io/docs/troubleshooting)
- [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
- [Firebase Console Authentication](https://console.firebase.google.com/project/tax-filing-app-3649f/authentication/providers)

---

## 💡 Still Not Working?

If you've followed all steps and it's still not working:

1. **Double-check SHA-1**: Make sure you're using the exact SHA-1 from the keystore you're signing with
2. **Check for typos**: Package name, client IDs, SHA-1 fingerprints must be exact
3. **Try config doctor**: `npx @react-native-google-signin/config-doctor`
4. **Check logs**: Look for more detailed error messages in Android logcat
5. **Verify project**: Make sure you're editing the correct Google Cloud project (tax-filing-app-3649f)

---

**Last Updated:** Based on current configuration  
**Package Name:** `com.creayaa.thegrowwell`  
**Project:** tax-filing-app-3649f (693306869303)

