import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import UpsertCategory from './pages/UpsertCategory';
import Books from './pages/Books';
import UpsertBook from './pages/UpsertBook';
import Schools from './pages/Schools';
import UpsertSchool from './pages/UpsertSchool';
import Grades from './pages/Grades';
import UpsertGrade from './pages/UpsertGrade';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Customers from './pages/Customers';
import EmailConfig from './pages/EmailConfig';
import ForgotPassword from './pages/ForgotPassword';
import authService from './services/auth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts

    const checkAuth = async () => {
      // Check if token exists first
      if (!authService.isAuthenticated()) {
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      // Verify token with server
      try {
        const result = await authService.verifyToken();
        if (isMounted) {
          setIsAuthenticated(result.success || false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false;
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

function App() {
  return (
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
                  <Route path="/upsert-book" element={<UpsertBook />} />
                  <Route path="/get-all-schools" element={<Schools />} />
                  <Route path="/upsert-school" element={<UpsertSchool />} />
                  <Route path="/get-all-grades" element={<Grades />} />
                  <Route path="/upsert-grade" element={<UpsertGrade />} />
                  <Route path="/get-all-orders" element={<Orders />} />
                  <Route path="/get-order-details" element={<OrderDetails />} />
                  <Route path="/all-customers" element={<Customers />} />
                  <Route path="/email-config" element={<EmailConfig />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
