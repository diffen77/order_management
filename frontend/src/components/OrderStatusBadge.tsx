import React from 'react';
import { Chip } from '@mui/material';
import { OrderStatus } from '../types/models';

// Status chip color mapping
const statusColors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  'new': 'info',
  'pending': 'secondary', 
  'processing': 'primary',
  'shipped': 'warning',
  'delivered': 'success',
  'cancelled': 'error',
  'returned': 'error'
};

// Status text mapping for better display names
const statusText: Record<OrderStatus, string> = {
  'new': 'New',
  'pending': 'Pending',
  'processing': 'Processing',
  'shipped': 'Shipped',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
  'returned': 'Returned'
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
  className?: string;
}

/**
 * A reusable component for displaying order status with appropriate color coding
 */
const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  size = 'small',
  className
}) => {
  // Handle unknown statuses gracefully
  const color = statusColors[status] || 'default';
  const label = statusText[status] || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <Chip 
      label={label}
      color={color}
      size={size}
      className={className}
    />
  );
};

export default OrderStatusBadge; 