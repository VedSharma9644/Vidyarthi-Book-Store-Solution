import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import AppRoutes from './routes/AppRoutes';
import TopNavigation from './components/TopNavigation';
import AlertInitializer from './components/common/AlertInitializer';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <AlertInitializer />
          <div className="App">
            <TopNavigation />
            <AppRoutes />
          </div>
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
