/**
 * Application-wide constants.
 */

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  
  // Users
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  
  // Products
  PRODUCTS: '/api/products',
  
  // Orders
  ORDERS: '/api/orders',
  
  // Customers
  CUSTOMERS: '/api/customers',
  
  // Forms
  FORMS: '/api/forms',
  
  // Statistics
  STATISTICS: '/api/statistics',
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  CART: 'cart',
  RECENT_PRODUCTS: 'recentProducts',
  USER_PREFERENCES: 'userPreferences',
};

/**
 * Page routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  FORMS: '/forms',
  STATISTICS: '/statistics',
  CUSTOMERS: '/customers',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
};

/**
 * Date formats
 */
export const DATE_FORMATS = {
  DEFAULT: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  TIME: 'HH:mm',
  MONTH_YEAR: 'MMMM YYYY',
  SHORT_DATE: 'DD/MM/YYYY',
  ISO_DATE: 'YYYY-MM-DD',
  TIMESTAMP: 'YYYY-MM-DDTHH:mm:ss',
  RELATIVE: 'relative',
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
};

/**
 * Max file upload size in bytes
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Responsive breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  XS: 0,     // Extra small devices (portrait phones)
  SM: 576,   // Small devices (landscape phones)
  MD: 768,   // Medium devices (tablets)
  LG: 992,   // Large devices (desktops)
  XL: 1200,  // Extra large devices (large desktops)
  XXL: 1400, // Extra extra large devices
};

/**
 * Media queries for responsive design
 * Usage with useMediaQuery hook: const isDesktop = useMediaQuery(MEDIA_QUERIES.DESKTOP);
 */
export const MEDIA_QUERIES = {
  XS: `(min-width: ${BREAKPOINTS.XS}px)`,
  SM: `(min-width: ${BREAKPOINTS.SM}px)`,
  MD: `(min-width: ${BREAKPOINTS.MD}px)`,
  LG: `(min-width: ${BREAKPOINTS.LG}px)`,
  XL: `(min-width: ${BREAKPOINTS.XL}px)`,
  XXL: `(min-width: ${BREAKPOINTS.XXL}px)`,
  MOBILE: `(max-width: ${BREAKPOINTS.MD - 1}px)`,
  TABLET: `(min-width: ${BREAKPOINTS.MD}px) and (max-width: ${BREAKPOINTS.LG - 1}px)`,
  DESKTOP: `(min-width: ${BREAKPOINTS.LG}px)`,
  DARK_MODE: '(prefers-color-scheme: dark)',
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Form validation regex patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  URL: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SWEDISH_POSTAL_CODE: /^[0-9]{5}$/,
  PHONE: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  ALPHA_NUMERIC: /^[a-zA-Z0-9]*$/,
  NUMBERS_ONLY: /^[0-9]*$/,
  DECIMAL_NUMBER: /^\d*(\.\d+)?$/,
}; 