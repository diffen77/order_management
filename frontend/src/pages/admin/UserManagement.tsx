import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import usePermissions from '../../hooks/usePermissions';
import { UserProfile, UserRole } from '../../types/auth';

const UserManagement: React.FC = () => {
  const { can } = usePermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with actual API call in production
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockUsers: UserProfile[] = [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: '2023-01-01',
        },
        {
          id: '2',
          email: 'producer@example.com',
          name: 'Producer User',
          role: 'producer',
          companyName: 'Acme Foods',
          createdAt: '2023-01-15',
        },
        {
          id: '3',
          email: 'staff@example.com',
          name: 'Staff User',
          role: 'staff',
          companyName: 'Acme Foods',
          createdAt: '2023-02-01',
        }
      ];
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    // This would be an API call in a real application
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const handleDeleteUser = (userId: string) => {
    // This would be an API call in a real application
    setUsers(users.filter(user => user.id !== userId));
  };

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={!can('create:users')}
        >
          Add New User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={!can('update:users')}
                    className="border rounded p-1"
                  >
                    <option value="admin">Admin</option>
                    <option value="producer">Producer</option>
                    <option value="staff">Staff</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.companyName || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={!can('delete:users')}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement; 