import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { PageTitleProvider } from './contexts/PageTitleContext';
import AppRoutes from './routes/AppRoutes';
import TopNavigation from './components/TopNavigation';
import AlertInitializer from './components/common/AlertInitializer';
import NoticeBannerGate from './components/common/NoticeBannerGate';
import ContactSupportFab from './components/common/ContactSupportFab';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <PageTitleProvider>
            <AlertInitializer />
            <div className="App">
              <TopNavigation />
              <NoticeBannerGate />
              <AppRoutes />
              <ContactSupportFab />
            </div>
          </PageTitleProvider>
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
