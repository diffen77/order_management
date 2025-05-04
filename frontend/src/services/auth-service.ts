/**
 * Authentication service for login, register, and token management.
 */
import { get, post } from './api';
import { ApiResponse } from '../types/api';
import { LoginRequest, RegisterRequest, UserProfile } from '../types/auth';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';

/**
 * Login user with email and password
 */
export const login = async (credentials: LoginRequest): Promise<UserProfile> => {
  const response = await post<{ user: UserProfile; token: string }>(API_ENDPOINTS.LOGIN, credentials);
  
  if (response.data?.token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
  }
  
  return response.data.user;
};

/**
 * Register a new user
 */
export const register = async (userData: RegisterRequest): Promise<UserProfile> => {
  const response = await post<{ user: UserProfile; token: string }>(API_ENDPOINTS.REGISTER, userData);
  
  if (response.data?.token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
  }
  
  return response.data.user;
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await post(API_ENDPOINTS.LOGOUT);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

/**
 * Get the current user profile
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const response = await get<UserProfile>(API_ENDPOINTS.USER_PROFILE);
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Get the auth token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}; 