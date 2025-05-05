/**
 * Tests for the OrderForm component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderForm from '../../pages/orders/OrderForm';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as orderService from '../../services/order-service';
import * as customerService from '../../services/customer-service';
import * as productService from '../../services/product-service';

// Mock the services
vi.mock('../../services/order-service', () => ({
  getOrderById: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn()
}));

vi.mock('../../services/customer-service', () => ({
  getCustomers: vi.fn(),
  getCustomerById: vi.fn()
}));

vi.mock('../../services/product-service', () => ({
  getProducts: vi.fn(),
  getProductById: vi.fn()
}));

describe('OrderForm Component', () => {
  // Mock data
  const mockOrderId = '123';
  const mockCustomers = [
    { id: '101', name: 'Customer 1', email: 'customer1@example.com' },
    { id: '102', name: 'Customer 2', email: 'customer2@example.com' }
  ];
  const mockProducts = [
    { id: '201', name: 'Product 1', price: 49.99, inventory: 100 },
    { id: '202', name: 'Product 2', price: 99.99, inventory: 50 }
  ];
  const mockOrder = {
    id: mockOrderId,
    customer_id: '101',
    customer: mockCustomers[0],
    items: [
      { product_id: '201', product: mockProducts[0], quantity: 2, price: 49.99 }
    ],
    shipping_address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'Test Country'
    },
    billing_address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'Test Country'
    },
    subtotal: 99.98,
    tax: 10.00,
    shipping: 5.00,
    total: 114.98,
    payment_method: 'credit_card',
    notes: 'Test notes',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00',
    updatedAt: '2023-01-01T00:00:00'
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Setup mocks
    (customerService.getCustomers as any).mockResolvedValue({ 
      items: mockCustomers, 
      total: mockCustomers.length 
    });
    (customerService.getCustomerById as any).mockImplementation(
      (id) => Promise.resolve(mockCustomers.find(c => c.id === id))
    );
    
    (productService.getProducts as any).mockResolvedValue({ 
      items: mockProducts, 
      total: mockProducts.length 
    });
    (productService.getProductById as any).mockImplementation(
      (id) => Promise.resolve(mockProducts.find(p => p.id === id))
    );
    
    (orderService.getOrderById as any).mockResolvedValue(mockOrder);
    (orderService.createOrder as any).mockResolvedValue({...mockOrder, id: 'new-id'});
    (orderService.updateOrder as any).mockResolvedValue(mockOrder);
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
  });

  it('should render the OrderForm component for new order creation', async () => {
    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route path="/orders/new" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check if title is displayed for new order
      expect(screen.getByText('Create New Order')).toBeInTheDocument();
    });

    // Check if stepper is displayed with steps
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Shipping & Billing')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('should render the OrderForm component for editing existing order', async () => {
    render(
      <MemoryRouter initialEntries={[`/orders/edit/${mockOrderId}`]}>
        <Routes>
          <Route path="/orders/edit/:id" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check if title is displayed for edit order
      expect(screen.getByText(`Edit Order #${mockOrderId}`)).toBeInTheDocument();
      
      // Check if the service was called with the correct order ID
      expect(orderService.getOrderById).toHaveBeenCalledWith(mockOrderId);
    });
  });

  it('should load customer options in step 1', async () => {
    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route path="/orders/new" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check if customers are loaded
      expect(customerService.getCustomers).toHaveBeenCalled();
    });

    // Check for customer selection options
    const customerSelect = screen.getByLabelText(/select customer/i);
    expect(customerSelect).toBeInTheDocument();
    
    // Verify customer options are available
    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument();
      expect(screen.getByText('Customer 2')).toBeInTheDocument();
    });
  });

  it('should be able to navigate through steps', async () => {
    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route path="/orders/new" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Create New Order')).toBeInTheDocument();
    });

    // Step 1: Select a customer
    const customerSelect = screen.getByLabelText(/select customer/i);
    fireEvent.change(customerSelect, { target: { value: '101' } });
    
    // Click Next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Step 2: Should now show products step
    await waitFor(() => {
      expect(screen.getByText('Add Products')).toBeInTheDocument();
      expect(productService.getProducts).toHaveBeenCalled();
    });
    
    // Add a product
    const addProductButton = screen.getByText('Add Product');
    fireEvent.click(addProductButton);
    
    // Product selection modal should appear
    await waitFor(() => {
      expect(screen.getByText('Select Products')).toBeInTheDocument();
    });
    
    // Select a product and confirm
    const productCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(productCheckbox);
    
    const addButton = screen.getByText('Add Selected Products');
    fireEvent.click(addButton);
    
    // Move to next step
    const nextButton2 = screen.getAllByText('Next')[0];
    fireEvent.click(nextButton2);
    
    // Step 3: Should now show shipping & billing
    await waitFor(() => {
      expect(screen.getByText('Shipping Information')).toBeInTheDocument();
      expect(screen.getByText('Billing Information')).toBeInTheDocument();
    });
    
    // Fill shipping address
    const streetInput = screen.getByLabelText(/street/i);
    const cityInput = screen.getByLabelText(/city/i);
    const stateInput = screen.getByLabelText(/state/i);
    const zipInput = screen.getByLabelText(/zip/i);
    const countryInput = screen.getByLabelText(/country/i);
    
    fireEvent.change(streetInput, { target: { value: '123 Test St' } });
    fireEvent.change(cityInput, { target: { value: 'Test City' } });
    fireEvent.change(stateInput, { target: { value: 'TS' } });
    fireEvent.change(zipInput, { target: { value: '12345' } });
    fireEvent.change(countryInput, { target: { value: 'Test Country' } });
    
    // Use same address for billing
    const sameAsBillingCheckbox = screen.getByLabelText(/same as shipping/i);
    fireEvent.click(sameAsBillingCheckbox);
    
    // Move to next step
    const nextButton3 = screen.getAllByText('Next')[0];
    fireEvent.click(nextButton3);
    
    // Step 4: Should now show payment
    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
    });
    
    // Select payment method
    const paymentSelect = screen.getByLabelText(/payment method/i);
    fireEvent.change(paymentSelect, { target: { value: 'credit_card' } });
    
    // Add notes
    const notesInput = screen.getByLabelText(/order notes/i);
    fireEvent.change(notesInput, { target: { value: 'Test order notes' } });
    
    // Move to next step
    const nextButton4 = screen.getAllByText('Next')[0];
    fireEvent.click(nextButton4);
    
    // Step 5: Should now show review
    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Shipping & Billing Information')).toBeInTheDocument();
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });
  });

  it('should submit the form successfully', async () => {
    // Initialize with a filled form directly at the review step
    localStorage.setItem('orderFormDraft', JSON.stringify({
      customerId: '101',
      items: [{ productId: '201', quantity: 2, price: 49.99 }],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Test Country'
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Test Country'
      },
      paymentMethod: 'credit_card',
      notes: 'Test order notes',
      step: 4 // Review step
    }));
    
    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route path="/orders/new" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Wait for the form to load and jump to review step
    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });
    
    // Submit the form
    const submitButton = screen.getByText('Create Order');
    fireEvent.click(submitButton);
    
    // Verify the order was created
    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_id: '101',
          items: expect.arrayContaining([
            expect.objectContaining({
              product_id: '201',
              quantity: 2
            })
          ]),
          shipping_address: expect.objectContaining({
            street: '123 Test St',
            city: 'Test City'
          }),
          payment_method: 'credit_card',
          notes: 'Test order notes'
        })
      );
    });
  });

  it('should save draft and load saved draft', async () => {
    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route path="/orders/new" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Create New Order')).toBeInTheDocument();
    });

    // Step 1: Select a customer
    const customerSelect = screen.getByLabelText(/select customer/i);
    fireEvent.change(customerSelect, { target: { value: '101' } });
    
    // Save draft
    const saveDraftButton = screen.getByText('Save Draft');
    fireEvent.click(saveDraftButton);
    
    // Verify localStorage was updated
    expect(localStorage.getItem('orderFormDraft')).not.toBeNull();
    
    // Unmount and remount to test draft loading
    vi.resetAllMocks();
    
    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route path="/orders/new" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );
    
    // Check if draft was loaded
    await waitFor(() => {
      expect(screen.getByText('Draft Loaded')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    (customerService.getCustomers as any).mockRejectedValue(new Error('Failed to fetch customers'));

    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route path="/orders/new" element={<OrderForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
}); 