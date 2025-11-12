// src/utils/validators.js
import { VALIDATION } from './constants';

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      message: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long` 
    };
  }
  
  if (!VALIDATION.PASSWORD_REGEX.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    return { isValid: false, message: 'Username is required' };
  }
  
  if (username.length < VALIDATION.USERNAME_MIN_LENGTH) {
    return { 
      isValid: false, 
      message: `Username must be at least ${VALIDATION.USERNAME_MIN_LENGTH} characters long` 
    };
  }
  
  if (username.length > VALIDATION.USERNAME_MAX_LENGTH) {
    return { 
      isValid: false, 
      message: `Username cannot exceed ${VALIDATION.USERNAME_MAX_LENGTH} characters` 
    };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { 
      isValid: false, 
      message: 'Username can only contain letters, numbers, and underscores' 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0)) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export const validateLength = (value, min, max, fieldName = 'This field') => {
  if (!value) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  if (value.length < min) {
    return { 
      isValid: false, 
      message: `${fieldName} must be at least ${min} characters long` 
    };
  }
  
  if (max && value.length > max) {
    return { 
      isValid: false, 
      message: `${fieldName} cannot exceed ${max} characters` 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export const validateURL = (url) => {
  if (!url || url.trim() === '') {
    return { isValid: false, message: 'URL is required' };
  }
  
  try {
    new URL(url);
    return { isValid: true, message: '' };
  } catch (error) {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }
  
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return { isValid: false, message: 'Phone number must have at least 10 digits' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @returns {Object} Validation result
 */
export const validateDate = (date) => {
  if (!date) {
    return { isValid: false, message: 'Date is required' };
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Please enter a valid date' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate date range
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Object} Validation result
 */
export const validateDateRange = (startDate, endDate) => {
  const startValidation = validateDate(startDate);
  if (!startValidation.isValid) {
    return { isValid: false, message: 'Invalid start date' };
  }
  
  const endValidation = validateDate(endDate);
  if (!endValidation.isValid) {
    return { isValid: false, message: 'Invalid end date' };
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    return { isValid: false, message: 'Start date must be before end date' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate number
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export const validateNumber = (value, min = null, max = null, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }
  
  if (min !== null && num < min) {
    return { isValid: false, message: `${fieldName} must be at least ${min}` };
  }
  
  if (max !== null && num > max) {
    return { isValid: false, message: `${fieldName} cannot exceed ${max}` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFile = (file, options = {}) => {
  const { 
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    required = true 
  } = options;
  
  if (!file) {
    if (required) {
      return { isValid: false, message: 'File is required' };
    }
    return { isValid: true, message: '' };
  }
  
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { 
      isValid: false, 
      message: `File size cannot exceed ${maxSizeMB}MB` 
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation results
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    let result = { isValid: true, message: '' };
    
    // Required validation
    if (rule.required) {
      result = validateRequired(value, rule.label || field);
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        return;
      }
    }
    
    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return;
    
    // Email validation
    if (rule.type === 'email') {
      result = validateEmail(value);
    }
    
    // Password validation
    else if (rule.type === 'password') {
      result = validatePassword(value);
    }
    
    // URL validation
    else if (rule.type === 'url') {
      result = validateURL(value);
    }
    
    // Phone validation
    else if (rule.type === 'phone') {
      result = validatePhone(value);
    }
    
    // Date validation
    else if (rule.type === 'date') {
      result = validateDate(value);
    }
    
    // Number validation
    else if (rule.type === 'number') {
      result = validateNumber(value, rule.min, rule.max, rule.label || field);
    }
    
    // Length validation
    if (result.isValid && (rule.minLength || rule.maxLength)) {
      result = validateLength(value, rule.minLength || 0, rule.maxLength, rule.label || field);
    }
    
    // Custom validation
    if (result.isValid && rule.custom) {
      result = rule.custom(value, data);
    }
    
    if (!result.isValid) {
      errors[field] = result.message;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validate password match
 * @param {string} password - Password
 * @param {string} confirmPassword - Confirm password
 * @returns {Object} Validation result
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  
  return { isValid: true, message: '' };
};

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRequired,
  validateLength,
  validateURL,
  validatePhone,
  validateDate,
  validateDateRange,
  validateNumber,
  validateFile,
  validateForm,
  sanitizeHTML,
  validatePasswordMatch,
};
