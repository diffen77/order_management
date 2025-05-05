/**
 * Order service for order-related operations.
 */
import { get, post, put, patch, del } from './api';
import { PaginatedResponse, RequestParams } from '../types/api';
import { Order, OrderStatus } from '../types/models';
import { API_ENDPOINTS } from '../constants';

/**
 * Order history item
 */
export interface OrderHistoryItem {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  note?: string;
  user: string;
  previousStatus?: OrderStatus;
}

/**
 * Order note type
 */
export interface OrderNote {
  id?: string;
  orderId: string;
  content: string;
  isInternal?: boolean;
  timestamp?: string;
  user?: string;
}

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
export const updateOrderStatus = async (id: string, status: OrderStatus, note?: string): Promise<Order> => {
  const response = await patch<Order>(`${API_ENDPOINTS.ORDERS}/${id}/status`, { status, notes: note });
  return response.data;
};

/**
 * Delete an order (usually just marks as cancelled)
 */
export const cancelOrder = async (id: string, reason?: string): Promise<void> => {
  await patch(`${API_ENDPOINTS.ORDERS}/${id}/cancel`, { reason });
};

/**
 * Get order history (status changes)
 */
export const getOrderHistory = async (id: string): Promise<OrderHistoryItem[]> => {
  const response = await get<OrderHistoryItem[]>(`${API_ENDPOINTS.ORDERS}/${id}/history`);
  return response.data;
};

/**
 * Get order timeline (formatted for UI display)
 */
export const getOrderTimeline = async (id: string): Promise<OrderHistoryItem[]> => {
  const response = await get<OrderHistoryItem[]>(`${API_ENDPOINTS.ORDERS}/${id}/timeline`);
  return response.data;
};

/**
 * Add a note to an order
 */
export const addOrderNote = async (orderId: string, note: OrderNote): Promise<OrderNote> => {
  const response = await post<OrderNote>(`${API_ENDPOINTS.ORDERS}/${orderId}/notes`, note);
  return response.data;
};

/**
 * Get available status transitions for an order
 */
export const getAvailableStatusTransitions = async (orderId: string): Promise<OrderStatus[]> => {
  const response = await get<OrderStatus[]>(`${API_ENDPOINTS.ORDERS}/${orderId}/status/transitions`);
  return response.data;
};

/**
 * Get orders by customer
 */
export const getOrdersByCustomer = async (customerId: string, params?: Partial<RequestParams>): Promise<PaginatedResponse<Order>> => {
  const response = await get<PaginatedResponse<Order>>(`${API_ENDPOINTS.CUSTOMERS}/${customerId}/orders`, { params });
  return response.data;
}; 