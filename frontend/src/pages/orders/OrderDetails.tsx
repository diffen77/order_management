import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getOrderById, 
  updateOrderStatus, 
  cancelOrder,
  getOrderHistory,
  OrderHistoryItem
} from '../../services/order-service';
import { Order, OrderItem, OrderStatus } from '../../types/models';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { formatCurrency as formatCurrencyUtil } from '../../utils/format';
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
  Breadcrumbs,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  Timeline as TimelineIcon,
  AddComment as AddCommentIcon,
  LocalShipping as ShippingIcon,
  PictureAsPdf as PdfIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import OrderTimeline from '../../components/OrderTimeline';
import { useNotifications } from '../../context/NotificationsContext';

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
  { status: 'pending' as OrderStatus, label: 'New Order' },
  { status: 'pending' as OrderStatus, label: 'Pending' },
  { status: 'processing' as OrderStatus, label: 'Processing' },
  { status: 'shipped' as OrderStatus, label: 'Shipped' },
  { status: 'delivered' as OrderStatus, label: 'Delivered' }
];

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const printRef = useRef<HTMLDivElement>(null);
  
  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [timelineOpen, setTimelineOpen] = useState<boolean>(false);
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [availableStatuses, setAvailableStatuses] = useState<OrderStatus[]>([]);
  
  // Import the useNotifications hook
  const { addOrderNotification } = useNotifications();
  
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
          const mockNextStatuses: Record<OrderStatus, OrderStatus[]> = {
            'pending': ['processing' as OrderStatus, 'cancelled' as OrderStatus],
            'processing': ['shipped' as OrderStatus, 'cancelled' as OrderStatus],
            'shipped': ['delivered' as OrderStatus, 'returned' as OrderStatus],
            'delivered': ['returned' as OrderStatus],
            'cancelled': [],
            'returned': []
          };
          setAvailableStatuses(mockNextStatuses[data.status] || []);
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
  
  // Fetch order history
  const fetchOrderHistory = async () => {
    if (!id) return;
    
    try {
      setHistoryLoading(true);
      // In a real app, this would be an API call to get order history
      // Mocking the data for now
      const history: OrderHistoryItem[] = [
        {
          id: '1',
          orderId: id,
          status: 'pending',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
          user: 'system'
        },
        {
          id: '2',
          orderId: id,
          status: 'pending',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          note: 'Order payment verified',
          user: 'admin@example.com'
        },
        {
          id: '3',
          orderId: id,
          status: 'processing',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          note: 'Items being prepared for shipping',
          user: 'warehouse@example.com'
        }
      ];
      
      // If the order is in a more advanced state, add those steps too
      if (['shipped', 'delivered', 'returned'].includes(order?.status || '')) {
        history.push({
          id: '4',
          orderId: id,
          status: 'shipped',
          timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          note: 'Dispatched with carrier #ABC123456',
          user: 'shipping@example.com'
        });
      }
      
      if (['delivered', 'returned'].includes(order?.status || '')) {
        history.push({
          id: '5',
          orderId: id,
          status: 'delivered',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          note: 'Package delivered and signed for by recipient',
          user: 'delivery@example.com'
        });
      }
      
      if (order?.status === 'returned') {
        history.push({
          id: '6',
          orderId: id,
          status: 'returned',
          timestamp: new Date().toISOString(),
          note: 'Customer initiated return. Reason: Damaged product.',
          user: 'customer-service@example.com'
        });
      }
      
      // Sort by timestamp ascending
      history.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setOrderHistory(history);
    } catch (err) {
      console.error('Failed to fetch order history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Load history when timeline is opened
  useEffect(() => {
    if (timelineOpen && orderHistory.length === 0) {
      fetchOrderHistory();
    }
  }, [timelineOpen, orderHistory.length]);
  
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
  const handleStatusChange = async (e: React.ChangeEvent<{ value: unknown }>) => {
    const newStatus = e.target.value as OrderStatus;
    setStatusLoading(true);
    
    try {
      const updatedOrder = await updateOrderStatus(id || '', newStatus);
      setOrder(updatedOrder);
      
      // Send notification about status change
      addOrderNotification(
        id || '',
        `Order Status Updated to ${newStatus}`,
        `The order #${id?.substring(0, 8)} status has been updated from ${order?.status} to ${newStatus}.`,
        newStatus
      );
      
      // Refresh order history if timeline is open
      if (timelineOpen) {
        fetchOrderHistory();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };
  
  // Print order function
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const originalContents = document.body.innerHTML;
    const printContents = printContent.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="text-align: center;">Order #${id?.substring(0, 8)}</h1>
        ${printContents}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };
  
  // Export as PDF
  const handleExportPDF = () => {
    // In a real app, this would generate a PDF file using a library like jsPDF
    alert('PDF export functionality would be implemented here.');
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
    return order.items.reduce((total: number, item: OrderItem) => total + item.quantity, 0);
  };
  
  const handleOpenTimeline = () => {
    fetchOrderHistory();
    setTimelineOpen(true);
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
            <IconButton sx={{ mr: 1 }} onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export as PDF">
            <IconButton sx={{ mr: 1 }} onClick={handleExportPDF}>
              <PdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Invoice">
            <IconButton sx={{ mr: 1 }}>
              <ReceiptIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Order">
            <IconButton 
              component={Link} 
              to={`/orders/${id}/edit`}
              sx={{ ml: 1 }}
              disabled={['cancelled', 'delivered', 'returned'].includes(order?.status || '')}
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
      
      <div ref={printRef}>
        {/* Order Status Stepper */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            mb: 2,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}>
            <Typography variant="h6">Order Status</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <OrderStatusBadge status={order.status as OrderStatus} size="medium" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 2 }}>
                <Button 
                  startIcon={<TimelineIcon />} 
                  onClick={handleOpenTimeline}
                  variant="outlined"
                  sx={{ ml: isMobile ? 0 : 2, mb: isMobile ? 2 : 0 }}
                >
                  Quick Timeline
                </Button>
                
                <Button
                  startIcon={<HistoryIcon />}
                  component={Link}
                  to={`/orders/${id}/history`}
                  variant="contained"
                  sx={{ ml: 2, mb: isMobile ? 2 : 0 }}
                >
                  Full Order History
                </Button>
              </Box>
              {availableStatuses.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setStatusDialogOpen(true)}
                  sx={{ ml: isMobile ? 0 : 2 }}
                  disabled={statusLoading}
                >
                  Update Status
                </Button>
              )}
            </Box>
          </Box>
          <Stepper 
            activeStep={getCurrentStepIndex()} 
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
          >
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
        
        {/* Shipping Info */}
        {order.status !== 'cancelled' && order.status !== 'pending' && (
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Shipping Information" 
              avatar={<ShippingIcon color="primary" />}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Shipping Method:</strong> {order.shippingMethod || 'Standard Shipping'}
                  </Typography>
                  {order.trackingNumber && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Tracking Number:</strong> {order.trackingNumber}
                    </Typography>
                  )}
                  {order.estimatedDelivery && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Estimated Delivery:</strong> {formatDate(order.estimatedDelivery)}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {order.carrier && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Carrier:</strong> {order.carrier}
                    </Typography>
                  )}
                  {order.status === 'shipped' && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<InfoIcon />}
                      sx={{ mt: 1 }}
                    >
                      Track Package
                    </Button>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </div>
      
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
      
      {/* Order Timeline Dialog */}
      <Dialog
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimelineIcon sx={{ mr: 1 }} />
            Order Timeline
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <OrderTimeline 
              orderId={id || ''} 
              timeline={orderHistory} 
              loading={historyLoading}
              allowAddNotes={true}
              onRefresh={fetchOrderHistory}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
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
            onChange={handleStatusChange}
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