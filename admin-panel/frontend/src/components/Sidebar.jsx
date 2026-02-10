import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  return (
    <nav id="sidebar" className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <a className="sidebar-brand" href="#" style={{ background: 'white' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12H10V5H4V12Z" fill="#4e73df" stroke="#2e59d9" strokeWidth="0.5"></path>
          <path d="M4 19H10V14H4V19Z" fill="#4e73df" stroke="#2e59d9" strokeWidth="0.5"></path>
          <path d="M14 19H20V10H14V19Z" fill="#4e73df" stroke="#2e59d9" strokeWidth="0.5"></path>
          <path d="M14 8H20V5H14V8Z" fill="#4e73df" stroke="#2e59d9" strokeWidth="0.5"></path>
        </svg>
        <span className="text-black">ADMIN</span>
      </a>
      
      <div className="sidebar-content">
        <ul className="sidebar-nav">
          <li className={`sidebar-item ${isActive('/admin-dashboard') || isActive('/') ? 'active' : ''}`}>
            <Link to="/admin-dashboard" className="sidebar-link">
              <i className="align-middle me-2 fas fa-fw fa-tachometer-alt"></i>
              <span className="align-middle">Dashboard</span>
            </Link>
          </li>

          {/* Profile Section */}
          <li className="sidebar-item">
            <a onClick={(e) => { e.preventDefault(); toggleMenu('pages'); }} className={`sidebar-link ${!openMenus.pages ? 'collapsed' : ''}`} style={{ cursor: 'pointer' }}>
              <i className="align-middle me-2 fas fa-fw fa-user-cog"></i>
              <span className="align-middle">Profile</span>
            </a>
            <ul id="pages" className={`sidebar-dropdown list-unstyled ${openMenus.pages ? 'show' : 'collapse'}`}>
              <li className="sidebar-item">
                <a className="sidebar-link" href="/admin-update-password">
                  <i className="fas fa-lock me-2"></i>Change Password
                </a>
              </li>
            </ul>
          </li>

          {/* Settings Section */}
          <li className="sidebar-item">
            <a onClick={(e) => { e.preventDefault(); toggleMenu('settings'); }} className={`sidebar-link ${!openMenus.settings ? 'collapsed' : ''}`} style={{ cursor: 'pointer' }}>
              <i className="align-middle me-2 fas fa-fw fa-cogs"></i>
              <span className="align-middle">Settings</span>
            </a>
            <ul id="settings" className={`sidebar-dropdown list-unstyled ${openMenus.settings ? 'show' : 'collapse'}`}>
              <li className={`sidebar-item ${isActive('/email-config') ? 'active' : ''}`}>
                <Link to="/email-config" className="sidebar-link">
                  <i className="fas fa-envelope me-2"></i>Email Configuration
                </Link>
              </li>
            </ul>
          </li>

          {/* Product Management */}
          <li className="sidebar-item">
            <a onClick={(e) => { e.preventDefault(); toggleMenu('books'); }} className={`sidebar-link ${!openMenus.books ? 'collapsed' : ''}`} style={{ cursor: 'pointer' }}>
              <i className="align-middle me-2 fas fa-fw fa-book"></i>
              <span className="align-middle">Product Management</span>
            </a>
            <ul id="books" className={`sidebar-dropdown list-unstyled ${openMenus.books ? 'show' : 'collapse'}`}>
              <li className={`sidebar-item ${isActive('/get-all-categories') ? 'active' : ''}`}>
                <Link to="/get-all-categories" className="sidebar-link">
                  <i className="fas fa-tags me-2"></i>Category
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/get-all-books') ? 'active' : ''}`}>
                <Link to="/get-all-books" className="sidebar-link">
                  <i className="fas fa-book-open me-2"></i>Products
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/inventory') ? 'active' : ''}`}>
                <Link to="/inventory" className="sidebar-link">
                  <i className="fas fa-boxes me-2"></i>Inventory
                </Link>
              </li>
            </ul>
          </li>

          {/* Order Management */}
          <li className="sidebar-item">
            <a onClick={(e) => { e.preventDefault(); toggleMenu('orders'); }} className={`sidebar-link ${!openMenus.orders ? 'collapsed' : ''}`} style={{ cursor: 'pointer' }}>
              <i className="align-middle me-2 fas fa-fw fa-shopping-cart"></i>
              <span className="align-middle">Order Management</span>
            </a>
            <ul id="orders" className={`sidebar-dropdown list-unstyled ${openMenus.orders ? 'show' : 'collapse'}`}>
              <li className={`sidebar-item ${isActive('/get-all-orders') ? 'active' : ''}`}>
                <Link to="/get-all-orders" className="sidebar-link">
                  <i className="fas fa-clipboard-list me-2"></i>Orders
                </Link>
              </li>
            </ul>
          </li>

          {/* Schools Management */}
          <li className="sidebar-item">
            <a onClick={(e) => { e.preventDefault(); toggleMenu('schools'); }} className={`sidebar-link ${!openMenus.schools ? 'collapsed' : ''}`} style={{ cursor: 'pointer' }}>
              <i className="align-middle me-2 fas fa-fw fa-school"></i>
              <span className="align-middle">Schools</span>
            </a>
            <ul id="schools" className={`sidebar-dropdown list-unstyled ${openMenus.schools ? 'show' : 'collapse'}`}>
              <li className={`sidebar-item ${isActive('/get-all-schools') ? 'active' : ''}`}>
                <Link to="/get-all-schools" className="sidebar-link">
                  <i className="fas fa-university me-2"></i>Manage Schools
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/get-all-grades') ? 'active' : ''}`}>
                <Link to="/get-all-grades" className="sidebar-link">
                  <i className="fas fa-graduation-cap me-2"></i>Manage Grade
                </Link>
              </li>
            </ul>
          </li>

          {/* Customers */}
          <li className="sidebar-item">
            <a onClick={(e) => { e.preventDefault(); toggleMenu('customers'); }} className={`sidebar-link ${!openMenus.customers ? 'collapsed' : ''}`} style={{ cursor: 'pointer' }}>
              <i className="align-middle me-2 fas fa-fw fa-users"></i>
              <span className="align-middle">Customers</span>
            </a>
            <ul id="customers" className={`sidebar-dropdown list-unstyled ${openMenus.customers ? 'show' : 'collapse'}`}>
              <li className={`sidebar-item ${isActive('/all-customers') ? 'active' : ''}`}>
                <Link to="/all-customers" className="sidebar-link">
                  <i className="fas fa-user-friends me-2"></i>All Customers
                </Link>
              </li>
            </ul>
          </li>

          {/* Logout Section */}
          <li className="sidebar-header">Account</li>
          <li className="sidebar-item">
            <a href="#" className="sidebar-link collapsed logout-link">
              <i className="align-middle me-2 fas fa-fw fa-sign-out-alt text-danger"></i>
              <span className="align-middle">Logout</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;

