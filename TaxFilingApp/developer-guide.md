# 📱 TaxFilingApp Developer Guide

## 🗂️ File Structure Overview

This guide explains which file contains code for which screen/functionality in the TaxFilingApp.

---

## 📱 **Main App Files**

| File | Purpose | Description |
|------|---------|-------------|
| `App.js` | Main App Entry | The root component that starts the entire application |
| `index.js` | App Registration | Registers the app with Expo and React Native |
| `app.json` | App Configuration | Contains app metadata, icons, permissions, and build settings |

---

## 🧭 **Navigation**

| File | Purpose | Description |
|------|---------|-------------|
| `navigation/AppNavigator.js` | Navigation Setup | Defines all the screens and how users navigate between them |

---

## 🖥️ **Main Screens**

### **Authentication & Onboarding**
| File | Screen | Description |
|------|--------|-------------|
| `screens/AuthScreen.tsx` | Login/Register Screen | Users enter email/phone and verify with OTP |
| `screens/ProfileSetup.tsx` | Profile Setup Screen | 3-step process to collect user personal information |

### **Main App Screens**
| File | Screen | Description |
|------|--------|-------------|
| `screens/Dashboard.tsx` | Home Dashboard | Main screen showing tax progress, quick actions, and notifications |
| `screens/Settings.tsx` | Settings Screen | User preferences, account settings, and app configuration |
| `screens/NotificationsScreen.tsx` | Notifications Screen | Shows all app notifications and alerts |

### **Tax Filing Process**
| File | Screen | Description |
|------|--------|-------------|
| `screens/TaxWizard.tsx` | Tax Filing Wizard | Main multi-step tax filing process (refactored into smaller components) |
| `screens/DocumentUpload.tsx` | Document Upload Screen | Upload tax documents like W-2s, receipts, etc. |
| `screens/DocumentReview.tsx` | Document Review Screen | Admin review interface for uploaded documents |

### **Payment & History**
| File | Screen | Description |
|------|--------|-------------|
| `screens/Payment.tsx` | Payment Screen | Process payments for tax filing services |
| `screens/PaymentHistoryScreen.tsx` | Payment History Screen | Shows all past payment transactions |

### **Support & Help**
| File | Screen | Description |
|------|--------|-------------|
| `screens/FAQHelpCenter.tsx` | FAQ & Help Center | Frequently asked questions and help articles |
| `screens/SupportRequestScreen.tsx` | Support Request Screen | Users can submit support tickets |
| `screens/FeedbackScreen.tsx` | Feedback Screen | Users can provide app feedback and ratings |
| `screens/AppointmentScreen.tsx` | Appointment Screen | Schedule appointments with tax professionals |
| `screens/TaxFilingGuide.tsx` | Tax Filing Guide Screen | Step-by-step guide on how to file taxes |

---

## 🧩 **Reusable Components**

### **Custom Components**
| File | Purpose | Description |
|------|---------|-------------|
| `components/CustomHeader.tsx` | Custom Header | Reusable header with back button, title, and avatar |
| `components/DatePicker.tsx` | Date Picker | Custom calendar component for date selection |
| `components/SafeAreaWrapper.tsx` | Safe Area Wrapper | Handles safe area for different device types |

### **UI Component Library**
| File | Purpose | Description |
|------|---------|-------------|
| `screens/ui/button.tsx` | Button Component | Customizable button with different variants |
| `screens/ui/card.tsx` | Card Component | Card container with header, content, and description |
| `screens/ui/input.tsx` | Input Component | Styled text input field |
| `screens/ui/progress.tsx` | Progress Bar | Visual progress indicator |
| `screens/ui/badge.tsx` | Badge Component | Status indicators and labels |
| `screens/ui/checkbox.tsx` | Checkbox Component | Checkbox input for forms |
| `screens/ui/switch.tsx` | Switch Component | Toggle switch for settings |
| `screens/ui/textarea.tsx` | Textarea Component | Multi-line text input |
| `screens/ui/form.tsx` | Form Components | Form field components with validation |

---

## 🔧 **TaxWizard Refactored Structure**

The TaxWizard has been broken down into smaller, manageable components:

### **Main TaxWizard Files**
| File | Purpose | Description |
|------|---------|-------------|
| `screens/TaxWizard/TaxWizard.tsx` | Main Wizard Controller | Orchestrates all 8 steps of the tax filing process |
| `screens/TaxWizard/hooks/useTaxWizard.ts` | Custom Hook | Manages all state and logic for the tax wizard |
| `screens/TaxWizard/types/index.ts` | TypeScript Types | All interfaces and types used in the wizard |
| `screens/TaxWizard/utils/documentUtils.ts` | Utility Functions | Helper functions for document handling |

### **TaxWizard Step Components**
| File | Step | Description |
|------|------|-------------|
| `screens/TaxWizard/components/Step1DocumentUpload.tsx` | Step 1 | Upload tax documents (W-2s, 1099s, receipts) |
| `screens/TaxWizard/components/Step2IncomeInfo.tsx` | Step 2 | Enter income information and calculations |
| `screens/TaxWizard/components/Step3Deductions.tsx` | Step 3 | Enter deductions and credits |
| `screens/TaxWizard/components/Step4Dependents.tsx` | Step 4 | Add dependent information (coming soon) |
| `screens/TaxWizard/components/Step5PreviousYear.tsx` | Step 5 | Previous year tax data (coming soon) |
| `screens/TaxWizard/components/Step6Homeowner.tsx` | Step 6 | Homeowner information (coming soon) |
| `screens/TaxWizard/components/Step7MedicalEducation.tsx` | Step 7 | Medical and education expenses (coming soon) |
| `screens/TaxWizard/components/Step8Review.tsx` | Step 8 | Final review and submission (coming soon) |

---

## 📁 **Assets & Resources**

| File/Folder | Purpose | Description |
|-------------|---------|-------------|
| `assets/icon.png` | App Icon | Main app icon displayed on device home screen |
| `assets/adaptive-icon.png` | Adaptive Icon | Android adaptive icon for different themes |
| `assets/splash-icon.png` | Splash Screen | Icon shown during app startup |
| `assets/hero-tax.jpg` | Hero Image | Background image for main screens |
| `assets/process-steps.jpg` | Process Image | Visual guide showing tax filing steps |
| `assets/favicon.png` | Web Favicon | Icon for web version of the app |

---

## ⚙️ **Configuration Files**

| File | Purpose | Description |
|------|---------|-------------|
| `package.json` | Dependencies | Lists all required packages and scripts |
| `tsconfig.json` | TypeScript Config | TypeScript compiler configuration |
| `eas.json` | Build Configuration | Expo Application Services build settings |

---

## 🤖 **Android Native Files**

| File | Purpose | Description |
|------|---------|-------------|
| `android/app/src/main/java/com/vedsharma9644/TaxFilingApp/MainActivity.kt` | Main Activity | Android app entry point |
| `android/app/src/main/java/com/vedsharma9644/TaxFilingApp/MainApplication.kt` | Main Application | Android app initialization |
| `android/app/src/main/AndroidManifest.xml` | Android Manifest | App permissions and configuration |
| `android/app/build.gradle` | Android Build Config | Android build settings and dependencies |

---

## 📊 **File Size Summary**

| Component | Original Size | Refactored Size | Improvement |
|-----------|---------------|-----------------|-------------|
| TaxWizard | 2,603 lines | ~150 lines main + modular components | 94% reduction |
| DocumentReview | 756 lines | Ready for refactoring | - |
| DocumentUpload | 519 lines | Ready for refactoring | - |
| Payment | 455 lines | Ready for refactoring | - |
| Settings | 427 lines | Ready for refactoring | - |

---

## 🚀 **Quick Navigation Tips**

### **To find code for a specific screen:**
1. Look in the `screens/` folder
2. Find the file with the screen name (e.g., `Dashboard.tsx` for dashboard)
3. For TaxWizard steps, check `screens/TaxWizard/components/`

### **To add a new screen:**
1. Create a new `.tsx` file in `screens/`
2. Add the screen to `navigation/AppNavigator.js`
3. Import and use UI components from `screens/ui/`

### **To modify existing functionality:**
1. Find the screen file in the table above
2. Make your changes
3. Test using `npx expo start`

---

## 📝 **Development Notes**

- **TypeScript**: All files use TypeScript for better code quality
- **Modular Design**: Large components are broken into smaller, reusable pieces
- **Consistent Styling**: All components use the same design system
- **Easy Testing**: Each component can be tested independently
- **Scalable**: Easy to add new features without affecting existing code

---

*Last Updated: September 2025*
*Total Files: 50+ components and screens*
