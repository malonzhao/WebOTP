import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, initializeAuthState } from './stores/auth.store';
import { applyThemeClass } from './stores/theme.store';
import Dashboard from './pages/Dashboard';
import { LoginForm } from './components/auth/LoginForm';
import LanguageSwitcher from './components/common/LanguageSwitcher';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const [authInitializing, setAuthInitializing] = useState(true);

  useEffect(() => {
    // Ensure theme setting is applied
    applyThemeClass();

    // Always initialize auth state on app start to verify tokens
    initializeAuthState()
      .catch(e => {
        console.warn('Failed to initialize authentication state:', e);
      })
      .finally(() => {
        setAuthInitializing(false);
      });
  }, []);

  // Show loading screen while checking authentication state
  if (authInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="flex items-center justify-center">
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
              {t('common.appName')}
            </h1>
            <div className='ml-1'><LanguageSwitcher /></div>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="App bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
