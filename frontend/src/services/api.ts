/**
 * Base API client for making HTTP requests.
 */
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse } from '../types/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      error: 'Unknown Error',
      status: error.response?.status
    };
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const data = error.response.data as any;
      apiError.message = data.message || apiError.message;
      apiError.error = data.error || apiError.error;
      apiError.path = data.path;
      apiError.detail = data.detail;
      
      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/auth/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      apiError.message = 'No response received from server';
      apiError.error = 'Network Error';
    } else {
      // Something happened in setting up the request that triggered an Error
      apiError.message = error.message;
      apiError.error = 'Request Error';
    }
    
    return Promise.reject(apiError);
  }
);

/**
 * Generic GET request
 */
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Generic POST request
 */
export const post = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Generic PUT request
 */
export const put = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Generic PATCH request
 */
export const patch = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.patch(url, data, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Generic DELETE request
 */
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient; 