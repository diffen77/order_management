import { Routes, Route, Navigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { lazy, Suspense } from 'react';

// Layout components
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ProductManagement = lazy(() => import('./pages/producer/ProductManagement'));
const OrderManagement = lazy(() => import('./pages/producer/OrderManagement'));
const FormBuilder = lazy(() => import('./pages/producer/FormBuilder'));
const Statistics = lazy(() => import('./pages/producer/Statistics'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const { isLoading, session } = useSessionContext();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={session ? <Dashboard /> : <Navigate to="/auth/login" />} />
          <Route path="products" element={session ? <ProductManagement /> : <Navigate to="/auth/login" />} />
          <Route path="orders" element={session ? <OrderManagement /> : <Navigate to="/auth/login" />} />
          <Route path="forms" element={session ? <FormBuilder /> : <Navigate to="/auth/login" />} />
          <Route path="statistics" element={session ? <Statistics /> : <Navigate to="/auth/login" />} />
        </Route>

        {/* Not found route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App; 