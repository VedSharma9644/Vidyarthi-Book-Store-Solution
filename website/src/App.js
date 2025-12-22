import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import TopNavigation from './components/TopNavigation';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <TopNavigation />
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
