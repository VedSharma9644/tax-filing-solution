// Input validation and sanitization utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateOTP = (otp) => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
  return nameRegex.test(name.trim());
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeProfileData = (data) => {
  const sanitized = {};
  
  if (data.firstName) {
    sanitized.firstName = sanitizeInput(data.firstName);
  }
  
  if (data.lastName) {
    sanitized.lastName = sanitizeInput(data.lastName);
  }
  
  if (data.email) {
    sanitized.email = sanitizeInput(data.email).toLowerCase();
  }
  
  if (data.phone) {
    sanitized.phone = sanitizeInput(data.phone);
  }
  
  return sanitized;
};
