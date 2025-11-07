import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="wrapper">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopNav onToggleSidebar={toggleSidebar} />
        <main className="content">
          {children}
        </main>
        <footer className="footer">
          <div className="container-fluid">
            <div className="row text-muted">
              <div className="col-8 text-start">
                <ul className="list-inline">
                  <li className="list-inline-item">
                    <a className="text-black text-decoration-none" href="#">© 2025</a>
                  </li>
                </ul>
              </div>
              <div className="col-4 text-end">
                <p className="mb-0 text-black">v-1.0.2</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;

