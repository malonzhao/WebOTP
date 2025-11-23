import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initializeAuthState, useAuthStore } from './stores/auth.store';
import './index.css';
import './i18n'; // Import i18n configuration

// Global authentication error handler
window.addEventListener('auth-token-expired', () => {
  console.log('Global auth token expired handler called');
  const store = useAuthStore.getState();
  if (store.isAuthenticated) {
    store.handleTokenExpired();
  }
});

// Initialize authentication on app start
initializeAuthState().then(() => {
  console.log('Authentication state initialized');
}).catch(e => {
  console.warn('Failed to initialize global authentication state:', e);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
