import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Print as PrintIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import OrderTimeline from '../../components/OrderTimeline';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { 
  getOrderById, 
  getOrderHistory, 
  OrderHistoryItem, 
  addOrderNote 
} from '../../services/order-service';
import { Order } from '../../types/models';

// Helper to format date
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

const OrderHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
  
  // Fetch order history
  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!id) return;
      
      try {
        setHistoryLoading(true);
        const history = await getOrderHistory(id);
        setOrderHistory(history);
      } catch (err) {
        console.error('Failed to fetch order history:', err);
        setError('Failed to load order history.');
      } finally {
        setHistoryLoading(false);
      }
    };
    
    fetchOrderHistory();
  }, [id]);
  
  // Filter history based on search and status filter
  const filteredHistory = orderHistory.filter(item => {
    // Filter by search term
    const matchesSearch = 
      searchTerm === '' || 
      (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.user && item.user.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status
    const matchesStatus = 
      statusFilter === 'all' || 
      (item.status && item.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });
  
  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(orderHistory.map(item => item.status))].filter(Boolean);
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs and Navigation */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <Link to="/orders" style={{ textDecoration: 'none', color: 'inherit' }}>Orders</Link>
          <Link to={`/orders/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>Order Details</Link>
          <Typography color="text.primary">Order History</Typography>
        </Breadcrumbs>
      </Box>
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton edge="start" component={Link} to={`/orders/${id}`} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Order History
        </Typography>
      </Box>
      
      {/* Order Summary Card */}
      {order && (
        <Paper sx={{ mb: 4, p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Order #{order.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Created: {formatDate(order.createdAt)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Current Status: <OrderStatusBadge status={order.status} />
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Typography variant="body1" gutterBottom>
                Customer ID: {order.customerId}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Total Amount: ${order.totalAmount.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Filters */}
      <Paper sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search History"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {uniqueStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              variant="outlined" 
              startIcon={<PrintIcon />} 
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Timeline */}
      <Paper sx={{ p: 3 }} className="printable-content">
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <TimelineIcon sx={{ mr: 2 }} />
          <Typography variant="h5">
            Timeline ({filteredHistory.length} entries)
          </Typography>
        </Box>
        
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : filteredHistory.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            {searchTerm || statusFilter !== 'all' 
              ? 'No history entries match your filters.' 
              : 'No history entries found for this order.'}
          </Alert>
        ) : (
          <OrderTimeline 
            orderId={id || ''} 
            timeline={filteredHistory} 
            allowAddNotes={true}
            onRefresh={() => {
              setHistoryLoading(true);
              getOrderHistory(id || '').then(history => {
                setOrderHistory(history);
                setHistoryLoading(false);
              }).catch(err => {
                console.error('Failed to refresh history:', err);
                setHistoryLoading(false);
              });
            }}
          />
        )}
      </Paper>
    </Container>
  );
};

export default OrderHistoryPage; 