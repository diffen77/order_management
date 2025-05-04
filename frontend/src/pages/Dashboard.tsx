import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-700">Welcome to your dashboard! This is where you'll find an overview of your account activity.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Products</h2>
            <p className="text-gray-600">Manage your products and inventory</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Orders</h2>
            <p className="text-gray-600">View and process your orders</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Forms</h2>
            <p className="text-gray-600">Create and manage custom forms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 