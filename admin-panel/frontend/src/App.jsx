import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { StyleSheetManager } from 'styled-components';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import UpsertCategory from './pages/UpsertCategory';
import Books from './pages/Books';
import BulkUploadBooks from './pages/BulkUploadBooks';
import UpsertBook from './pages/UpsertBook';
import Inventory from './pages/Inventory';
import Schools from './pages/Schools';
import UpsertSchool from './pages/UpsertSchool';
import Grades from './pages/Grades';
import Subgrades from './pages/Subgrades';
import UpsertGrade from './pages/UpsertGrade';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Customers from './pages/Customers';
import EmailConfig from './pages/EmailConfig';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import authService from './services/auth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const result = await authService.verifyToken();
        if (!cancelled) {
          setIsAuthenticated(Boolean(result.success));
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (!cancelled) {
          // Keep session on transient network errors if token still present
          setIsAuthenticated(authService.isAuthenticated());
          setLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Prevent styled-components from forwarding 'align' to the DOM (fixes react-data-table-component warning)
const shouldForwardProp = (prop) => prop !== 'align';

function App() {
  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/admin-dashboard" element={<Dashboard />} />
                  <Route path="/get-all-categories" element={<Categories />} />
                  <Route path="/upsert-category" element={<UpsertCategory />} />
                  <Route path="/get-all-books" element={<Books />} />
                  <Route path="/bulk-upload-books" element={<BulkUploadBooks />} />
                  <Route path="/upsert-book" element={<UpsertBook />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/get-all-schools" element={<Schools />} />
                  <Route path="/upsert-school" element={<UpsertSchool />} />
                  <Route path="/get-all-grades" element={<Grades />} />
                  <Route path="/subgrades" element={<Subgrades />} />
                  <Route path="/upsert-grade" element={<UpsertGrade />} />
                  <Route path="/get-all-orders" element={<Orders />} />
                  <Route path="/get-order-details" element={<OrderDetails />} />
                  <Route path="/all-customers" element={<Customers />} />
                  <Route path="/email-config" element={<EmailConfig />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/admin-update-password" element={<Navigate to="/change-password" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
    </StyleSheetManager>
  );
}

export default App;
