import React from 'react';

const FormBuilder: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Form Builder</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-700 mb-4">Create and manage custom forms for your products here.</p>
        
        <div className="flex justify-between mb-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Create New Form
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search forms..."
              className="border rounded py-2 px-3 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Form Name</th>
                <th className="py-3 px-6 text-left">Related Product</th>
                <th className="py-3 px-6 text-center">Fields</th>
                <th className="py-3 px-6 text-center">Created</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">Customer Information</td>
                <td className="py-3 px-6 text-left">All Products</td>
                <td className="py-3 px-6 text-center">5</td>
                <td className="py-3 px-6 text-center">2023-07-15</td>
                <td className="py-3 px-6 text-center">
                  <span className="bg-green-200 text-green-800 py-1 px-3 rounded-full text-xs">Active</span>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-green-500 hover:text-green-700">Preview</button>
                    <button className="text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">Product Feedback</td>
                <td className="py-3 px-6 text-left">Sample Product 1</td>
                <td className="py-3 px-6 text-center">8</td>
                <td className="py-3 px-6 text-center">2023-08-01</td>
                <td className="py-3 px-6 text-center">
                  <span className="bg-yellow-200 text-yellow-800 py-1 px-3 rounded-full text-xs">Draft</span>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex item-center justify-center space-x-2">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-green-500 hover:text-green-700">Preview</button>
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

export default FormBuilder; 