/**
 * Order service for order-related operations.
 */
import { get, post, put, patch, del } from './api';
import { PaginatedResponse, RequestParams } from '../types/api';
import { Order, OrderStatus } from '../types/models';
import { API_ENDPOINTS } from '../constants';

/**
 * Get a list of orders with optional filtering, pagination, and sorting
 */
export const getOrders = async (params?: Partial<RequestParams>): Promise<PaginatedResponse<Order>> => {
  const response = await get<PaginatedResponse<Order>>(API_ENDPOINTS.ORDERS, { params });
  return response.data;
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (id: string): Promise<Order> => {
  const response = await get<Order>(`${API_ENDPOINTS.ORDERS}/${id}`);
  return response.data;
};

/**
 * Create a new order
 */
export const createOrder = async (orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
  const response = await post<Order>(API_ENDPOINTS.ORDERS, orderData);
  return response.data;
};

/**
 * Update an existing order
 */
export const updateOrder = async (id: string, orderData: Partial<Order>): Promise<Order> => {
  const response = await put<Order>(`${API_ENDPOINTS.ORDERS}/${id}`, orderData);
  return response.data;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
  const response = await patch<Order>(`${API_ENDPOINTS.ORDERS}/${id}/status`, { status });
  return response.data;
};

/**
 * Delete an order (usually just marks as cancelled)
 */
export const cancelOrder = async (id: string, reason?: string): Promise<void> => {
  await patch(`${API_ENDPOINTS.ORDERS}/${id}/cancel`, { reason });
};

/**
 * Get orders by customer
 */
export const getOrdersByCustomer = async (customerId: string, params?: Partial<RequestParams>): Promise<PaginatedResponse<Order>> => {
  const response = await get<PaginatedResponse<Order>>(`${API_ENDPOINTS.CUSTOMERS}/${customerId}/orders`, { params });
  return response.data;
}; 