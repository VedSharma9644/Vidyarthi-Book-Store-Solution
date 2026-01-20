import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import './TopNav.css';

const TopNav = ({ onToggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand navbar-theme shadow-lg">
      <a className="sidebar-toggle d-flex me-2" onClick={onToggleSidebar} style={{ cursor: 'pointer' }}>
        <i className="hamburger align-self-center"></i>
      </a>
      <div className="navbar-collapse collapse">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item dropdown ms-lg-2" ref={dropdownRef}>
            <a 
              className="nav-link dropdown-toggle position-relative" 
              href="#" 
              id="userDropdown" 
              onClick={(e) => {
                e.preventDefault();
                setDropdownOpen(!dropdownOpen);
              }}
            >
              <i className="align-middle fas fa-user-circle"></i>
            </a>
            <div 
              className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? 'show' : ''}`}
              style={{ display: dropdownOpen ? 'block' : 'none' }}
            >
              <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                <i className="align-middle me-2 fas fa-fw fa-user"></i> Admin
              </a>
              <div className="dropdown-divider"></div>
              <a 
                href="#" 
                className="dropdown-item logout-link" 
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                <i className="align-middle me-2 fas fa-fw fa-power-off text-danger"></i>
                <span className="align-middle">Logout</span>
              </a>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default TopNav;

