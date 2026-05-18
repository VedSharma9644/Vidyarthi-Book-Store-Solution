import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './Layout.css';

/** Match Sidebar.css / Layout.css — overlay + tap targets below this width */
const SIDEBAR_OVERLAY_MQ = '(max-width: 991.98px)';

function readOverlayMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(SIDEBAR_OVERLAY_MQ).matches;
}

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => !readOverlayMode());

  useEffect(() => {
    if (readOverlayMode()) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia(SIDEBAR_OVERLAY_MQ);
    const onChange = () => {
      if (mq.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const mq = window.matchMedia(SIDEBAR_OVERLAY_MQ);
    const onKey = (e) => {
      if (e.key === 'Escape' && mq.matches) setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="wrapper">
      <Sidebar isOpen={sidebarOpen} />
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeSidebar}
        />
      )}
      <div className={`main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopNav onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
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

