/**
 * Tests for the order service module.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { 
  getOrders, getOrderById, createOrder, updateOrder, 
  updateOrderStatus, cancelOrder, getOrderHistory, getOrderTimeline,
  addOrderNote, getAvailableStatusTransitions, getOrdersByCustomer
} from '../../services/order-service';
import * as apiModule from '../../services/api';
import { API_ENDPOINTS } from '../../constants';
import { OrderStatus } from '../../types/models';

// Mock the API module
vi.mock('../../services/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn()
}));

describe('Order Service', () => {
  const mockOrderId = '123';
  const mockCustomerId = '456';
  const mockOrder = {
    id: mockOrderId,
    status: 'pending' as OrderStatus,
    customerName: 'Test Customer',
    total: 100
  };
  const mockOrderHistory = [
    {
      id: '1',
      orderId: mockOrderId,
      status: 'pending' as OrderStatus,
      timestamp: '2023-01-01T00:00:00',
      user: 'user1'
    }
  ];
  const mockResponse = { data: mockOrder };
  const mockHistoryResponse = { data: mockOrderHistory };
  const mockErrorResponse = new Error('API Error');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should get a list of orders', async () => {
      // Mock the API response
      (apiModule.get as any).mockResolvedValue({ data: { items: [mockOrder], total: 1 } });

      // Call the function
      const result = await getOrders();

      // Verify the API was called correctly
      expect(apiModule.get).toHaveBeenCalledWith(API_ENDPOINTS.ORDERS, { params: undefined });

      // Verify the result
      expect(result).toEqual({ items: [mockOrder], total: 1 });
    });

    it('should handle errors when getting orders', async () => {
      // Mock the API error
      (apiModule.get as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      await expect(getOrders()).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('getOrderById', () => {
    it('should get a specific order by ID', async () => {
      // Mock the API response
      (apiModule.get as any).mockResolvedValue(mockResponse);

      // Call the function
      const result = await getOrderById(mockOrderId);

      // Verify the API was called correctly
      expect(apiModule.get).toHaveBeenCalledWith(`${API_ENDPOINTS.ORDERS}/${mockOrderId}`);

      // Verify the result
      expect(result).toEqual(mockOrder);
    });

    it('should handle errors when getting an order by ID', async () => {
      // Mock the API error
      (apiModule.get as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      await expect(getOrderById(mockOrderId)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      // Mock the API response
      (apiModule.post as any).mockResolvedValue(mockResponse);

      // Call the function
      const orderData = { customer_id: mockCustomerId, items: [] };
      const result = await createOrder(orderData as any);

      // Verify the API was called correctly
      expect(apiModule.post).toHaveBeenCalledWith(API_ENDPOINTS.ORDERS, orderData);

      // Verify the result
      expect(result).toEqual(mockOrder);
    });

    it('should handle errors when creating an order', async () => {
      // Mock the API error
      (apiModule.post as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      const orderData = { customer_id: mockCustomerId, items: [] };
      await expect(createOrder(orderData as any)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('updateOrder', () => {
    it('should update an existing order', async () => {
      // Mock the API response
      (apiModule.put as any).mockResolvedValue(mockResponse);

      // Call the function
      const orderData = { notes: 'Updated notes' };
      const result = await updateOrder(mockOrderId, orderData as any);

      // Verify the API was called correctly
      expect(apiModule.put).toHaveBeenCalledWith(`${API_ENDPOINTS.ORDERS}/${mockOrderId}`, orderData);

      // Verify the result
      expect(result).toEqual(mockOrder);
    });

    it('should handle errors when updating an order', async () => {
      // Mock the API error
      (apiModule.put as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      const orderData = { notes: 'Updated notes' };
      await expect(updateOrder(mockOrderId, orderData as any)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update an order status', async () => {
      // Mock the API response
      (apiModule.patch as any).mockResolvedValue(mockResponse);

      // Call the function
      const status = 'processing' as OrderStatus;
      const note = 'Status update note';
      const result = await updateOrderStatus(mockOrderId, status, note);

      // Verify the API was called correctly
      expect(apiModule.patch).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ORDERS}/${mockOrderId}/status`, 
        { status, notes: note }
      );

      // Verify the result
      expect(result).toEqual(mockOrder);
    });

    it('should handle errors when updating an order status', async () => {
      // Mock the API error
      (apiModule.patch as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      const status = 'processing' as OrderStatus;
      await expect(updateOrderStatus(mockOrderId, status)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      // Mock the API response
      (apiModule.patch as any).mockResolvedValue({ data: null });

      // Call the function
      const reason = 'Cancellation reason';
      await cancelOrder(mockOrderId, reason);

      // Verify the API was called correctly
      expect(apiModule.patch).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ORDERS}/${mockOrderId}/cancel`, 
        { reason }
      );
    });

    it('should handle errors when cancelling an order', async () => {
      // Mock the API error
      (apiModule.patch as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      await expect(cancelOrder(mockOrderId)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('getOrderHistory', () => {
    it('should get order history', async () => {
      // Mock the API response
      (apiModule.get as any).mockResolvedValue(mockHistoryResponse);

      // Call the function
      const result = await getOrderHistory(mockOrderId);

      // Verify the API was called correctly
      expect(apiModule.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ORDERS}/${mockOrderId}/history`
      );

      // Verify the result
      expect(result).toEqual(mockOrderHistory);
    });

    it('should handle errors when getting order history', async () => {
      // Mock the API error
      (apiModule.get as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      await expect(getOrderHistory(mockOrderId)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('getOrderTimeline', () => {
    it('should get order timeline', async () => {
      // Mock the API response
      (apiModule.get as any).mockResolvedValue(mockHistoryResponse);

      // Call the function
      const result = await getOrderTimeline(mockOrderId);

      // Verify the API was called correctly
      expect(apiModule.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ORDERS}/${mockOrderId}/timeline`
      );

      // Verify the result
      expect(result).toEqual(mockOrderHistory);
    });

    it('should handle errors when getting order timeline', async () => {
      // Mock the API error
      (apiModule.get as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      await expect(getOrderTimeline(mockOrderId)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('addOrderNote', () => {
    it('should add a note to an order', async () => {
      // Mock the API response
      const noteResponse = { data: { id: '1', content: 'Test note' } };
      (apiModule.post as any).mockResolvedValue(noteResponse);

      // Call the function
      const note = { orderId: mockOrderId, content: 'Test note' };
      const result = await addOrderNote(mockOrderId, note);

      // Verify the API was called correctly
      expect(apiModule.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ORDERS}/${mockOrderId}/notes`, 
        note
      );

      // Verify the result
      expect(result).toEqual(noteResponse.data);
    });

    it('should handle errors when adding a note', async () => {
      // Mock the API error
      (apiModule.post as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      const note = { orderId: mockOrderId, content: 'Test note' };
      await expect(addOrderNote(mockOrderId, note)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('getAvailableStatusTransitions', () => {
    it('should get available status transitions', async () => {
      // Mock the API response
      const transitions = ['processing', 'cancelled'];
      const transitionsResponse = { data: transitions };
      (apiModule.get as any).mockResolvedValue(transitionsResponse);

      // Call the function
      const result = await getAvailableStatusTransitions(mockOrderId);

      // Verify the API was called correctly
      expect(apiModule.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ORDERS}/${mockOrderId}/status/transitions`
      );

      // Verify the result
      expect(result).toEqual(transitions);
    });

    it('should handle errors when getting status transitions', async () => {
      // Mock the API error
      (apiModule.get as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      await expect(getAvailableStatusTransitions(mockOrderId)).rejects.toThrow(mockErrorResponse);
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should get orders for a specific customer', async () => {
      // Mock the API response
      (apiModule.get as any).mockResolvedValue({ data: { items: [mockOrder], total: 1 } });

      // Call the function
      const result = await getOrdersByCustomer(mockCustomerId);

      // Verify the API was called correctly
      expect(apiModule.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.CUSTOMERS}/${mockCustomerId}/orders`, 
        { params: undefined }
      );

      // Verify the result
      expect(result).toEqual({ items: [mockOrder], total: 1 });
    });

    it('should handle errors when getting customer orders', async () => {
      // Mock the API error
      (apiModule.get as any).mockRejectedValue(mockErrorResponse);

      // Call the function and expect it to throw
      await expect(getOrdersByCustomer(mockCustomerId)).rejects.toThrow(mockErrorResponse);
    });
  });
}); 