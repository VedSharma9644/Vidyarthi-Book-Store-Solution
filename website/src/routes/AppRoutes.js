import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../components/auth/LoginScreen';
import HomeScreen from '../components/HomeScreen';
import SearchScreen from '../components/SearchScreen';
import SchoolPage from '../components/SchoolPage';
import GradeSectionsPage from '../components/GradeSectionsPage';
import GradeBooksPage from '../components/GradeBooksPage';
import CartPage from '../components/CartPage';
import CheckoutPage from '../components/CheckoutPage';
import ProfilePage from '../components/ProfilePage';
import ProfileCompletePage from '../components/ProfileCompletePage';
import ShippingAddressesPage from '../components/ShippingAddressesPage';
import StudentsPage from '../components/StudentsPage';
import OrderHistoryPage from '../components/OrderHistoryPage';
import OrderDetailsPage from '../components/OrderDetailsPage';
import ProtectedRoute from './ProtectedRoute';
import LoadingScreen from '../components/common/LoadingScreen';

const AppRoutes = () => {
  const { isLoggedIn, authReady } = useAuth();

  if (!authReady) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isLoggedIn ? <Navigate to="/" replace /> : <LoginScreen />}
      />
      <Route path="/register" element={<Navigate to="/login" replace />} />

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
        path="/profile/complete"
        element={
          <ProtectedRoute>
            <ProfileCompletePage />
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
        path="/profile/students"
        element={
          <ProtectedRoute>
            <StudentsPage />
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
        path="/grade/:gradeId/sections"
        element={
          <ProtectedRoute>
            <GradeSectionsPage />
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

      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
