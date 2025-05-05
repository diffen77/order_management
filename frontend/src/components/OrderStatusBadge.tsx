import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { OrderStatus } from '../types/models';

// Map order status to color and label
const STATUS_MAP: Record<OrderStatus, { color: ChipProps['color']; label: string }> = {
  'new': { color: 'default', label: 'New' },
  'pending': { color: 'info', label: 'Pending' },
  'processing': { color: 'primary', label: 'Processing' },
  'shipped': { color: 'primary', label: 'Shipped' },
  'delivered': { color: 'success', label: 'Delivered' },
  'cancelled': { color: 'error', label: 'Cancelled' },
  'returned': { color: 'warning', label: 'Returned' }
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
  const { color, label } = STATUS_MAP[status] || { color: 'default', label: status };
  
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