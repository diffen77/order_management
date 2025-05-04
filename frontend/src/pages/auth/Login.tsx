import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LocationState {
  from?: {
    pathname: string;
  };
  message?: string;
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  useEffect(() => {
    // Check for success messages passed via location state
    const state = location.state as LocationState;
    if (state?.message) {
      setSuccessMessage(state.message);
      // Clear the location state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setError(null);
      setSuccessMessage(null);
      setLoading(true);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Redirect to the page the user was trying to access, or to home
      const state = location.state as LocationState;
      const redirectTo = state?.from?.pathname || '/';
      navigate(redirectTo);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md px-4 py-8 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login to Your Account</h1>
      
      {error && (
        <div className="w-full p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="w-full p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
          {successMessage}
        </div>
      )}
      
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
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          <div className="mt-1 text-right">
            <Link to="/auth/reset-password" className="text-sm text-blue-600 hover:text-blue-500">
              Forgot password?
            </Link>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 