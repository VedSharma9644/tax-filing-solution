# Demo Account Credentials for Play Store Reviewers

## Demo Account Information

For Play Store reviewers and testing purposes, please use the following demo account credentials:

**Email:** `demo@growwelltax.com`  
**Password:** `Demo123!`

## How to Create the Demo Account

The demo account should be created in Firebase Authentication before submitting to the Play Store. Follow these steps:

### Option 1: Create via Firebase Console
1. Go to Firebase Console (https://console.firebase.google.com/)
2. Select your project: `tax-filing-app-3649f`
3. Navigate to **Authentication** > **Users**
4. Click **Add user**
5. Enter:
   - Email: `demo@growwelltax.com`
   - Password: `Demo123!`
   - Uncheck "Send password reset email" (optional)
6. Click **Add user**

### Option 2: Create via App (First Time Setup)
1. Open the app
2. Select **Email** tab
3. Select **Sign Up**
4. Enter:
   - Email: `demo@growwelltax.com`
   - Password: `Demo123!`
   - Confirm Password: `Demo123!`
5. Click **Create Account**
6. The account will be created in Firebase and Firestore automatically

## Testing Instructions for Reviewers

1. **Login:**
   - Open the app
   - Select **Email** tab (default)
   - Select **Login** (if not already selected)
   - Enter email: `demo@growwelltax.com`
   - Enter password: `Demo123!`
   - Click **Sign In**

2. **Account Features:**
   - The demo account has full access to all app features
   - You can test tax form submission, document upload, profile setup, etc.
   - All data created will be stored in the Firebase database

## Notes

- The demo account password follows security best practices (minimum 6 characters, includes uppercase, lowercase, and special character)
- The account is created in Firebase Authentication and will be automatically synced with Firestore
- Email verification is optional for demo accounts
- The account can be used by multiple reviewers simultaneously

## Security

- The demo account is intended for testing purposes only
- Do not use this account for production data
- Consider resetting or disabling the demo account after review period if needed

