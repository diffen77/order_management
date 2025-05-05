import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../services/order-service';
import { Order, OrderStatus } from '../../types/models';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Done as DoneIcon,
  Cancel as CancelIcon,
  Create as CreateIcon,
  Schedule as ScheduleIcon,
  Inventory as InventoryIcon
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

// Mock timeline events for demonstration - in a real app, these would come from the API
const getMockTimelineEvents = (order: Order) => {
  const events = [
    {
      id: 1,
      status: 'new',
      title: 'Order Created',
      description: 'Order was placed by customer',
      timestamp: order.createdAt,
      icon: <CreateIcon />,
      color: 'primary'
    }
  ];

  // Add events based on order status to simulate a timeline
  if (['pending', 'processing', 'shipped', 'delivered'].includes(order.status)) {
    events.push({
      id: 2,
      status: 'pending',
      title: 'Payment Received',
      description: 'Payment was successfully processed',
      timestamp: new Date(new Date(order.createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
      icon: <PaymentIcon />,
      color: 'success'
    });
  }

  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    events.push({
      id: 3,
      status: 'processing',
      title: 'Order Processing',
      description: 'Order is being prepared for shipment',
      timestamp: new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(), // +1 day
      icon: <InventoryIcon />,
      color: 'info'
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    events.push({
      id: 4,
      status: 'shipped',
      title: 'Order Shipped',
      description: 'Order has been shipped to the customer',
      timestamp: new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 days
      icon: <ShippingIcon />,
      color: 'warning'
    });
  }

  if (order.status === 'delivered') {
    events.push({
      id: 5,
      status: 'delivered',
      title: 'Order Delivered',
      description: 'Order has been delivered to the customer',
      timestamp: new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
      icon: <DoneIcon />,
      color: 'success'
    });
  }

  if (order.status === 'cancelled') {
    events.push({
      id: 6,
      status: 'cancelled',
      title: 'Order Cancelled',
      description: 'Order has been cancelled',
      timestamp: new Date(new Date(order.createdAt).getTime() + 12 * 60 * 60 * 1000).toISOString(), // +12 hours
      icon: <CancelIcon />,
      color: 'error'
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

const OrderTimeline: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Order not found'}</Alert>
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
  
  const timelineEvents = getMockTimelineEvents(order);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          component={Link}
          to={`/orders/${id}`}
          sx={{ mr: 2 }}
        >
          Back to Order
        </Button>
        <Typography variant="h4">Order Timeline</Typography>
      </Box>
      
      {/* Order Basic Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Order #{order.id}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2"><strong>Created:</strong> {formatDate(order.createdAt)}</Typography>
            <Typography variant="body2"><strong>Customer:</strong> {order.customerId}</Typography>
          </Box>
          <Box>
            <Typography variant="body2"><strong>Status:</strong> {order.status}</Typography>
            <Typography variant="body2"><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Order History</Typography>
          <Timeline position="alternate">
            {timelineEvents.map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineOppositeContent color="text.secondary">
                  {formatDate(event.timestamp)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={event.color as any}>
                    {event.icon}
                  </TimelineDot>
                  {index < timelineEvents.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6" component="span">
                    {event.title}
                  </Typography>
                  <Typography>{event.description}</Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>
    </Container>
  );
};

export default OrderTimeline; 