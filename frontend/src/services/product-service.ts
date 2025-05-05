/**
 * Product service for product-related operations.
 */
import { get, post, put, del } from './api';
import { PaginatedResponse, RequestParams } from '../types/api';
import { Product } from '../types/models';
import { API_ENDPOINTS } from '../constants';

/**
 * Get a list of products with optional filtering, pagination, and sorting
 */
export const getProducts = async (params?: Partial<RequestParams>): Promise<PaginatedResponse<Product>> => {
  const response = await get<PaginatedResponse<Product>>(API_ENDPOINTS.PRODUCTS, { params });
  return response.data;
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id: string): Promise<Product> => {
  const response = await get<Product>(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  return response.data;
};

/**
 * Create a new product
 */
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  const response = await post<Product>(API_ENDPOINTS.PRODUCTS, productData);
  return response.data;
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  const response = await put<Product>(`${API_ENDPOINTS.PRODUCTS}/${id}`, productData);
  return response.data;
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  await del(`${API_ENDPOINTS.PRODUCTS}/${id}`);
};

/**
 * Update product inventory
 */
export const updateInventory = async (id: string, quantity: number): Promise<Product> => {
  const response = await put<Product>(`${API_ENDPOINTS.PRODUCTS}/${id}/inventory`, { quantity });
  return response.data;
};

/**
 * Get inventory levels for all products
 */
export const getInventory = async (): Promise<any[]> => {
  const response = await get<any[]>(`${API_ENDPOINTS.PRODUCTS}/inventory`);
  return response.data;
};

/**
 * Adjust inventory level for a specific product
 */
export const adjustInventory = async (productId: string, quantity: number): Promise<any> => {
  const response = await post<any>(`${API_ENDPOINTS.PRODUCTS}/inventory/adjust`, { product_id: productId, quantity });
  return response.data;
}; 