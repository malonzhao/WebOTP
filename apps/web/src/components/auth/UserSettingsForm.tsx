import { FormErrors } from '../common/FormErrors';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';
import { UpdatePasswordDto } from '../../services/api/auth';
import { UpdateUsernameDto } from '../../services/api/auth';

interface UserSettingsFormProps {
  onSuccess?: () => void;
}

export const UserSettingsForm: React.FC<UserSettingsFormProps> = ({ onSuccess }) => {
  // Local component state: prevent duplicate loading
  const [loadingUser, setLoadingUser] = useState(false);

  const [passwordFormData, setPasswordFormData] = useState<UpdatePasswordDto>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [usernameFormData, setUsernameFormData] = useState<UpdateUsernameDto>({
    username: ''
  });

  const [activeTab, setActiveTab] = useState<'username' | 'password'>('username');
  const [passwordErrors, setPasswordErrors] = useState<Partial<UpdatePasswordDto>>({});
  const [usernameErrors, setUsernameErrors] = useState<Partial<UpdateUsernameDto>>({});
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const { t } = useTranslation();

  const {
    updatePassword,
    updatePasswordLoading,
    updatePasswordError,
    updatePasswordSuccess,
    clearUpdatePasswordState,
    updateUsername,
    updateUsernameLoading,
    updateUsernameError,
    updateUsernameSuccess,
    clearUpdateUsernameState,
    user,
    loadCurrentUser
  } = useAuthStore();

  // Load user information when component mounts (execute only once)
  useEffect(() => {
    if (!user && !loadingUser) {
      setLoadingUser(true);
      loadCurrentUser().finally(() => {
        setLoadingUser(false);
      });
    }
  }, [user, loadCurrentUser]); // Removed loadingUser dependency to avoid duplicate execution

  // Handle success scenarios
  useEffect(() => {
    if (updatePasswordSuccess) {
      // Show success message and close modal after 2 seconds
      const timer = setTimeout(() => {
        clearUpdatePasswordState();
        // Clear form data
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Close modal
        onSuccess?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [updatePasswordSuccess, clearUpdatePasswordState, onSuccess]);

  useEffect(() => {
    if (updateUsernameSuccess) {
      // Show success message and close modal after 2 seconds
      const timer = setTimeout(() => {
        clearUpdateUsernameState();
        // Clear form data
        setUsernameFormData({
          username: ''
        });
        // Close modal
        onSuccess?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [updateUsernameSuccess, clearUpdateUsernameState, onSuccess]);

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordErrors[name as keyof UpdatePasswordDto]) {
      setPasswordErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear global error when user starts typing
    if (updatePasswordError) {
      clearUpdatePasswordState();
    }
  };

  const handleUsernameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUsernameFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (usernameErrors[name as keyof UpdateUsernameDto]) {
      setUsernameErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear global error when user starts typing
    if (updateUsernameError) {
      clearUpdateUsernameState();
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Partial<UpdatePasswordDto> = {};
    
    if (!passwordFormData.currentPassword) {
      newErrors.currentPassword = t('auth.currentPasswordRequired');
    }
    
    if (!passwordFormData.newPassword) {
      newErrors.newPassword = t('auth.newPasswordRequired');
    } else if (passwordFormData.newPassword.length < 8) {
      newErrors.newPassword = t('auth.passwordMinLength');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(passwordFormData.newPassword)) {
      newErrors.newPassword = t('auth.passwordStrength');
    }
    
    if (!passwordFormData.confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUsernameForm = (): boolean => {
    const newErrors: Partial<UpdateUsernameDto> = {};
    
    if (!usernameFormData.username) {
      newErrors.username = t('validation.required');
    } else if (usernameFormData.username.length < 3) {
      newErrors.username = t('auth.usernameMinLength');
    } else if (usernameFormData.username.length > 20) {
      newErrors.username = t('auth.usernameMaxLength');
    } else if (!/^[a-zA-Z0-9_]+$/.test(usernameFormData.username)) {
      newErrors.username = t('auth.usernameInvalid');
    }
    
    setUsernameErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    try {
      await updatePassword(passwordFormData);
    } catch (error) {
      // Error is handled by the store
      console.error('Password change failed:', error);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUsernameForm()) return;
    
    try {
      await updateUsername(usernameFormData);
    } catch (error) {
      // Error is handled by the store
      console.error('Username update failed:', error);
    }
  };

  return (
    <div className="w-full">

      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex flex-wrap gap-x-4" aria-label={t('auth.userSettings')}>
          <button
            type="button"
            onClick={() => setActiveTab('username')}
            aria-pressed={activeTab === 'username'}
            className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'username'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300'
            }`}
          >
            {t('auth.updateUsername')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            aria-pressed={activeTab === 'password'}
            className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300'
            }`}
          >
            {t('auth.updatePassword')}
          </button>
        </nav>
      </div>

      {/* Username Tab */}
      {activeTab === 'username' && (
        <form onSubmit={handleUsernameSubmit} className="mt-4 space-y-4" noValidate>
          <FormErrors errors={usernameErrors} labels={{ username: t('auth.newUsername') }} />
          {updateUsernameSuccess && (
            <div role="status" className="rounded-md bg-success-50 dark:bg-success-900/20 p-4">
              <p className="text-sm text-success-800 dark:text-success-200">
                {t('auth.usernameUpdatedSuccessfully')}
              </p>
            </div>
          )}

          {user && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('auth.currentUsername')}: <span className="font-medium">{user.username}</span>
              </p>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.newUsername')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="username"
              aria-invalid={!!usernameErrors.username}
              aria-describedby={usernameErrors.username ? 'username-error' : undefined}
              value={usernameFormData.username}
              onChange={handleUsernameInputChange}
              className={`w-full min-h-11 px-4 py-2 pr-20 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                usernameErrors.username ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder={t('auth.newUsername')}
            />
            {usernameErrors.username && (
              <p id="username-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">{usernameErrors.username}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('auth.usernameRequirements')}
            </p>
          </div>

          {updateUsernameError && (
            <div role="alert" className="rounded-md bg-danger-50 dark:bg-danger-900/20 p-4">
              <p className="text-sm text-danger-800 dark:text-danger-200">{updateUsernameError}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={updateUsernameLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {updateUsernameLoading ? t('common.loading') : t('auth.updateUsername')}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4" noValidate>
          <FormErrors errors={passwordErrors} labels={{ currentPassword: t('auth.currentPassword'), newPassword: t('auth.newPassword'), confirmPassword: t('auth.confirmPassword') }} />
          {updatePasswordSuccess && (
            <div role="status" className="rounded-md bg-success-50 dark:bg-success-900/20 p-4">
              <p className="text-sm text-success-800 dark:text-success-200">
                {t('auth.passwordUpdatedSuccessfully')}
              </p>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
              autoComplete="current-password"
              aria-invalid={!!passwordErrors.currentPassword}
              aria-describedby={passwordErrors.currentPassword ? 'currentPassword-error' : undefined}
                value={passwordFormData.currentPassword}
                onChange={handlePasswordInputChange}
                className={`w-full min-h-11 px-4 py-2 pr-20 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.currentPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('auth.currentPassword')}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword.current ? t('auth.hide') : t('auth.show')}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p id="currentPassword-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
              autoComplete="new-password"
              aria-invalid={!!passwordErrors.newPassword}
              aria-describedby={passwordErrors.newPassword ? 'newPassword-error' : undefined}
                value={passwordFormData.newPassword}
                onChange={handlePasswordInputChange}
                className={`w-full min-h-11 px-4 py-2 pr-20 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.newPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('auth.newPassword')}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword.new ? t('auth.hide') : t('auth.show')}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p id="newPassword-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">{passwordErrors.newPassword}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('auth.passwordRequirements')}
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
              autoComplete="new-password"
              aria-invalid={!!passwordErrors.confirmPassword}
              aria-describedby={passwordErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                value={passwordFormData.confirmPassword}
                onChange={handlePasswordInputChange}
                className={`w-full min-h-11 px-4 py-2 pr-20 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.confirmPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('auth.confirmPassword')}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword.confirm ? t('auth.hide') : t('auth.show')}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p id="confirmPassword-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {updatePasswordError && (
            <div role="alert" className="rounded-md bg-danger-50 dark:bg-danger-900/20 p-4">
              <p className="text-sm text-danger-800 dark:text-danger-200">{updatePasswordError}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={updatePasswordLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {updatePasswordLoading ? t('common.loading') : t('auth.updatePassword')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
