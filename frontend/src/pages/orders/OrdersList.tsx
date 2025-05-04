import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getOrders, 
  getOrdersByCustomer 
} from '../../services/order-service';
import { Order, OrderStatus } from '../../types/models';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { 
  Box, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination, 
  Typography, 
  Button, 
  IconButton, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Grid, 
  Paper, 
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Visibility as VisibilityIcon, 
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';

// Format date to display in a readable format
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

const OrdersList = () => {
  // State for orders data
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // State for filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    showFilters: false
  });

  // Fetch orders data when component mounts or filters change
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const params = {
          page,
          limit: rowsPerPage,
          ...(filters.status && { status: filters.status }),
          ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
          ...(filters.dateTo && { dateTo: filters.dateTo }),
          ...(filters.search && { search: filters.search })
        };
        
        const response = await getOrders(params);
        setOrders(response.data);
        setTotalCount(response.meta.total);
        
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [page, rowsPerPage, filters.status, filters.dateFrom, filters.dateTo, filters.search]);

  // Handle pagination changes
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name as string]: value
    }));
    setPage(0); // Reset to first page when filter changes
  };

  const toggleFilters = () => {
    setFilters(prev => ({
      ...prev,
      showFilters: !prev.showFilters
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      showFilters: true
    });
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Orders
      </Typography>
      
      {/* Search and filter controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Orders"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="returned">Returned</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={toggleFilters}
              fullWidth
            >
              {filters.showFilters ? 'Hide Filters' : 'More Filters'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button variant="contained" color="primary" fullWidth component={Link} to="/orders/new">
              New Order
            </Button>
          </Grid>
        </Grid>
        
        {/* Advanced filters */}
        {filters.showFilters && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="From Date"
                name="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="To Date"
                name="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={clearFilters}
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      {/* Orders table */}
      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>
                          <Link to={`/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <Typography variant="body2" component="span" fontWeight="bold">
                              {order.id.substring(0, 8)}...
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell>{order.customerId.substring(0, 8)}...</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status as OrderStatus} />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton component={Link} to={`/orders/${order.id}`}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Order">
                            <IconButton component={Link} to={`/orders/${order.id}/edit`}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Order">
                            <IconButton disabled={['cancelled', 'delivered', 'returned'].includes(order.status)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body1">No orders found matching your criteria</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Card>
    </Box>
  );
};

export default OrdersList; 