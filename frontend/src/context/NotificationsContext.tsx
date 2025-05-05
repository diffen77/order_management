import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Alert, 
  Snackbar, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  LocalShipping as ShippingIcon,
  Assignment as ProcessingIcon,
  CheckCircle as DeliveredIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  ArrowRight as ArrowRightIcon
} from '@mui/icons-material';
import { OrderStatus } from '../types/models';
import { useNavigate } from 'react-router-dom';

// Define notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  orderId?: string;
  timestamp: string;
  orderStatus?: OrderStatus;
}

// Context type
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  addOrderNotification: (
    orderId: string, 
    title: string, 
    message: string, 
    status?: OrderStatus
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  NotificationsBadge: React.FC;
}

// Create context
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Provider component
export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  
  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Load notifications from localStorage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (err) {
        console.error('Failed to parse stored notifications:', err);
        localStorage.removeItem('notifications');
      }
    }
  }, []);
  
  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // Generic add notification function
  const addNotification = (
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error', 
    title: string,
    orderId?: string,
    orderStatus?: OrderStatus
  ) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      read: false,
      orderId,
      timestamp: new Date().toISOString(),
      orderStatus
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Also show as snackbar for immediate feedback
    setSnackbar({
      open: true,
      message,
      severity: type
    });
  };
  
  // Specific notification functions
  const showSuccess = (message: string) => {
    addNotification(message, 'success', 'Success');
  };
  
  const showError = (message: string) => {
    addNotification(message, 'error', 'Error');
  };
  
  const showInfo = (message: string) => {
    addNotification(message, 'info', 'Information');
  };
  
  const showWarning = (message: string) => {
    addNotification(message, 'warning', 'Warning');
  };
  
  // Add order-specific notification
  const addOrderNotification = (
    orderId: string, 
    title: string, 
    message: string, 
    status?: OrderStatus
  ) => {
    addNotification(message, 'info', title, orderId, status);
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate to order if it has an orderId
    if (notification.orderId) {
      navigate(`/orders/${notification.orderId}`);
    }
    
    // Close menu
    handleMenuClose();
  };
  
  // Get icon based on notification
  const getNotificationIcon = (notification: Notification) => {
    if (notification.orderStatus) {
      switch (notification.orderStatus) {
        case 'processing':
          return <ProcessingIcon color="primary" />;
        case 'shipped':
          return <ShippingIcon color="primary" />;
        case 'delivered':
          return <DeliveredIcon color="success" />;
        case 'cancelled':
          return <CancelIcon color="error" />;
        default:
          return <InfoIcon color="info" />;
      }
    }
    
    // Default icons for non-order notifications
    switch (notification.type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Cancel color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHrs / 24);
    
    if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Notifications Badge component
  const NotificationsBadge: React.FC = () => (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleMenuOpen} 
        aria-label={`${unreadCount} unread notifications`}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            width: 320,
            maxHeight: 400
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                onClick={markAllAsRead}
                sx={{ mr: 1 }}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                size="small" 
                onClick={clearNotifications}
                color="error"
              >
                Clear all
              </Button>
            )}
          </Box>
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map(notification => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  button 
                  onClick={() => handleNotificationClick(notification)} 
                  sx={{ 
                    bgcolor: notification.read ? 'inherit' : 'action.hover',
                    py: 1
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle2" noWrap>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.timestamp)}
                        </Typography>
                      </>
                    } 
                  />
                  {notification.orderId && (
                    <ArrowRightIcon color="action" fontSize="small" />
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
  
  // Context value
  const contextValue: NotificationsContextType = {
    notifications,
    unreadCount,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    addOrderNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    NotificationsBadge
  };
  
  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationsContext.Provider>
  );
};

// Hook for using the notifications context
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export default NotificationsContext; 