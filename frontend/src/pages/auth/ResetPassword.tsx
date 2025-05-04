import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setError(null);
      setSuccess(false);
      setLoading(true);
      
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      
      {error && (
        <div className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div className="w-full p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          Password reset instructions have been sent to your email address.
        </div>
      )}
      
      {!success ? (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <p className="mb-4">Check your email for a password reset link.</p>
          <button
            onClick={() => setSuccess(false)}
            className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Send Another Reset Link
          </button>
        </div>
      )}
      
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

export default ResetPassword; 