import { get, post, put, del } from './api';
import { ApiResponse } from '../types/api';

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  customer_type: 'regular' | 'wholesale' | 'VIP';
  created_at: string;
  updated_at: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface CustomerPreferences {
  customer_id: string;
  preferences: Record<string, any>;
  updated_at: string;
}

/**
 * Get a list of all customers
 */
export const getCustomers = async (search?: string, customerType?: string): Promise<ApiResponse<Customer[]>> => {
  const params: Record<string, string> = {};
  
  if (search) {
    params.search = search;
  }
  
  if (customerType) {
    params.customer_type = customerType;
  }

  return get<Customer[]>('/api/customers', { params });
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (id: string): Promise<ApiResponse<Customer>> => {
  return get<Customer>(`/api/customers/${id}`);
};

/**
 * Create a new customer
 */
export const createCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Customer>> => {
  return post<Customer>('/api/customers', customer);
};

/**
 * Update an existing customer
 */
export const updateCustomer = async (id: string, customer: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiResponse<Customer>> => {
  return put<Customer>(`/api/customers/${id}`, customer);
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/api/customers/${id}`);
};

/**
 * Get customer order history
 */
export const getCustomerOrders = async (id: string): Promise<ApiResponse<any[]>> => {
  return get<any[]>(`/api/customers/${id}/orders`);
};

/**
 * Get customer notes
 */
export const getCustomerNotes = async (customerId: string): Promise<ApiResponse<CustomerNote[]>> => {
  return get<CustomerNote[]>(`/api/customers/${customerId}/notes`);
};

/**
 * Add customer note
 */
export const addCustomerNote = async (customerId: string, content: string): Promise<ApiResponse<CustomerNote>> => {
  return post<CustomerNote>(`/api/customers/${customerId}/notes`, { content });
};

/**
 * Get customer preferences
 */
export const getCustomerPreferences = async (customerId: string): Promise<ApiResponse<CustomerPreferences>> => {
  return get<CustomerPreferences>(`/api/customers/${customerId}/preferences`);
};

/**
 * Update customer preferences
 */
export const updateCustomerPreferences = async (customerId: string, preferences: Record<string, any>): Promise<ApiResponse<CustomerPreferences>> => {
  return put<CustomerPreferences>(`/api/customers/${customerId}/preferences`, { preferences });
}; 