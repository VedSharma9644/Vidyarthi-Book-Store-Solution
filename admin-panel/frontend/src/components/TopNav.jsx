import './TopNav.css';

const TopNav = ({ onToggleSidebar }) => {
  return (
    <nav className="navbar navbar-expand navbar-theme shadow-lg">
      <a className="sidebar-toggle d-flex me-2" onClick={onToggleSidebar} style={{ cursor: 'pointer' }}>
        <i className="hamburger align-self-center"></i>
      </a>
      <div className="navbar-collapse collapse">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item dropdown ms-lg-2">
            <a className="nav-link dropdown-toggle position-relative" href="#" id="alertsDropdown" onClick={(e) => e.preventDefault()}>
              <i className="align-middle fas fa-bell"></i>
              <span className="indicator"></span>
            </a>
          </li>
          <li className="nav-item dropdown ms-lg-2">
            <a className="nav-link dropdown-toggle position-relative" href="#" id="userDropdown" onClick={(e) => e.preventDefault()}>
              <i className="align-middle fas fa-user-circle"></i>
            </a>
            <div className="dropdown-menu dropdown-menu-end" style={{ display: 'none' }}>
              <a className="dropdown-item" href="/admin-orders">
                <i className="align-middle me-2 fas fa-fw fa-user"></i> Customers
              </a>
              <a className="dropdown-item" href="/admin-orders">
                <i className="align-middle me-2 fas fa-fw fa-user"></i> Orders
              </a>
              <a className="dropdown-item" href="/ad/email-config">
                <i className="align-middle me-2 fas fa-fw fa-cog"></i> Email Config
              </a>
              <a className="dropdown-item" href="/change-password">
                <i className="align-middle me-2 fas fa-fw fa-key"></i> Change Password
              </a>
              <a href="#" className="dropdown-item logout-link">
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

