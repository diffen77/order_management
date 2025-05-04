import React from 'react';

const ProductManagement: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Product Management</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-700 mb-4">Manage your products and inventory here.</p>
        
        <div className="flex justify-between mb-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Add New Product
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="border rounded py-2 px-3 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-center">Price</th>
                <th className="py-3 px-6 text-center">Stock</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">Sample Product 1</td>
                <td className="py-3 px-6 text-left">Category A</td>
                <td className="py-3 px-6 text-center">$99.99</td>
                <td className="py-3 px-6 text-center">25</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">Sample Product 2</td>
                <td className="py-3 px-6 text-left">Category B</td>
                <td className="py-3 px-6 text-center">$149.99</td>
                <td className="py-3 px-6 text-center">10</td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-red-500 hover:text-red-700">Delete</button>
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

export default ProductManagement; 