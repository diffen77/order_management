/**
 * Utility functions for form validation
 */

/**
 * Check if a value is empty (null, undefined, empty string, or empty array)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validate an email address
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 compliant regex
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

/**
 * Validate a password (minimum requirements)
 * @param password Password to validate
 * @param minLength Minimum length (default: 8)
 * @param requireSpecialChar Require at least one special character (default: true)
 * @param requireNumber Require at least one number (default: true)
 * @param requireUppercase Require at least one uppercase letter (default: true)
 */
export const isValidPassword = (
  password: string,
  minLength = 8,
  requireSpecialChar = true,
  requireNumber = true,
  requireUppercase = true
): boolean => {
  if (password.length < minLength) return false;
  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  if (requireNumber && !/\d/.test(password)) return false;
  if (requireUppercase && !/[A-Z]/.test(password)) return false;
  return true;
};

/**
 * Validate a phone number
 */
export const isValidPhone = (phone: string): boolean => {
  // Basic validation - adjust for your specific requirements
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate a URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate a postal code (ZIP code)
 * Default pattern is for Swedish postal codes (5 digits)
 */
export const isValidPostalCode = (
  postalCode: string,
  pattern: RegExp = /^[0-9]{5}$/
): boolean => {
  return pattern.test(postalCode);
};

/**
 * Validate a credit card number using the Luhn algorithm
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  // Remove spaces and dashes
  const sanitizedNumber = cardNumber.replace(/[\s-]/g, '');
  
  // Check if it contains only digits
  if (!/^\d+$/.test(sanitizedNumber)) return false;
  
  // Check length (most card numbers are between 13-19 digits)
  if (sanitizedNumber.length < 13 || sanitizedNumber.length > 19) return false;
  
  // Luhn algorithm implementation
  let sum = 0;
  let shouldDouble = false;
  
  // Loop through values starting from the rightmost digit
  for (let i = sanitizedNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitizedNumber.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate a date string format (YYYY-MM-DD)
 */
export const isValidDateFormat = (dateStr: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  // Check if it's a valid date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  return true;
};

/**
 * Validate if a date is within a valid range
 */
export const isDateInRange = (
  dateStr: string,
  minDate?: string | Date,
  maxDate?: string | Date
): boolean => {
  if (!isValidDateFormat(dateStr)) return false;
  
  const date = new Date(dateStr);
  
  if (minDate) {
    const min = minDate instanceof Date ? minDate : new Date(minDate);
    if (date < min) return false;
  }
  
  if (maxDate) {
    const max = maxDate instanceof Date ? maxDate : new Date(maxDate);
    if (date > max) return false;
  }
  
  return true;
};

/**
 * Validate a number is within a specified range
 */
export const isNumberInRange = (
  value: number,
  min?: number,
  max?: number
): boolean => {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

/**
 * Validate a string matches a specific pattern
 */
export const matchesPattern = (
  value: string,
  pattern: RegExp
): boolean => {
  return pattern.test(value);
};

/**
 * Generate form validation error messages
 */
export const getValidationErrors = (formData: Record<string, any>, validationRules: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.entries(validationRules).forEach(([field, rules]) => {
    const value = formData[field];
    
    // Required check
    if (rules.required && isEmpty(value)) {
      errors[field] = rules.requiredMessage || 'This field is required';
      return;
    }
    
    // Skip other validations if empty and not required
    if (isEmpty(value) && !rules.required) return;
    
    // Validate email
    if (rules.email && !isValidEmail(value)) {
      errors[field] = rules.emailMessage || 'Invalid email address';
    }
    
    // Validate min length
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `Must be at least ${rules.minLength} characters`;
    }
    
    // Validate max length
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `Must be no more than ${rules.maxLength} characters`;
    }
    
    // Validate pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || 'Invalid format';
    }
    
    // Validate custom function
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return errors;
}; 