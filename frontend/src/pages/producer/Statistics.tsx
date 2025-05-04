import React from 'react';

const Statistics: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Statistics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">Total Orders</h2>
          <p className="text-3xl font-bold mt-2">128</p>
          <p className="text-green-500 text-sm mt-2">↑ 24% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">Revenue</h2>
          <p className="text-3xl font-bold mt-2">$12,346</p>
          <p className="text-green-500 text-sm mt-2">↑ 18% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">Average Order Value</h2>
          <p className="text-3xl font-bold mt-2">$96.45</p>
          <p className="text-red-500 text-sm mt-2">↓ 3% from last month</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-gray-500 text-sm font-medium">New Customers</h2>
          <p className="text-3xl font-bold mt-2">42</p>
          <p className="text-green-500 text-sm mt-2">↑ 11% from last month</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Sales by Product</h2>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Orders Over Time</h2>
          <div className="h-80 flex items-center justify-center">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Sample Product 1</span>
              <span className="text-gray-900 font-medium">$4,320</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Sample Product 2</span>
              <span className="text-gray-900 font-medium">$3,850</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '76%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Sample Product 3</span>
              <span className="text-gray-900 font-medium">$2,982</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '59%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-4 text-sm">#ORD-123456</td>
                  <td className="py-2 px-4 text-sm">John Doe</td>
                  <td className="py-2 px-4 text-sm text-right">$249.99</td>
                  <td className="py-2 px-4 text-sm text-right">
                    <span className="bg-yellow-200 text-yellow-800 py-1 px-3 rounded-full text-xs">Pending</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-4 text-sm">#ORD-123457</td>
                  <td className="py-2 px-4 text-sm">Jane Smith</td>
                  <td className="py-2 px-4 text-sm text-right">$149.99</td>
                  <td className="py-2 px-4 text-sm text-right">
                    <span className="bg-green-200 text-green-800 py-1 px-3 rounded-full text-xs">Shipped</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-sm">#ORD-123458</td>
                  <td className="py-2 px-4 text-sm">Robert Johnson</td>
                  <td className="py-2 px-4 text-sm text-right">$99.99</td>
                  <td className="py-2 px-4 text-sm text-right">
                    <span className="bg-blue-200 text-blue-800 py-1 px-3 rounded-full text-xs">Processing</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics; 