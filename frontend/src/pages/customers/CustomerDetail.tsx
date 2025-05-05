import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Customer, CustomerNote, getCustomerById, getCustomerOrders, getCustomerNotes } from '../../services/customer-service';
import { ApiResponse } from '../../types/api';

// Format date function 
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Customer type chip colors
const typeColors = {
  regular: 'default',
  wholesale: 'primary',
  VIP: 'secondary',
} as const;

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Load customer details
        const customerResponse = await getCustomerById(id);
        if (customerResponse.status === 'error') {
          throw new Error(customerResponse.message || 'Failed to load customer');
        }
        setCustomer(customerResponse.data);
        
        // Load customer orders
        const ordersResponse = await getCustomerOrders(id);
        if (ordersResponse.status === 'error') {
          throw new Error(ordersResponse.message || 'Failed to load customer orders');
        }
        setOrders(ordersResponse.data || []);
        
        // Load customer notes
        const notesResponse = await getCustomerNotes(id);
        if (notesResponse.status === 'error') {
          throw new Error(notesResponse.message || 'Failed to load customer notes');
        }
        setNotes(notesResponse.data || []);
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching customer data:', err);
        setError(err.message || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id]);

  const handleEditCustomer = () => {
    navigate(`/customers/${id}/edit`);
  };

  const handleBackToList = () => {
    navigate('/customers');
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToList}
        >
          Back to Customer List
        </Button>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Customer not found</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToList}
          sx={{ mt: 2 }}
        >
          Back to Customer List
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBackToList} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {customer.full_name}
          </Typography>
          <Chip 
            label={customer.customer_type.toUpperCase()} 
            color={typeColors[customer.customer_type as keyof typeof typeColors]} 
            sx={{ ml: 2 }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEditCustomer}
        >
          Edit Customer
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Customer Info Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography>{customer.email}</Typography>
            </Box>
            
            {customer.phone && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography>{customer.phone}</Typography>
              </Box>
            )}
            
            {(customer.address || customer.city || customer.postal_code) && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <LocationIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                <Box>
                  {customer.address && <Typography>{customer.address}</Typography>}
                  <Typography>
                    {customer.city ? customer.city : ''}
                    {customer.postal_code ? ` ${customer.postal_code}` : ''}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Customer since: {formatDate(customer.created_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {formatDate(customer.updated_at)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Customer Notes Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {notes.length === 0 ? (
              <Typography color="text.secondary">No notes added yet</Typography>
            ) : (
              notes.map((note) => (
                <Card key={note.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1">{note.content}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Added on {formatDate(note.created_at)}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
            
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate(`/customers/${id}/notes/add`)}
            >
              Add Note
            </Button>
          </Paper>
        </Grid>
        
        {/* Order History */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {orders.length === 0 ? (
              <Typography color="text.secondary">No orders found</Typography>
            ) : (
              <List>
                {orders.map((order) => (
                  <ListItem
                    key={order.id}
                    divider
                    secondaryAction={
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={`Order #${order.order_number || order.id}`}
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span">
                            {formatDate(order.created_at)} • Status: {order.status}
                          </Typography>
                          <Typography variant="body2" component="div">
                            {order.total_items} items • ${order.total_amount}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate('/orders/new', { state: { customerId: id } })}
            >
              Create New Order
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 