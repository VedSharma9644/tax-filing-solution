# Image Viewing in Mobile App

## Overview
The mobile app now supports viewing encrypted images directly within the app instead of opening them in the browser. This provides a better user experience and maintains security.

## How It Works

### 1. Cached Images (Data URLs)
- Images that are already cached locally (starting with `data:`) are displayed immediately
- These images are shown as thumbnails with a "Tap to view" overlay
- Tapping opens a full-screen modal with zoom capabilities

### 2. Encrypted Images (Decryption URLs)
- Images that need to be decrypted are shown with an icon and "View Document" button
- When tapped, the app:
  - Shows a loading indicator
  - Fetches the decrypted image from the backend
  - Converts it to a data URL for display
  - Shows the image in a full-screen modal

### 3. Error Handling
- If image loading fails, an error message is displayed
- Users can retry by tapping the view button again
- Loading states are clearly indicated to the user

## Technical Implementation

### DocumentPreview Component
- Handles both cached and non-cached images
- Uses React Native's `Image` component for display
- Implements proper loading and error states
- Manages memory by clearing decrypted images when modal closes

### Backend Integration
- Uses the `/upload/view/:gcsPath` endpoint for decryption
- Sends proper headers for image content
- Handles authentication automatically

### Memory Management
- Decrypted images are stored as data URLs temporarily
- Memory is freed when the preview modal is closed
- Cache service manages long-term storage of frequently accessed images

## User Experience

### For Cached Images
1. User sees thumbnail immediately
2. Taps to view full-screen image
3. Can zoom and pan within the modal
4. Taps close to return to document list

### For Encrypted Images
1. User sees document icon with "View Document" button
2. Taps button to start loading
3. Sees loading indicator during decryption
4. Image appears in full-screen modal when ready
5. Can zoom and pan within the modal
6. Taps close to return to document list

## Benefits

1. **Better UX**: Images stay within the app
2. **Security**: Images remain encrypted until needed
3. **Performance**: Cached images load instantly
4. **Memory Efficient**: Temporary images are cleaned up
5. **Error Handling**: Clear feedback for failed loads

## Testing

To test the image viewing functionality:

1. Upload some images through the tax wizard
2. Go to Document Review screen
3. Try viewing both cached and non-cached images
4. Verify images open in the app modal, not browser
5. Test zoom and pan functionality
6. Test error handling with network issues
