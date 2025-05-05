import React, { useEffect, useState } from 'react';
import { get } from '../../services/api';
import { createOrder } from '../../services/order-service';
import { getProducts } from '../../services/product-service';
import { API_ENDPOINTS } from '../../constants';
import { Customer, Product, OrderItem, Address } from '../../types/models';
import 'react/jsx-runtime';

const NewOrder: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address>({ street: '', city: '', state: '', postalCode: '', country: '' });
  const [billingAddress, setBillingAddress] = useState<Address>({ street: '', city: '', state: '', postalCode: '', country: '' });
  const [notes, setNotes] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch customers
    get<{ data: Customer[] }>(API_ENDPOINTS.CUSTOMERS)
      .then((res) => setCustomers(res.data))
      .catch(() => setError('Failed to load customers'));
    // Fetch products
    getProducts()
      .then((res) => setProducts(res.data))
      .catch(() => setError('Failed to load products'));
  }, []);

  const handleAddProduct = () => {
    const product = products.find((p: Product) => p.id === selectedProduct);
    if (!product) return;
    setOrderItems([
      ...orderItems,
      {
        id: '',
        orderId: '',
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        sku: product.sku,
      },
    ]);
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleAddressChange = (type: 'shipping' | 'billing', field: keyof Address, value: string) => {
    if (type === 'shipping') {
      setShippingAddress({ ...shippingAddress, [field]: value });
    } else {
      setBillingAddress({ ...billingAddress, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!selectedCustomer) {
      setSubmitError('Please select a customer.');
      return;
    }
    if (orderItems.length === 0) {
      setSubmitError('Please add at least one product.');
      return;
    }
    // Basic address validation
    const requiredFields: (keyof Address)[] = ['street', 'city', 'state', 'postalCode', 'country'];
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        setSubmitError('Please fill out all shipping address fields.');
        return;
      }
      if (!billingAddress[field]) {
        setSubmitError('Please fill out all billing address fields.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const totalAmount = orderItems.reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0);
      const orderData = {
        customerId: selectedCustomer,
        shippingAddress,
        billingAddress,
        items: orderItems,
        notes,
        totalAmount,
        paymentStatus: 'pending',
      };
      const order = await createOrder(orderData as any); // Type cast for omitted fields
      setSubmitSuccess('Order created successfully!');
      // Redirect to order details after short delay
      setTimeout(() => {
        window.location.href = `/orders/${order.id}`;
      }, 1200);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>Create New Order</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      {submitError && <div style={{ color: 'red', marginBottom: 16 }}>{submitError}</div>}
      {submitSuccess && <div style={{ color: 'green', marginBottom: 16 }}>{submitSuccess}</div>}
      <form onSubmit={handleSubmit}>
        {/* Customer selection */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="customer" style={{ display: 'block', fontWeight: 500 }}>Customer</label>
          <select
            id="customer"
            value={selectedCustomer}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCustomer(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          >
            <option value="">Select a customer</option>
            {customers.map((customer: Customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.email})
              </option>
            ))}
          </select>
        </div>
        {/* Product selection */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="product" style={{ display: 'block', fontWeight: 500 }}>Product</label>
          <select
            id="product"
            value={selectedProduct}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProduct(e.target.value)}
            style={{ width: '70%', padding: 8, marginTop: 4, marginRight: 8 }}
          >
            <option value="">Select a product</option>
            {products.map((product: Product) => (
              <option key={product.id} value={product.id}>
                {product.name} (Stock: {product.inventoryCount})
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Number(e.target.value))}
            style={{ width: 60, marginRight: 8 }}
          />
          <button type="button" onClick={handleAddProduct} disabled={!selectedProduct || quantity < 1}>
            Add
          </button>
        </div>
        {/* Order items list */}
        {orderItems.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 500 }}>Order Items</h3>
            <ul>
              {orderItems.map((item: OrderItem, idx: number) => (
                <li key={idx}>
                  {item.productName} x {item.quantity} (${item.unitPrice} each) = ${item.totalPrice}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Shipping Address */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontWeight: 500 }}>Shipping Address</h3>
          {['street', 'city', 'state', 'postalCode', 'country'].map((field) => (
            <div key={field} style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="text"
                value={shippingAddress[field as keyof Address] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange('shipping', field as keyof Address, e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </div>
          ))}
        </div>
        {/* Billing Address */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontWeight: 500 }}>Billing Address</h3>
          {['street', 'city', 'state', 'postalCode', 'country'].map((field) => (
            <div key={field} style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="text"
                value={billingAddress[field as keyof Address] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAddressChange('billing', field as keyof Address, e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </div>
          ))}
        </div>
        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="notes" style={{ display: 'block', fontWeight: 500 }}>Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            style={{ width: '100%', padding: 8, minHeight: 60 }}
          />
        </div>
        {/* Order Preview */}
        <div style={{ marginBottom: 16, background: '#f9f9f9', padding: 12, borderRadius: 6 }}>
          <h3 style={{ fontWeight: 500 }}>Order Preview</h3>
          <div>Total Items: {orderItems.length}</div>
          <div>Total Amount: ${orderItems.reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0)}</div>
        </div>
        <button type="submit" disabled={submitting} style={{ padding: '10px 24px', fontWeight: 600 }}>
          {submitting ? 'Submitting...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
};

export default NewOrder; 