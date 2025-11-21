import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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
import ManageImages from './pages/ManageImages';
import ImageUpload from './pages/ImageUpload';

function App() {
  return (
    <Router>
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
          <Route path="/manage-images" element={<ManageImages />} />
          <Route path="/upload-image" element={<ImageUpload />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
