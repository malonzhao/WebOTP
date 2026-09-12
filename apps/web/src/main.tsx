import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { useAuthStore } from './stores/auth.store';
import { useUserPlatformsStore } from './stores/user-platforms.store';
import { registerAuthEvents } from './stores/auth-events';
import './index.css';
import './i18n'; // Import i18n configuration

const unregisterAuthEvents = registerAuthEvents();
type OTPSession = { isAuthenticated: boolean; user: { id: string } | null };
const unsubscribeOTP = useAuthStore.subscribe((state: OTPSession, previous: OTPSession) => {
  if ((!state.isAuthenticated && previous.isAuthenticated) || state.user?.id !== previous.user?.id) {
    useUserPlatformsStore.getState().resetUserPlatforms();
  }
});
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unregisterAuthEvents();
    unsubscribeOTP();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
