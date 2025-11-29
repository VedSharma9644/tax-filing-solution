# GrowWell Tax Website

Desktop-optimized web version of the GrowWell Tax application.

## Tech Stack

- **React** - UI library
- **Webpack** - Module bundler
- **Babel** - JavaScript compiler
- **Firebase** - Authentication (Phone, Email/Password, Google Sign-In)

## Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Firebase Configuration

**IMPORTANT**: You need to configure Firebase for web:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `tax-filing-app-3649f`
3. Go to Project Settings > Your apps > Add app > Web
4. Copy the Firebase config
5. Update `src/config/firebase.js` with your actual config values:
   - `apiKey`
   - `appId`

## Development

Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`

## Build

Create a production build:

```bash
npm run build
```

The built files will be in the `dist` folder.

## Backend

This website uses the same backend as the mobile app:
- Backend URL: `https://tax-filing-backend-693306869303.us-central1.run.app`

## Authentication Methods

1. **Phone Number** - Firebase Phone Authentication with OTP
2. **Email/Password** - Firebase Email/Password Authentication
3. **Google Sign-In** - Google OAuth authentication

All authentication methods connect to the same backend as the mobile app.

## Design

The design matches the mobile app's layout and colors:
- Background: `#001826` (dark)
- Primary brand: `#0E502B` (green)
- Card background: `#ffffff` (white)

## Project Structure

```
Website/
├── src/
│   ├── components/
│   │   ├── LoginPage.js      # Main login component
│   │   └── LoginPage.css     # Login page styles
│   ├── config/
│   │   ├── firebase.js       # Firebase configuration
│   │   └── api.js            # API service
│   ├── utils/
│   │   └── colors.js         # Color constants
│   ├── App.js                # Main app component
│   ├── App.css               # App styles
│   ├── index.js              # Entry point
│   └── index.css             # Global styles
├── public/
│   └── index.html            # HTML template
├── package.json
├── webpack.config.js
└── babel.config.js
```
