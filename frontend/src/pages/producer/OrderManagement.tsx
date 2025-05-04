import React from 'react';

const OrderManagement: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order Management</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-700 mb-4">View and manage your customer orders here.</p>
        
        <div className="flex justify-between mb-4">
          <div className="flex space-x-2">
            <select className="border rounded py-2 px-3">
              <option>All Orders</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              className="border rounded py-2 px-3 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Order ID</th>
                <th className="py-3 px-6 text-left">Customer</th>
                <th className="py-3 px-6 text-center">Date</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Total</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">#ORD-123456</td>
                <td className="py-3 px-6 text-left">John Doe</td>
                <td className="py-3 px-6 text-center">2023-08-15</td>
                <td className="py-3 px-6 text-center">
                  <span className="bg-yellow-200 text-yellow-800 py-1 px-3 rounded-full text-xs">Pending</span>
                </td>
                <td className="py-3 px-6 text-center">$249.99</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">View</button>
                    <button className="text-green-500 hover:text-green-700">Process</button>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">#ORD-123457</td>
                <td className="py-3 px-6 text-left">Jane Smith</td>
                <td className="py-3 px-6 text-center">2023-08-14</td>
                <td className="py-3 px-6 text-center">
                  <span className="bg-green-200 text-green-800 py-1 px-3 rounded-full text-xs">Shipped</span>
                </td>
                <td className="py-3 px-6 text-center">$149.99</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">View</button>
                    <button className="text-purple-500 hover:text-purple-700">Track</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement; 