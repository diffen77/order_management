/**
 * Category service for category-related operations.
 */
import { get, post, put, del } from './api';
import { API_ENDPOINTS } from '../constants';

/**
 * Get all product categories
 */
export const getCategories = async (): Promise<string[]> => {
  const response = await get<string[]>(`${API_ENDPOINTS.PRODUCTS}/categories`);
  return response.data;
};

/**
 * Add a new category
 */
export const addCategory = async (category: string): Promise<string> => {
  const response = await post<string>(`${API_ENDPOINTS.PRODUCTS}/categories`, { name: category });
  return response.data;
};

/**
 * Update a category
 */
export const updateCategory = async (oldName: string, newName: string): Promise<string> => {
  const response = await put<string>(`${API_ENDPOINTS.PRODUCTS}/categories/${encodeURIComponent(oldName)}`, { name: newName });
  return response.data;
};

/**
 * Delete a category
 */
export const deleteCategory = async (category: string): Promise<void> => {
  await del(`${API_ENDPOINTS.PRODUCTS}/categories/${encodeURIComponent(category)}`);
}; 