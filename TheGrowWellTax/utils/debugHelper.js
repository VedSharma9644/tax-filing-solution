/**
 * Simple debugging utility for tracking user data flow
 * This helps ensure user IDs are properly passed through the system
 */

export const logUserFlow = (step, userId, additionalData = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [${timestamp}] ${step}:`, {
    userId: userId || 'NO_USER_ID',
    ...additionalData
  });
};

export const validateUserId = (userId, context) => {
  if (!userId) {
    console.error(`❌ Missing user ID in ${context}`);
    return false;
  }
  
  if (userId === 'temp-user-id') {
    console.error(`❌ Still using hardcoded temp-user-id in ${context}`);
    return false;
  }
  
  console.log(`✅ Valid user ID in ${context}: ${userId}`);
  return true;
};

export const logUploadFlow = (userId, category, fileName) => {
  console.log(`📤 Upload Flow:`, {
    userId,
    category,
    fileName,
    timestamp: new Date().toISOString()
  });
};
