import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import { 
  getOrderById, 
  createOrder, 
  updateOrder 
} from '../../services/order-service';
import { getProducts } from '../../services/product-service';
import { get } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';
import { 
  Order, 
  OrderItem, 
  Customer, 
  Product, 
  Address 
} from '../../types/models';
import { formatCurrency } from '../../utils/format';

// Form steps
const steps = [
  'Customer Information',
  'Products',
  'Shipping & Billing',
  'Payment Details',
  'Review Order'
];

interface OrderFormState {
  customerId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  useShippingForBilling: boolean;
  paymentMethod: string;
  notes: string;
  totalAmount: number;
}

const DRAFT_STORAGE_KEY = 'orderFormDraft';

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isEditMode = Boolean(id);
  
  // State for step control
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  
  // Form state
  const [formState, setFormState] = useState<OrderFormState>({
    customerId: '',
    items: [],
    shippingAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
    billingAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
    useShippingForBilling: true,
    paymentMethod: 'credit_card',
    notes: '',
    totalAmount: 0
  });
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Load data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load customers
        const customersResponse = await get<{ data: Customer[] }>(API_ENDPOINTS.CUSTOMERS);
        setCustomers(customersResponse.data);
        
        // Load products
        const productsResponse = await getProducts();
        setProducts(productsResponse.data);
        setFilteredProducts(productsResponse.data);
        
        // If in edit mode, load the order
        if (isEditMode && id) {
          const orderData = await getOrderById(id);
          
          // Transform order data to form state
          setFormState({
            customerId: orderData.customerId,
            items: orderData.items,
            shippingAddress: orderData.shippingAddress,
            billingAddress: orderData.billingAddress,
            useShippingForBilling: JSON.stringify(orderData.shippingAddress) === JSON.stringify(orderData.billingAddress),
            paymentMethod: orderData.paymentStatus === 'paid' ? 'credit_card' : 'invoice', // Simple example
            notes: orderData.notes || '',
            totalAmount: orderData.totalAmount
          });
        } else {
          // Check for saved draft in localStorage
          const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
          if (savedDraft) {
            try {
              const parsedDraft = JSON.parse(savedDraft);
              setFormState(parsedDraft);
              setSuccessMessage('Draft loaded successfully');
              setTimeout(() => setSuccessMessage(null), 3000);
            } catch (e) {
              console.error('Failed to parse saved draft', e);
              // Continue with empty form
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [id, isEditMode]);
  
  // Filter products when search term changes
  useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts(products);
    } else {
      const searchTerm = productSearch.toLowerCase();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.sku.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
      setFilteredProducts(filtered);
    }
  }, [productSearch, products]);
  
  // Update total amount when items change
  useEffect(() => {
    const newTotal = formState.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setFormState(prev => ({ ...prev, totalAmount: newTotal }));
  }, [formState.items]);
  
  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formState));
      setSuccessMessage('Draft saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      console.error('Failed to save draft', e);
      setError('Failed to save draft. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  }, [formState]);
  
  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);
  
  // Handle form field changes
  const handleChange = (field: keyof OrderFormState, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when field is changed
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  
  // Handle address field changes
  const handleAddressChange = (type: 'shipping' | 'billing', field: keyof Address, value: string) => {
    setFormState(prev => {
      const updatedForm = { 
        ...prev,
        [type === 'shipping' ? 'shippingAddress' : 'billingAddress']: {
          ...prev[type === 'shipping' ? 'shippingAddress' : 'billingAddress'],
          [field]: value
        }
      };
      
      // If using shipping for billing, update billing address too
      if (type === 'shipping' && prev.useShippingForBilling) {
        updatedForm.billingAddress = {
          ...updatedForm.billingAddress,
          [field]: value
        };
      }
      
      return updatedForm;
    });
    
    // Clear validation error
    const errorKey = `${type}.${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };
  
  // Toggle shipping address as billing
  const handleUseShippingForBilling = (checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      useShippingForBilling: checked,
      billingAddress: checked ? { ...prev.shippingAddress } : prev.billingAddress
    }));
  };
  
  // Add a product to the order
  const handleAddProduct = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product is already in the order
    const existingItemIndex = formState.items.findIndex(item => item.productId === productId);
    
    setFormState(prev => {
      const updatedItems = [...prev.items];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          totalPrice: product.price * (existingItem.quantity + quantity)
        };
      } else {
        // Add new item
        updatedItems.push({
          id: '',
          orderId: '',
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          sku: product.sku
        });
      }
      
      return {
        ...prev,
        items: updatedItems
      };
    });
  };
  
  // Remove a product from the order
  const handleRemoveProduct = (index: number) => {
    setFormState(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };
  
  // Update product quantity
  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    setFormState(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity,
        totalPrice: updatedItems[index].unitPrice * quantity
      };
      
      return {
        ...prev,
        items: updatedItems
      };
    });
  };
  
  // Validate current step
  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    switch (activeStep) {
      case 0: // Customer Information
        if (!formState.customerId) {
          errors.customerId = 'Please select a customer';
        }
        break;
        
      case 1: // Products
        if (formState.items.length === 0) {
          errors.items = 'Please add at least one product';
        }
        break;
        
      case 2: // Shipping & Billing
        const requiredAddressFields: (keyof Address)[] = ['street', 'city', 'state', 'postalCode', 'country'];
        
        requiredAddressFields.forEach(field => {
          if (!formState.shippingAddress[field]) {
            errors[`shipping.${field}`] = `Shipping ${field} is required`;
          }
        });
        
        if (!formState.useShippingForBilling) {
          requiredAddressFields.forEach(field => {
            if (!formState.billingAddress[field]) {
              errors[`billing.${field}`] = `Billing ${field} is required`;
            }
          });
        }
        break;
        
      case 3: // Payment Details
        if (!formState.paymentMethod) {
          errors.paymentMethod = 'Please select a payment method';
        }
        break;
        
      // Step 4 is review, no validation needed
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle moving to next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prevStep => prevStep + 1);
      saveDraft(); // Save progress when moving to next step
    }
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate all steps before submission
    const errors: Record<string, string> = {};
    
    if (!formState.customerId) {
      errors.customerId = 'Please select a customer';
    }
    
    if (formState.items.length === 0) {
      errors.items = 'Please add at least one product';
    }
    
    const requiredAddressFields: (keyof Address)[] = ['street', 'city', 'state', 'postalCode', 'country'];
    
    requiredAddressFields.forEach(field => {
      if (!formState.shippingAddress[field]) {
        errors[`shipping.${field}`] = `Shipping ${field} is required`;
      }
    });
    
    if (!formState.useShippingForBilling) {
      requiredAddressFields.forEach(field => {
        if (!formState.billingAddress[field]) {
          errors[`billing.${field}`] = `Billing ${field} is required`;
        }
      });
    }
    
    if (!formState.paymentMethod) {
      errors.paymentMethod = 'Please select a payment method';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Go to the first step with errors
      if (errors.customerId) {
        setActiveStep(0);
      } else if (errors.items) {
        setActiveStep(1);
      } else if (Object.keys(errors).some(key => key.startsWith('shipping.') || key.startsWith('billing.'))) {
        setActiveStep(2);
      } else if (errors.paymentMethod) {
        setActiveStep(3);
      }
      return;
    }
    
    setSubmitLoading(true);
    setError(null);
    
    try {
      const orderData = {
        customerId: formState.customerId,
        items: formState.items,
        shippingAddress: formState.shippingAddress,
        billingAddress: formState.billingAddress,
        notes: formState.notes,
        totalAmount: formState.totalAmount,
        paymentStatus: formState.paymentMethod === 'credit_card' ? 'paid' : 'pending'
      };
      
      let response;
      
      if (isEditMode && id) {
        response = await updateOrder(id, orderData);
        setSuccessMessage('Order updated successfully');
      } else {
        response = await createOrder(orderData as any);
        setSuccessMessage('Order created successfully');
        clearDraft(); // Clear draft after successful submission
      }
      
      // Redirect to order details after a delay
      setTimeout(() => {
        navigate(`/orders/${response.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting order:', err);
      setError(err?.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, position: 'relative' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton 
            edge="start" 
            component={Link} 
            to="/orders"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Edit Order' : 'Create New Order'}
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile} orientation={isMobile ? 'vertical' : 'horizontal'}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            <Box sx={{ mt: 4 }}>
              {/* Step Content */}
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Select Customer
                  </Typography>
                  <TextField
                    select
                    label="Customer"
                    fullWidth
                    value={formState.customerId}
                    onChange={(e) => handleChange('customerId', e.target.value)}
                    error={Boolean(validationErrors.customerId)}
                    helperText={validationErrors.customerId}
                    margin="normal"
                  >
                    <MenuItem value="">
                      <em>Select a customer</em>
                    </MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </MenuItem>
                    ))}
                  </TextField>
                  {formState.customerId && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Selected Customer Details
                      </Typography>
                      {(() => {
                        const customer = customers.find(c => c.id === formState.customerId);
                        if (!customer) return <Typography>No customer details available</Typography>;
                        
                        return (
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2"><strong>Name:</strong> {customer.name}</Typography>
                              <Typography variant="body2"><strong>Email:</strong> {customer.email}</Typography>
                              <Typography variant="body2"><strong>Phone:</strong> {customer.phone || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2"><strong>Company:</strong> {customer.company || 'N/A'}</Typography>
                              <Typography variant="body2"><strong>Customer since:</strong> {new Date(customer.createdAt).toLocaleDateString()}</Typography>
                            </Grid>
                          </Grid>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
              )}
              
              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Add Products
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Search Products"
                      variant="outlined"
                      fullWidth
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={8} sm={9}>
                      <TextField
                        select
                        label="Select Product"
                        fullWidth
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddProduct(e.target.value, 1);
                            e.target.value = '';
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>Choose a product</em>
                        </MenuItem>
                        {filteredProducts.map((product) => (
                          <MenuItem key={product.id} value={product.id}>
                            {product.name} - {formatCurrency(product.price)} (Stock: {product.inventoryCount})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={4} sm={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ height: '100%' }}
                        onClick={() => document.getElementById('product-select')?.focus()}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>
                  
                  {validationErrors.items && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {validationErrors.items}
                    </Alert>
                  )}
                  
                  {formState.items.length > 0 ? (
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {formState.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value || '1', 10))}
                                  InputProps={{ 
                                    inputProps: { min: 1 },
                                    sx: { width: '80px' }
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleRemoveProduct(index)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <Typography variant="subtitle1">Total:</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle1">{formatCurrency(formState.totalAmount)}</Typography>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Paper sx={{ p: 2, textAlign: 'center', mb: 3 }}>
                      <Typography color="textSecondary">No products added yet</Typography>
                    </Paper>
                  )}
                </Box>
              )}
              
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Shipping & Billing Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Shipping Address */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Shipping Address
                      </Typography>
                      <Grid container spacing={2}>
                        {['street', 'city', 'state', 'postalCode', 'country'].map((field) => (
                          <Grid item xs={12} key={field} sm={field === 'street' ? 12 : field === 'postalCode' || field === 'state' ? 6 : 12}>
                            <TextField
                              label={field.charAt(0).toUpperCase() + field.slice(1)}
                              fullWidth
                              value={formState.shippingAddress[field as keyof Address] || ''}
                              onChange={(e) => handleAddressChange('shipping', field as keyof Address, e.target.value)}
                              error={Boolean(validationErrors[`shipping.${field}`])}
                              helperText={validationErrors[`shipping.${field}`]}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                    
                    {/* Billing Address */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1">
                          Billing Address
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formState.useShippingForBilling}
                              onChange={(e) => handleUseShippingForBilling(e.target.checked)}
                            />
                          }
                          label="Same as shipping"
                        />
                      </Box>
                      
                      {!formState.useShippingForBilling && (
                        <Grid container spacing={2}>
                          {['street', 'city', 'state', 'postalCode', 'country'].map((field) => (
                            <Grid item xs={12} key={field} sm={field === 'street' ? 12 : field === 'postalCode' || field === 'state' ? 6 : 12}>
                              <TextField
                                label={field.charAt(0).toUpperCase() + field.slice(1)}
                                fullWidth
                                value={formState.billingAddress[field as keyof Address] || ''}
                                onChange={(e) => handleAddressChange('billing', field as keyof Address, e.target.value)}
                                error={Boolean(validationErrors[`billing.${field}`])}
                                helperText={validationErrors[`billing.${field}`]}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Payment Details
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Payment Method"
                        fullWidth
                        value={formState.paymentMethod}
                        onChange={(e) => handleChange('paymentMethod', e.target.value)}
                        error={Boolean(validationErrors.paymentMethod)}
                        helperText={validationErrors.paymentMethod}
                      >
                        <MenuItem value="credit_card">Credit Card</MenuItem>
                        <MenuItem value="invoice">Invoice</MenuItem>
                        <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Order Notes
                    </Typography>
                    <TextField
                      label="Notes"
                      fullWidth
                      multiline
                      rows={4}
                      value={formState.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Add any special instructions or notes about the order..."
                    />
                  </Box>
                </Box>
              )}
              
              {activeStep === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Order Summary
                  </Typography>
                  
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">Customer</Typography>
                        {(() => {
                          const customer = customers.find(c => c.id === formState.customerId);
                          if (!customer) return <Typography>No customer selected</Typography>;
                          
                          return (
                            <>
                              <Typography variant="body2">{customer.name}</Typography>
                              <Typography variant="body2">{customer.email}</Typography>
                              <Typography variant="body2">{customer.phone || 'N/A'}</Typography>
                            </>
                          );
                        })()}
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">Payment Method</Typography>
                        <Typography variant="body2">
                          {formState.paymentMethod === 'credit_card' && 'Credit Card'}
                          {formState.paymentMethod === 'invoice' && 'Invoice'}
                          {formState.paymentMethod === 'bank_transfer' && 'Bank Transfer'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">Shipping Address</Typography>
                        <Typography variant="body2">{formState.shippingAddress.street}</Typography>
                        <Typography variant="body2">
                          {formState.shippingAddress.city}, {formState.shippingAddress.state} {formState.shippingAddress.postalCode}
                        </Typography>
                        <Typography variant="body2">{formState.shippingAddress.country}</Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1">Billing Address</Typography>
                        <Typography variant="body2">{formState.billingAddress.street}</Typography>
                        <Typography variant="body2">
                          {formState.billingAddress.city}, {formState.billingAddress.state} {formState.billingAddress.postalCode}
                        </Typography>
                        <Typography variant="body2">{formState.billingAddress.country}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formState.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="subtitle1">Subtotal:</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle1">{formatCurrency(formState.totalAmount)}</Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="subtitle1">Tax (25%):</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle1">{formatCurrency(formState.totalAmount * 0.25)}</Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="subtitle1"><strong>Total:</strong></Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle1"><strong>{formatCurrency(formState.totalAmount * 1.25)}</strong></Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {formState.notes && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Notes
                      </Typography>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body2">{formState.notes}</Typography>
                      </Paper>
                    </Box>
                  )}
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    sx={{ mr: 1 }}
                    onClick={saveDraft}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={activeStep === steps.length - 1 ? <ShoppingCartIcon /> : undefined}
                    onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <CircularProgress size={24} />
                    ) : activeStep === steps.length - 1 ? (
                      isEditMode ? 'Update Order' : 'Place Order'
                    ) : (
                      'Next'
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default OrderForm; 