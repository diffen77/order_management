import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, with at least one letter and one number
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and contain at least one letter and one number');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await updatePassword(password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Password updated successfully, redirect to login
      navigate('/auth/login', { 
        state: { 
          message: 'Your password has been updated successfully. Please log in with your new password.' 
        } 
      });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Update Your Password</h1>
      
      {error && (
        <div className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default UpdatePassword; 