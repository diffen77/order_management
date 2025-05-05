/**
 * Tests for the OrderDetails component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderDetails from '../../pages/orders/OrderDetails';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as orderService from '../../services/order-service';
import { OrderStatus } from '../../types/models';

// Mock the order service
vi.mock('../../services/order-service', () => ({
  getOrderById: vi.fn(),
  getOrderHistory: vi.fn(),
  getAvailableStatusTransitions: vi.fn(),
  updateOrderStatus: vi.fn(),
  addOrderNote: vi.fn()
}));

describe('OrderDetails Component', () => {
  const mockOrderId = '123';
  const mockOrder = {
    id: mockOrderId,
    customer: { 
      id: '101', 
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '123-456-7890'
    },
    status: 'pending' as OrderStatus,
    total: 129.98,
    subtotal: 99.99,
    tax: 9.99,
    shipping: 20.00,
    createdAt: '2023-01-01T00:00:00',
    updatedAt: '2023-01-01T00:00:00',
    items: [
      { 
        product: { id: '201', name: 'Product 1', price: 49.99 },
        quantity: 1, 
        price: 49.99
      },
      { 
        product: { id: '202', name: 'Product 2', price: 50.00 },
        quantity: 1, 
        price: 50.00
      }
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
    payment_method: 'credit_card',
    notes: 'Test order notes'
  };

  const mockOrderHistory = [
    {
      id: '1',
      orderId: mockOrderId,
      status: 'pending' as OrderStatus,
      timestamp: '2023-01-01T00:00:00',
      user: 'system',
      note: 'Order created'
    }
  ];

  const mockStatusTransitions = ['processing', 'cancelled'];

  beforeEach(() => {
    vi.resetAllMocks();
    (orderService.getOrderById as any).mockResolvedValue(mockOrder);
    (orderService.getOrderHistory as any).mockResolvedValue(mockOrderHistory);
    (orderService.getAvailableStatusTransitions as any).mockResolvedValue(mockStatusTransitions);
    (orderService.updateOrderStatus as any).mockResolvedValue({...mockOrder, status: 'processing'});
    (orderService.addOrderNote as any).mockResolvedValue({
      id: '2',
      orderId: mockOrderId,
      content: 'Test note',
      timestamp: '2023-01-02T00:00:00'
    });
  });

  it('should render the OrderDetails component with order information', async () => {
    render(
      <MemoryRouter initialEntries={[`/orders/${mockOrderId}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for the API calls to resolve
    await waitFor(() => {
      // Check if the service was called with the correct order ID
      expect(orderService.getOrderById).toHaveBeenCalledWith(mockOrderId);
      
      // Check if order details are displayed
      expect(screen.getByText(`Order #${mockOrderId}`)).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
      
      // Check for product items
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      
      // Check for price information
      expect(screen.getByText('$99.99')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('$129.98')).toBeInTheDocument(); // Total
      
      // Check for shipping address
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('Test City, TS 12345')).toBeInTheDocument();
    });
  });

  it('should display order status and history', async () => {
    render(
      <MemoryRouter initialEntries={[`/orders/${mockOrderId}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check if the status is displayed
      expect(screen.getByText('Pending')).toBeInTheDocument();
      
      // Check if history was fetched
      expect(orderService.getOrderHistory).toHaveBeenCalledWith(mockOrderId);
    });

    // Find and click the history button/link
    const historyButton = screen.getByText(/history/i);
    fireEvent.click(historyButton);

    // Check if the history dialog is displayed
    await waitFor(() => {
      expect(screen.getByText('Order Timeline')).toBeInTheDocument();
      expect(screen.getByText('Order created')).toBeInTheDocument();
    });
  });

  it('should allow updating order status', async () => {
    render(
      <MemoryRouter initialEntries={[`/orders/${mockOrderId}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check if status transitions were fetched
      expect(orderService.getAvailableStatusTransitions).toHaveBeenCalledWith(mockOrderId);
    });

    // Find and click the change status button
    const changeStatusButton = screen.getByText(/change status/i);
    fireEvent.click(changeStatusButton);

    // Select the new status
    const statusSelect = screen.getByLabelText(/new status/i);
    fireEvent.change(statusSelect, { target: { value: 'processing' } });

    // Add a note
    const noteInput = screen.getByLabelText(/note/i);
    fireEvent.change(noteInput, { target: { value: 'Processing the order' } });

    // Submit the form
    const submitButton = screen.getByText(/update/i);
    fireEvent.click(submitButton);

    // Verify the service was called with the right params
    await waitFor(() => {
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        mockOrderId,
        'processing',
        'Processing the order'
      );
    });
  });

  it('should handle adding a note to an order', async () => {
    render(
      <MemoryRouter initialEntries={[`/orders/${mockOrderId}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(`Order #${mockOrderId}`)).toBeInTheDocument();
    });

    // Find and click the add note button
    const addNoteButton = screen.getByText(/add note/i);
    fireEvent.click(addNoteButton);

    // Enter a note
    const noteInput = screen.getByLabelText(/note/i);
    fireEvent.change(noteInput, { target: { value: 'Test note' } });

    // Submit the form
    const submitButton = screen.getByText(/save/i);
    fireEvent.click(submitButton);

    // Verify the service was called with the right params
    await waitFor(() => {
      expect(orderService.addOrderNote).toHaveBeenCalledWith(
        mockOrderId,
        expect.objectContaining({
          content: 'Test note'
        })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    (orderService.getOrderById as any).mockRejectedValue(new Error('Failed to fetch order'));

    render(
      <MemoryRouter initialEntries={[`/orders/${mockOrderId}`]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetails />} />
        </Routes>
      </MemoryRouter>
    );

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
}); 