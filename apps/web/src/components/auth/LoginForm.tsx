import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';
import { FormErrors } from '../common/FormErrors';
import { LoginDto } from '../../services/api/dto/auth.dto';

export const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginDto>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginDto>>({});
  const { t } = useTranslation();
  
  const { login, isLoading, error } = useAuthStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof LoginDto]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginDto> = {};
    
    if (!formData.username) {
      newErrors.username = t('auth.usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('auth.usernameMinLength');
    } else if (formData.username.length > 20) {
      newErrors.username = t('auth.usernameMaxLength');
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t('auth.usernameInvalid');
    }
    
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.passwordMinLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(formData);
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl">
      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 text-center">
        {t('auth.login')}
      </h3>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <FormErrors errors={errors} labels={{ username: t('auth.username'), password: t('auth.password') }} />
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.username')}
          </label>
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'username-error' : undefined}
            value={formData.username}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400 ${errors.username ? 'border-red-500 dark:border-red-400 input-error' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder={t('auth.username')}
          />
          {errors.username && (
            <p id="username-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.username}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.password')}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            value={formData.password}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400 ${errors.password ? 'border-red-500 dark:border-red-400 input-error' : 'border-gray-300 dark:border-gray-600'}`}
            placeholder={t('auth.password')}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.password}</p>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-md bg-danger-50 dark:bg-danger-900/20 p-4">
            <p className="text-sm text-danger-800 dark:text-danger-200">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? t('common.loading') : t('auth.login')}
          </button>
        </div>
      </form>
    </div>
  );
};
