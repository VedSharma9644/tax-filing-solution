/**
 * Date utility functions for the mobile app
 * Handles various timestamp formats including Firestore timestamps
 */

/**
 * Format a timestamp to a readable date string
 * @param {any} timestamp - The timestamp to format (can be Date, string, Firestore timestamp, etc.)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, options = {}) => {
  if (!timestamp) return 'N/A';
  
  let date;
  
  // Handle Firestore Timestamp objects
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Firestore Timestamp serialized objects
  else if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  }
  // Handle regular Date objects or date strings
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  }
  // Handle timestamp in milliseconds
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  }
  else {
    console.warn('Unknown timestamp format:', timestamp);
    return 'Invalid Date';
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', timestamp);
    return 'Invalid Date';
  }
  
  // Default options
  const defaultOptions = {
    includeTime: false,
    format: 'short'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  if (finalOptions.includeTime) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  return date.toLocaleDateString();
};

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 * @param {any} timestamp - The timestamp to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let date;
  
  // Handle Firestore Timestamp objects
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Firestore Timestamp serialized objects
  else if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  }
  // Handle regular Date objects or date strings
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  }
  // Handle timestamp in milliseconds
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  }
  else {
    return 'Invalid Date';
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(timestamp);
  }
};

/**
 * Format a timestamp for display in admin notes
 * @param {any} timestamp - The timestamp to format
 * @returns {string} Formatted date string for admin notes
 */
export const formatAdminNoteDate = (timestamp) => {
  if (!timestamp) return 'Unknown date';
  
  let date;
  
  // Handle Firestore Timestamp objects
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Firestore Timestamp serialized objects
  else if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  }
  // Handle regular Date objects or date strings
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  }
  // Handle timestamp in milliseconds
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  }
  else {
    console.warn('Unknown timestamp format for admin note:', timestamp);
    return 'Invalid Date';
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date for admin note:', timestamp);
    return 'Invalid Date';
  }
  
  // Format for admin notes display
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
