import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../components/auth/LoginScreen';
import RegisterScreen from '../components/auth/RegisterScreen';
import HomeScreen from '../components/HomeScreen';
import SearchScreen from '../components/SearchScreen';
import SchoolPage from '../components/SchoolPage';
import GradeBooksPage from '../components/GradeBooksPage';
import CartPage from '../components/CartPage';
import CheckoutPage from '../components/CheckoutPage';
import ProfilePage from '../components/ProfilePage';
import ShippingAddressesPage from '../components/ShippingAddressesPage';
import OrderHistoryPage from '../components/OrderHistoryPage';
import OrderDetailsPage from '../components/OrderDetailsPage';
import ProtectedRoute from './ProtectedRoute';
import LoadingScreen from '../components/common/LoadingScreen';

const AppRoutes = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isLoggedIn ? <Navigate to="/" replace /> : <LoginScreen />} 
      />
      <Route 
        path="/register" 
        element={isLoggedIn ? <Navigate to="/" replace /> : <RegisterScreen />} 
      />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/shipping-addresses"
        element={
          <ProtectedRoute>
            <ShippingAddressesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/school/:schoolId"
        element={
          <ProtectedRoute>
            <SchoolPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grade/:gradeId"
        element={
          <ProtectedRoute>
            <GradeBooksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrderHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrderDetailsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Catch all - redirect to home if logged in, login if not */}
      <Route 
        path="*" 
        element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;

