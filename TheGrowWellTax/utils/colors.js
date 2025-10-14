/**
 * Centralized Color Constants for TaxFilingApp
 * 
 * This file contains all color definitions used throughout the application.
 * Import specific colors to maintain consistency across screens.
 */

export const Colors = {
  // Background Colors
  background: {
    primary: '#ffffff',           // White background for cards
    secondary: '#001826',         // Dark background for main screen
    tertiary: '#e9ecef',         // Medium gray background
    dark: '#343a40',            // Dark background
  },

  // Text Colors
  text: {
    primary: '#001826',           // Dark text
    secondary: '#666666',         // Medium gray text
    tertiary: '#999999',          // Light gray text
    light: '#cccccc',             // Very light gray text
    white: '#ffffff',             // White text
  },

  // Brand Colors
  brand: {
    primary: '#0E502B',         // Primary green
    secondary: '#6c757d',      // Secondary gray
    success: '#28a745',        // Success green
    danger: '#dc3545',         // Danger red
    warning: '#ffc107',         // Warning yellow
    info: '#17a2b8',           // Info cyan
  },

  // Border Colors
  border: {
    light: '#e9ecef',          // Light border
    medium: '#dee2e6',         // Medium border
    dark: '#ced4da',           // Dark border
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(0,0,0,0.1)',  // Light shadow
    medium: 'rgba(0,0,0,0.2)', // Medium shadow
    dark: 'rgba(0,0,0,0.3)',   // Dark shadow
  }
};

// Export commonly used background colors for easy access
export const BackgroundColors = Colors.background;

// Export commonly used text colors for easy access
export const TextColors = Colors.text;

// Export brand colors for easy access
export const BrandColors = Colors.brand;
