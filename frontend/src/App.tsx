import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layout components
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const UpdatePassword = lazy(() => import('./pages/auth/UpdatePassword'));
const ProductManagement = lazy(() => import('./pages/producer/ProductManagement'));
const FormBuilder = lazy(() => import('./pages/producer/FormBuilder'));
const Statistics = lazy(() => import('./pages/producer/Statistics'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Order pages
const OrdersList = lazy(() => import('./pages/orders/OrdersList'));
const OrderDetails = lazy(() => import('./pages/orders/OrderDetails'));
const OrderForm = lazy(() => import('./pages/orders/OrderForm'));
const OrderTimeline = lazy(() => import('./pages/orders/OrderTimeline'));
const OrderHistoryPage = lazy(() => import('./pages/orders/OrderHistoryPage'));

// Admin pages
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="update-password" element={<UpdatePassword />} />
            </Route>

            {/* Unauthorized page */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes for all authenticated users */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              
              {/* Order routes - accessible to all users */}
              <Route path="orders">
                <Route index element={<OrdersList />} />
                <Route path=":id" element={<OrderDetails />} />
                <Route path="new" element={<OrderForm />} />
                <Route path=":id/edit" element={<OrderForm />} />
                <Route path=":id/timeline" element={<OrderTimeline />} />
                <Route path=":id/history" element={<OrderHistoryPage />} />
              </Route>
              
              {/* Producer and Admin routes */}
              <Route path="products" element={
                <RoleBasedRoute allowedRoles={['producer', 'admin']}>
                  <ProductManagement />
                </RoleBasedRoute>
              } />
              
              <Route path="forms" element={
                <RoleBasedRoute allowedRoles={['producer', 'admin']}>
                  <FormBuilder />
                </RoleBasedRoute>
              } />
              
              <Route path="statistics" element={
                <RoleBasedRoute allowedRoles={['producer', 'admin']}>
                  <Statistics />
                </RoleBasedRoute>
              } />
              
              {/* Admin-only routes */}
              <Route path="admin">
                <Route path="users" element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </RoleBasedRoute>
                } />
                <Route path="settings" element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <SystemSettings />
                  </RoleBasedRoute>
                } />
              </Route>
            </Route>

            {/* Not found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App; 