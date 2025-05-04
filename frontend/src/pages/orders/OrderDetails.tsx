import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getOrderById, 
  updateOrderStatus, 
  cancelOrder 
} from '../../services/order-service';
import { Order, OrderItem, OrderStatus } from '../../types/models';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  Breadcrumbs
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  Timeline as TimelineIcon,
  AddComment as AddCommentIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';

// Format date
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Format currency
const formatCurrency = (amount: number, currency: string = 'SEK') => {
  return new Intl.NumberFormat('sv-SE', { 
    style: 'currency', 
    currency 
  }).format(amount);
};

// Define the possible order status transitions for UI
const statusSteps = [
  { status: 'new', label: 'New Order' },
  { status: 'pending', label: 'Pending' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' }
];

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getOrderById(id);
        setOrder(data);
        
        // Get valid next statuses from the backend
        // This is mocked here, but would normally come from the API
        if (data.status) {
          // In a real app, this would come from an API call to get valid transitions
          const mockNextStatuses: Record<string, string[]> = {
            'new': ['pending', 'cancelled'],
            'pending': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'returned'],
            'delivered': ['returned'],
            'cancelled': [],
            'returned': []
          };
          setAvailableStatuses(mockNextStatuses[data.status as OrderStatus] || []);
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id]);
  
  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!id) return;
    
    try {
      setStatusLoading(true);
      await cancelOrder(id, cancelReason);
      
      // Refetch the order to get updated status
      const updatedOrder = await getOrderById(id);
      setOrder(updatedOrder);
      
      setCancelDialogOpen(false);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError('Failed to cancel order.');
    } finally {
      setStatusLoading(false);
    }
  };
  
  // Handle status change
  const handleStatusChange = async () => {
    if (!id || !newStatus) return;
    
    try {
      setStatusLoading(true);
      await updateOrderStatus(id, newStatus, statusNote);
      
      // Refetch the order to get updated status
      const updatedOrder = await getOrderById(id);
      setOrder(updatedOrder);
      
      setStatusDialogOpen(false);
      setNewStatus('');
      setStatusNote('');
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status.');
    } finally {
      setStatusLoading(false);
    }
  };
  
  // Calculate current step for the stepper
  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return statusSteps.findIndex(step => step.status === order.status);
  };
  
  // Determine if order can be cancelled (not in terminal states)
  const canBeCancelled = order && !['cancelled', 'delivered', 'returned'].includes(order.status);
  
  // Calculate order summary
  const getItemsCount = () => {
    if (!order?.items) return 0;
    return order.items.reduce((total, item) => total + item.quantity, 0);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/orders"
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          Order not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/orders"
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          Dashboard
        </Link>
        <Link to="/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
          Orders
        </Link>
        <Typography color="textPrimary">Order Details</Typography>
      </Breadcrumbs>
      
      {/* Header bar with actions */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link}
            to="/orders"
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" component="h1">
            Order #{id?.substring(0, 8)}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Print Order">
            <IconButton sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Order">
            <IconButton 
              component={Link} 
              to={`/orders/${id}/edit`} 
              sx={{ mr: 1 }}
              disabled={['cancelled', 'delivered', 'returned'].includes(order.status)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel Order">
            <span> {/* Wrap in span to make tooltip work with disabled button */}
              <IconButton 
                onClick={() => setCancelDialogOpen(true)} 
                disabled={!canBeCancelled}
                color="error"
              >
                <CancelIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Order Status Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Order Status</Typography>
          <Box>
            <OrderStatusBadge status={order.status as OrderStatus} size="medium" />
            <Button 
              startIcon={<TimelineIcon />} 
              component={Link}
              to={`/orders/${id}/timeline`}
              sx={{ ml: 2 }}
            >
              View Timeline
            </Button>
            {availableStatuses.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setStatusDialogOpen(true)}
                sx={{ ml: 2 }}
                disabled={statusLoading}
              >
                Update Status
              </Button>
            )}
          </Box>
        </Box>
        <Stepper activeStep={getCurrentStepIndex()} alternativeLabel>
          {statusSteps.map((step) => (
            <Step key={step.status} completed={
              statusSteps.findIndex(s => s.status === step.status) < 
              statusSteps.findIndex(s => s.status === order.status)
            }>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {order.status === 'cancelled' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            This order has been cancelled.
          </Alert>
        )}
        {order.status === 'returned' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This order has been returned.
          </Alert>
        )}
      </Paper>
      
      {/* Order summary and customer info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Order Summary" />
            <CardContent>
              <Typography variant="body2" gutterBottom>
                <strong>Order ID:</strong> {order.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Date:</strong> {formatDate(order.createdAt)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Items:</strong> {getItemsCount()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total:</strong> {formatCurrency(order.totalAmount, order.currency)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Payment Status:</strong> <Chip 
                  size="small"
                  label={order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  color={
                    order.paymentStatus === 'paid' ? 'success' :
                    order.paymentStatus === 'pending' ? 'warning' :
                    order.paymentStatus === 'refunded' ? 'info' : 'error'
                  }
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Customer Information" />
            <CardContent>
              <Typography variant="body2" gutterBottom>
                <strong>Customer ID:</strong> {order.customerId}
              </Typography>
              {order.shippingAddress && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Shipping Address:</Typography>
                  <Typography variant="body2">
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                    {order.shippingAddress.country}
                  </Typography>
                </>
              )}
              {order.billingAddress && order.billingAddress !== order.shippingAddress && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Billing Address:</Typography>
                  <Typography variant="body2">
                    {order.billingAddress.street}<br />
                    {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}<br />
                    {order.billingAddress.country}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Order items */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Order Items" />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items && order.items.map((item: OrderItem) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{item.productName}</Typography>
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell align="right">{formatCurrency(item.unitPrice, order.currency)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.totalPrice, order.currency)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell align="right">
                  <Typography variant="subtitle1"><strong>Total</strong></Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1"><strong>{formatCurrency(order.totalAmount, order.currency)}</strong></Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      {/* Notes section */}
      <Card>
        <CardHeader 
          title="Notes" 
          action={
            <Button 
              startIcon={<AddCommentIcon />}
              variant="outlined"
              disabled={['cancelled', 'returned'].includes(order.status)}
            >
              Add Note
            </Button>
          }
        />
        <CardContent>
          {order.notes ? (
            <Typography variant="body2">{order.notes}</Typography>
          ) : (
            <Typography variant="body2" color="textSecondary">No notes available for this order.</Typography>
          )}
        </CardContent>
      </Card>
      
      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for cancellation"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            No, Keep Order
          </Button>
          <Button 
            onClick={handleCancelOrder} 
            color="error" 
            variant="contained"
            disabled={statusLoading}
          >
            {statusLoading ? <CircularProgress size={24} /> : 'Yes, Cancel Order'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Change the status of this order.
          </DialogContentText>
          <TextField
            select
            label="New Status"
            fullWidth
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mt: 2 }}
          >
            {availableStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Notes (optional)"
            fullWidth
            multiline
            rows={3}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChange} 
            color="primary" 
            variant="contained"
            disabled={!newStatus || statusLoading}
          >
            {statusLoading ? <CircularProgress size={24} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetails; 