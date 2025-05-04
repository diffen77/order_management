/**
 * API related types for requests, responses, and error handling.
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

/**
 * Standard error response format
 */
export interface ApiError {
  message: string;
  error: string;
  path?: string;
  detail?: any;
  status?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Sorting parameters
 */
export interface SortParams {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

/**
 * Filter parameters base interface
 */
export interface FilterParams {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Standard request parameters combining pagination, sorting, and filtering
 */
export interface RequestParams extends PaginationParams, SortParams {
  filters?: FilterParams;
} 