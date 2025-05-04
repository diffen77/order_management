/**
 * Business model type definitions.
 */

/**
 * Order status
 */
export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

/**
 * Product model
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  inventoryCount: number;
  categoryId: string;
  imageUrls: string[];
  isActive: boolean;
  producerId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order model
 */
export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order item model
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku: string;
}

/**
 * Customer model
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  defaultShippingAddress?: Address;
  defaultBillingAddress?: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Address model
 */
export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

/**
 * Custom form model
 */
export interface CustomForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  producerId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form field model
 */
export interface FormField {
  id: string;
  formId: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date';
  label: string;
  placeholder?: string;
  defaultValue?: string;
  isRequired: boolean;
  options?: string[]; // For select, checkbox, radio
  validation?: string; // Validation pattern or rules
  order: number;
} 