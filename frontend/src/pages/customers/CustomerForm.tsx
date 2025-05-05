import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  AlertTitle,
  SelectChangeEvent,
  Grid,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Customer,
  getCustomerById,
  createCustomer,
  updateCustomer,
} from '../../services/customer-service';

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  customer_type?: string;
}

export default function CustomerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<Customer>>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    customer_type: 'regular',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If in edit mode, fetch the existing customer data
    if (isEditMode && id) {
      const fetchCustomer = async () => {
        try {
          setLoading(true);
          const response = await getCustomerById(id);
          
          if (response.status === 'success' && response.data) {
            setFormData(response.data);
            setApiError(null);
          } else {
            setApiError(response.message || 'Failed to load customer data');
          }
        } catch (error: any) {
          console.error('Error fetching customer:', error);
          setApiError(error.message || 'An error occurred while loading customer data');
        } finally {
          setLoading(false);
        }
      };

      fetchCustomer();
    }
  }, [id, isEditMode]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate required fields
    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Phone validation - optional but if provided, should match a pattern
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    // Postal code validation - optional but if provided, validate format
    if (formData.postal_code && !/^[a-zA-Z0-9\s]{3,10}$/.test(formData.postal_code)) {
      newErrors.postal_code = 'Postal code is invalid';
    }
    
    // Customer type is required
    if (!formData.customer_type) {
      newErrors.customer_type = 'Customer type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setApiError(null);
      
      let response;
      if (isEditMode && id) {
        response = await updateCustomer(id, formData);
      } else {
        // Need to cast as the createCustomer function expects all required fields
        response = await createCustomer(formData as Omit<Customer, 'id' | 'created_at' | 'updated_at'>);
      }
      
      if (response.status === 'success') {
        setSuccess(true);
        
        // Redirect after successful submission after a short delay
        setTimeout(() => {
          if (isEditMode) {
            navigate(`/customers/${id}`);
          } else {
            navigate('/customers');
          }
        }, 1500);
      } else {
        setApiError(response.message || 'Failed to save customer');
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setApiError(error.message || 'An error occurred while saving customer data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(`/customers/${id}`);
    } else {
      navigate('/customers');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Customer' : 'Add New Customer'}
        </Typography>
      </Box>

      {apiError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {apiError}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success</AlertTitle>
          Customer {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Customer Information</Typography>
              <Divider sx={{ mt: 1, mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="full_name"
                name="full_name"
                label="Full Name"
                value={formData.full_name || ''}
                onChange={handleTextInputChange}
                error={Boolean(errors.full_name)}
                helperText={errors.full_name}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={handleTextInputChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="phone"
                name="phone"
                label="Phone"
                value={formData.phone || ''}
                onChange={handleTextInputChange}
                error={Boolean(errors.phone)}
                helperText={errors.phone || 'Format: +1 (123) 456-7890'}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="address"
                name="address"
                label="Address"
                value={formData.address || ''}
                onChange={handleTextInputChange}
                error={Boolean(errors.address)}
                helperText={errors.address}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="postal_code"
                name="postal_code"
                label="Postal Code"
                value={formData.postal_code || ''}
                onChange={handleTextInputChange}
                error={Boolean(errors.postal_code)}
                helperText={errors.postal_code}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="city"
                name="city"
                label="City"
                value={formData.city || ''}
                onChange={handleTextInputChange}
                error={Boolean(errors.city)}
                helperText={errors.city}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                required
                error={Boolean(errors.customer_type)}
                disabled={submitting}
              >
                <InputLabel id="customer-type-label">Customer Type</InputLabel>
                <Select
                  labelId="customer-type-label"
                  id="customer_type"
                  name="customer_type"
                  value={formData.customer_type || 'regular'}
                  label="Customer Type"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="wholesale">Wholesale</MenuItem>
                  <MenuItem value="VIP">VIP</MenuItem>
                </Select>
                {errors.customer_type && (
                  <FormHelperText>{errors.customer_type}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Customer'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
} 