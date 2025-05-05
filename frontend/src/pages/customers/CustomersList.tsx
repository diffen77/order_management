import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import { Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Table, { Column } from '../../components/common/Table';
import { Customer, getCustomers } from '../../services/customer-service';

// Customer type chip colors
const typeColors = {
  regular: 'default',
  wholesale: 'primary',
  VIP: 'secondary',
} as const;

/**
 * CustomersList component - Displays a list of customers with filtering and search
 * 
 * - Implementation includes search by name, email, phone, and ID (Task 7.7)
 * - Uses API-side filtering for improved performance
 * - Includes debounced search to prevent excessive API calls
 */
export default function CustomersList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerType, setCustomerType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (search?: string, type?: string) => {
    try {
      setLoading(true);
      const response = await getCustomers(search, type);
      setCustomers(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      setError(err.message || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchTerm, customerType);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, customerType, fetchCustomers]);

  // Remove client-side filtering as we're using the API for filtering now
  const filteredCustomers = customers;

  const handleRowClick = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleAddCustomer = () => {
    navigate('/customers/new');
  };

  const columns: Column<Customer>[] = [
    {
      id: 'full_name',
      label: 'Name',
      minWidth: 170,
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 170,
    },
    {
      id: 'phone',
      label: 'Phone',
      minWidth: 120,
    },
    {
      id: 'city',
      label: 'City',
      minWidth: 120,
    },
    {
      id: 'customer_type',
      label: 'Type',
      minWidth: 100,
      format: (value: string) => (
        <Chip 
          label={value.toUpperCase()} 
          color={typeColors[value as keyof typeof typeColors]} 
          size="small" 
          variant="outlined"
        />
      ),
    },
    {
      id: 'created_at',
      label: 'Created',
      minWidth: 170,
      format: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Customers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCustomer}
        >
          Add Customer
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name, email, phone or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            variant="outlined"
            label="Customer Type"
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="regular">Regular</MenuItem>
            <MenuItem value="wholesale">Wholesale</MenuItem>
            <MenuItem value="VIP">VIP</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Table<Customer>
        columns={columns}
        data={filteredCustomers}
        loading={loading}
        emptyMessage="No customers found"
        idField="id"
        defaultSort="full_name"
        defaultSortDirection="asc"
        onRowClick={handleRowClick}
      />
    </Container>
  );
} 