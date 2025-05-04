/**
 * Utility functions for formatting values (dates, currency, etc.)
 */
import { DATE_FORMATS } from '../constants';

/**
 * Format a date using the specified format
 * @param date Date to format
 * @param format Format string (from DATE_FORMATS)
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number | null | undefined,
  format: string = DATE_FORMATS.DEFAULT
): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
    
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Simple formatter - replace with date-fns or other library in production
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case DATE_FORMATS.DATETIME:
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case DATE_FORMATS.TIME:
      return `${hours}:${minutes}`;
    case DATE_FORMATS.MONTH_YEAR:
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[dateObj.getMonth()]} ${year}`;
    case DATE_FORMATS.DEFAULT:
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currency Currency code (default: SEK)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency: string = 'SEK'
): string => {
  if (amount === null || amount === undefined) return 'N/A';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return 'Invalid amount';
  
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Format a number with thousands separators and decimal places
 * @param value Number to format
 * @param decimals Number of decimal places
 * @param locale Locale for formatting (default: 'sv-SE')
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | string | null | undefined,
  decimals: number = 0,
  locale: string = 'sv-SE'
): string => {
  if (value === null || value === undefined) return 'N/A';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'Invalid number';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
};

/**
 * Format a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted file size string
 */
export const formatFileSize = (
  bytes: number | null | undefined,
  decimals: number = 1
): string => {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format a value with a plural suffix based on count
 * @param count The count value
 * @param singular Singular form
 * @param plural Plural form
 * @returns Correctly pluralized string
 */
export const pluralize = (
  count: number,
  singular: string,
  plural: string = `${singular}s`
): string => {
  return count === 1 ? singular : plural;
};

/**
 * Format a value as a percentage
 * @param value Value to format (0-1)
 * @param decimals Decimal places to show
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number | string | null | undefined,
  decimals: number = 0
): string => {
  if (value === null || value === undefined) return 'N/A';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'Invalid percentage';
  
  return `${formatNumber(numValue * 100, decimals)}%`;
};

/**
 * Truncate a string to the specified length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @param suffix Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export const truncate = (
  str: string | null | undefined,
  maxLength: number = 50,
  suffix: string = '...'
): string => {
  if (!str) return '';
  return str.length > maxLength ? `${str.substring(0, maxLength)}${suffix}` : str;
};

/**
 * Convert snake_case or kebab-case to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}; 