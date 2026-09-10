import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { registerAuthEvents } from './stores/auth-events';
import './index.css';
import './i18n'; // Import i18n configuration

const unregisterAuthEvents = registerAuthEvents();
if (import.meta.hot) {
  import.meta.hot.dispose(unregisterAuthEvents);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
