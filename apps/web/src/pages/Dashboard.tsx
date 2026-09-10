import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, TrashIcon, DocumentDuplicateIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/auth.store';
import { useUserPlatformsStore } from '../stores/user-platforms.store';
import { usePlatformsStore } from '../stores/platforms.store';
import { Platform } from '@webotp/shared/types';
import { format } from 'date-fns';
import { enUS, zhCN, zhTW } from 'date-fns/locale';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import UserSettingsDropdown from '../components/common/UserSettingsDropdown';
import { UserSettingsForm } from '../components/auth/UserSettingsForm';

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { t, i18n } = useTranslation();

  const dateLocales = {
    'en': enUS,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
  };

  const currentLocale = dateLocales[i18n.language as keyof typeof dateLocales] || enUS;
  const {
    userPlatforms,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadUserPlatforms,
    loadMoreUserPlatforms,
    createUserPlatform,
    generateOTP,
    otpData,
    deleteUserPlatform,
    clearOTPData,
  } = useUserPlatformsStore();
  const [showBindPlatform, setShowBindPlatform] = useState(false);
  const [showPlatformsManagement, setShowPlatformsManagement] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showCreatePlatformModal, setShowCreatePlatformModal] = useState(false);
  const [showEditPlatformModal, setShowEditPlatformModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [newPlatform, setNewPlatform] = useState({
    platformId: '',
    accountName: '',
    secret: ''
  });
  const [newPlatformManagement, setNewPlatformManagement] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState<Partial<typeof newPlatform>>({});
  const [platformManagementFormErrors, setPlatformManagementFormErrors] = useState<Partial<typeof newPlatformManagement>>({});
  const [platformsError, setPlatformsError] = useState<string | null>(null);
  const [otpCountdowns, setOtpCountdowns] = useState<Map<string, number>>(new Map());
  const [refreshingPlatforms, setRefreshingPlatforms] = useState<Set<string>>(new Set());
  const refreshingPlatformsRef = useRef<Set<string>>(new Set());
  const userPlatformsLoadedRef = useRef(false);
  const platformsLoadedRef = useRef(false);
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    platforms,
    loadPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
    error: platformsStoreError,
    isLoading: platformsLoading
  } = usePlatformsStore();

  useEffect(() => {
    if (isAuthenticated && !userPlatformsLoadedRef.current) {
      userPlatformsLoadedRef.current = true;
      loadUserPlatforms();
    }
  }, [isAuthenticated, loadUserPlatforms]);

  // Automatically generate OTP codes when user platform list is loaded
  useEffect(() => {
    if (userPlatforms) {
      userPlatforms.forEach(platform => {
        if (!otpData.has(platform.id)) {
          handleGenerateOTP(platform.id);
        }
      });
    }
  }, [userPlatforms]); // Removed otpData dependency to prevent infinite re-render

  useEffect(() => {
    // Load platform list to ensure platform names can be displayed
    if (!platformsLoadedRef.current) {
      platformsLoadedRef.current = true;
      setPlatformsError(null);
      loadPlatforms().catch(error => {
        setPlatformsError(t('errors.loadPlatformsFailed'));
        console.error('Failed to load platforms:', error);
      });
    }
  }, [loadPlatforms, t]);

  useEffect(() => {
    if (platformsStoreError) {
      setPlatformsError(platformsStoreError);
    }
  }, [platformsStoreError]);

  // Reset form errors when bind platform modal is closed
  useEffect(() => {
    if (!showBindPlatform) {
      setFormErrors({});
      setPlatformsError(null); // Also clear the platforms error
    }
  }, [showBindPlatform]);

  // Reset form errors when platforms management modal is closed
  useEffect(() => {
    if (!showPlatformsManagement) {
      setPlatformManagementFormErrors({});
      setPlatformsError(null);
    }
  }, [showPlatformsManagement]);

  // OTP countdown timer, automatically refresh OTP when countdown ends
  useEffect(() => {
    const timer = setInterval(() => {
      setOtpCountdowns(prev => {
        const newCountdowns = new Map(prev);
        let hasChanges = false;
        const expiredPlatforms: string[] = []; // Track expired platforms

        newCountdowns.forEach((value, key) => {
          // Check if platform still exists before processing
          const platformExists = userPlatforms.some(platform => platform.id === key);
          if (!platformExists) {
            // Platform has been deleted, remove its countdown
            newCountdowns.delete(key);
            hasChanges = true;
            return;
          }

          if (value > 0) {
            newCountdowns.set(key, value - 1);
            hasChanges = true;
          } else {
            // Countdown ended, mark for refresh
            expiredPlatforms.push(key);
            newCountdowns.delete(key);
            hasChanges = true;
          }
        });

        // Refresh expired platforms outside the state update
        if (expiredPlatforms.length > 0) {
          setTimeout(() => {
            expiredPlatforms.forEach(platformId => {
              handleGenerateOTP(platformId);
            });
          }, 0);
        }

        return hasChanges ? newCountdowns : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userPlatforms]);

  // Infinite scroll: load more data when scrolling to bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMoreUserPlatforms();
        }
      },
      { threshold: 0.1 }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, loadMoreUserPlatforms]);


  const handleGenerateOTP = async (platformId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Check if platform still exists before generating OTP
    const platformExists = userPlatforms.some(platform => platform.id === platformId);
    if (!platformExists) {
      // Platform has been deleted, clear any related data
      clearOTPData(platformId);
      setOtpCountdowns(prev => {
        const newCountdowns = new Map(prev);
        newCountdowns.delete(platformId);
        return newCountdowns;
      });
      return;
    }
    // Use ref for synchronous check to avoid duplicate requests
    if (refreshingPlatformsRef.current.has(platformId)) {
      return;
    }
    // Synchronously update ref and state
    refreshingPlatformsRef.current.add(platformId);
    setRefreshingPlatforms(prev => new Set(prev).add(platformId));

    try {
      const otpResponse = await generateOTP(platformId);
      // Immediately update countdown to new validity period, ensuring countdown starts from beginning after manual refresh
      setOtpCountdowns(prev => {
        const newCountdowns = new Map(prev);
        newCountdowns.set(platformId, otpResponse.expiresIn);
        return newCountdowns;
      });
    } catch (error: any) {
      // Do not log duplicate generation errors
      if (error.message !== 'OTP generation already in progress for this platform') {
        console.error('Failed to generate OTP:', error);
      }
    } finally {
      // Synchronously update ref and state
      refreshingPlatformsRef.current.delete(platformId);
      setRefreshingPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.delete(platformId);
        return newSet;
      });
    }
  };




  const handleBindPlatform = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Validate form
    const errors: Partial<typeof newPlatform> = {};
    if (!newPlatform.platformId) errors.platformId = t('validation.required');
    if (!newPlatform.accountName) errors.accountName = t('validation.required');
    if (!newPlatform.secret) errors.secret = t('validation.required');

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const cleanedPlatform = {
      ...newPlatform,
      secret: newPlatform.secret.replace(/\s+/g, '')
    };
    try {
      await createUserPlatform(cleanedPlatform);
      setShowBindPlatform(false);
      setNewPlatform({ platformId: '', accountName: '', secret: '' });
    } catch (error: any) {
      console.error('Failed to add platform:', error);
      // Display error message
      setPlatformsError(error.response?.data?.message || t('errors.createUserPlatformFailed'));
    }
  };

  const handleDeletePlatform = async (platformId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await deleteUserPlatform(platformId);
      // After successful deletion, clear all related data for this platform
      clearOTPData(platformId);
      // Clear countdown data
      setOtpCountdowns(prev => {
        const newCountdowns = new Map(prev);
        newCountdowns.delete(platformId);
        return newCountdowns;
      });
      // Clear refreshing state
      setRefreshingPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.delete(platformId);
        return newSet;
      });
      refreshingPlatformsRef.current.delete(platformId);
    } catch (error) {
      console.error('Failed to delete platform:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPlatform(prev => ({ ...prev, [name]: value }));
    // Clear error message
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Platform Management Functions

  const handleCreatePlatformManagement = async () => {
    // Validate form
    const errors: Partial<typeof newPlatformManagement> = {};
    if (!newPlatformManagement.name.trim()) errors.name = t('validation.required');

    if (Object.keys(errors).length > 0) {
      setPlatformManagementFormErrors(errors);
      return;
    }

    setPlatformManagementFormErrors({});

    try {
      await createPlatform(newPlatformManagement);
      setShowCreatePlatformModal(false);
      setNewPlatformManagement({ name: '' });
    } catch (error) {
      console.error('Failed to create platform:', error);
    }
  };

  const handleEditPlatformManagement = async () => {
    if (!editingPlatform) return;

    const errors: Partial<typeof newPlatformManagement> = {};
    if (!editingPlatform.name.trim()) errors.name = t('validation.required');

    if (Object.keys(errors).length > 0) {
      setPlatformManagementFormErrors(errors);
      return;
    }

    setPlatformManagementFormErrors({});

    try {
      await updatePlatform(editingPlatform.id, {
        name: editingPlatform.name
      });
      setShowEditPlatformModal(false);
      setEditingPlatform(null);
    } catch (error) {
      console.error('Failed to update platform:', error);
    }
  };

  const handleDeletePlatformManagement = async (id: string) => {
    if (window.confirm(t('platforms.deletePlatformConfirm'))) {
      try {
        await deletePlatform(id);
      } catch (error) {
        console.error('Failed to delete platform:', error);
      }
    }
  };


  const handlePlatformManagementInputChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    if (isEdit && editingPlatform) {
      setEditingPlatform(prev => prev ? { ...prev, [name]: inputValue } : null);
    } else {
      setNewPlatformManagement(prev => ({ ...prev, [name]: inputValue }));
    }

    // Clear error for this field
    if (platformManagementFormErrors[name as keyof typeof newPlatformManagement]) {
      setPlatformManagementFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };


  const handleCopyOTP = async (platformId: string, otpToken: string) => {
    try {
      await navigator.clipboard.writeText(otpToken);
      setCopiedOtpId(platformId);
      setTimeout(() => setCopiedOtpId(null), 2000); // Clear after 2 seconds
    } catch (error) {
      console.error('Failed to copy OTP:', error);
    }
  };

  const handleUserSettingsSuccess = () => {
    // Close the user settings modal
    setShowUserSettings(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              {t('auth.login')}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || platformsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('common.appName')}</h1>
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="sm:hidden">
                <LanguageSwitcher />
              </div>
              <UserSettingsDropdown
                onShowUserSettings={() => setShowUserSettings(true)}
                onShowPlatformsManagement={() => setShowPlatformsManagement(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Platform List */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 px-2 sm:px-0">{t('dashboard.boundPlatforms')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {userPlatforms && userPlatforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                      {platform.accountName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                      {platform.platform?.name || t('dashboard.unknownPlatform')}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleGenerateOTP(platform.id, e)}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white p-1.5 sm:p-2 rounded-md flex items-center justify-center"
                      title={t('dashboard.refreshOTP')}
                      disabled={refreshingPlatforms.has(platform.id)}
                    >
                      {refreshingPlatforms.has(platform.id) ? (
                        <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <ArrowPathIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeletePlatform(platform.id, e)}
                      className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white p-1.5 sm:p-2 rounded-md flex items-center justify-center"
                      title={t('dashboard.deleteBinding')}
                    >
                      <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-gray-400 dark:text-gray-500 mb-3 space-y-1 sm:space-y-0">
                  <span className="truncate">{t('dashboard.boundAt')}: {format(new Date(platform.createdAt), 'yyyy-MM-dd HH:mm', { locale: currentLocale })}</span>
                  {otpData.get(platform.id) && (
                    <span className="truncate">{t('dashboard.expiresIn')} {otpCountdowns.get(platform.id) ?? otpData.get(platform.id)?.expiresIn} {t('dashboard.seconds')}</span>
                  )}
                </div>

                {otpData.get(platform.id) && (
                  <div
                    className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 relative cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleCopyOTP(platform.id, otpData.get(platform.id)?.token || '')}
                  >
                    <div className="absolute top-2 right-2">
                      {copiedOtpId === platform.id ? (
                        <span className="text-green-600 dark:text-green-400 text-xs sm:text-sm">{t('common.copied')}</span>
                      ) : (
                        <DocumentDuplicateIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                      )}
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 text-center tracking-widest">
                      {otpData.get(platform.id)?.token}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Bind Platform Card - Always shown at the end */}
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => setShowBindPlatform(true)}
            >
              <PlusIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mb-2 sm:mb-3" />
              <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 text-center">
                {t('dashboard.bindPlatform')}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mt-1 sm:mt-2">
                {t('dashboard.clickToBind')}
              </p>
            </div>
          </div>

          {/* Infinite scroll loading indicator */}
          {isLoadingMore && (
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* No more data prompt */}
          {!hasMore && userPlatforms.length > 0 && (
            <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
              {t('errors.noMoreData')}
            </div>
          )}

          {/* Infinite scroll observation point */}
          <div ref={bottomRef} className="h-1" />
        </div>

      </main>

      {/* Bind platform modal */}
      <Transition show={showBindPlatform} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowBindPlatform(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 text-left align-middle shadow-xl transition-all mx-2">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 text-center"
                  >
                    {t('dashboard.bindPlatform')}
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    {platformsError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 sm:p-4">
                        <p className="text-red-800 dark:text-red-200 text-sm">{platformsError}</p>
                      </div>
                    )}

                    <div>
                      <label htmlFor="platformId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('dashboard.selectPlatform')}
                      </label>
                      <select
                        id="platformId"
                        name="platformId"
                        value={newPlatform.platformId}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm sm:text-base ${formErrors.platformId ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                          }`}
                      >
                        <option value="">{t('dashboard.selectPlatform')}</option>
                        {platforms?.map((platform: Platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.platformId && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.platformId}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('dashboard.accountName')}
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        name="accountName"
                        value={newPlatform.accountName}
                        onChange={handleInputChange}
                        placeholder={t('dashboard.accountName')}
                        className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm sm:text-base ${formErrors.accountName ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                          }`}
                      />
                      {formErrors.accountName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.accountName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('dashboard.otpSecret')}
                      </label>
                      <input
                        type="text"
                        id="secret"
                        name="secret"
                        value={newPlatform.secret}
                        onChange={handleInputChange}
                        placeholder={t('dashboard.otpSecret')}
                        className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm sm:text-base ${formErrors.secret ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                          }`}
                      />
                      {formErrors.secret && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.secret}</p>
                      )}
                    </div>

                    <div className="flex space-x-3 sm:space-x-4">
                      <button
                        type="button"
                        onClick={(e) => handleBindPlatform(e)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                      >
                        {t('dashboard.bindPlatform')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBindPlatform(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Platform Management Modal */}
      <Transition show={showPlatformsManagement} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowPlatformsManagement(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 text-left align-middle shadow-xl transition-all mx-2">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 text-center">
                    {t('platforms.platformManagement')}
                  </Dialog.Title>

                  <div className="mt-4 sm:mt-6">
                    <div className="flex justify-end mb-4">
                      <button
                        type="button"
                        onClick={() => setShowCreatePlatformModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md flex items-center text-sm sm:text-base"
                        title={t('platforms.addPlatform')}
                      >
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                        {t('platforms.addPlatform')}
                      </button>
                    </div>

                    {/* Platforms List */}
                    <div className="bg-white dark:bg-gray-700 shadow rounded-lg overflow-hidden">
                      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600">
                        <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">{t('platforms.platformList')}</h2>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {platforms.map((platform) => (
                          <div key={platform.id} className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 truncate">{platform.name}</h3>
                              </div>
                              <div className="flex items-center space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingPlatform(platform);
                                    setShowEditPlatformModal(true);
                                  }}
                                  className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50"
                                  title={t('platforms.editPlatform')}
                                >
                                  <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePlatformManagement(platform.id)}
                                  className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50"
                                  title={t('platforms.deletePlatform')}
                                >
                                  <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-1 sm:mt-2 flex items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t('dashboard.createdAt')}: {new Date(platform.createdAt).toLocaleDateString(i18n.language)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {platforms.length === 0 && (
                        <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{t('platforms.noPlatformData')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      {/* User Settings Modal */}
      <Transition show={showUserSettings} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowUserSettings(false)}>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <UserSettingsForm onSuccess={handleUserSettingsSuccess} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Create Platform Modal */}
      <Transition show={showCreatePlatformModal} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowCreatePlatformModal(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 text-left align-middle shadow-xl transition-all mx-2">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 text-center">
                    {t('platforms.addPlatform')}
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('platforms.platformName')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={newPlatformManagement.name}
                        onChange={(e) => handlePlatformManagementInputChange(e)}
                        className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm sm:text-base ${platformManagementFormErrors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        placeholder={t('platforms.platformName')}
                      />
                      {platformManagementFormErrors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{platformManagementFormErrors.name}</p>
                      )}
                    </div>


                    <div className="flex space-x-3 sm:space-x-4">
                      <button
                        type="button"
                        onClick={handleCreatePlatformManagement}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                      >
                        {t('common.add')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreatePlatformModal(false)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Platform Modal */}
      <Transition show={showEditPlatformModal} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowEditPlatformModal(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 text-left align-middle shadow-xl transition-all mx-2">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 text-center">
                    {t('platforms.editPlatform')}
                  </Dialog.Title>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('platforms.platformName')}
                      </label>
                      <input
                        type="text"
                        id="edit-name"
                        name="name"
                        value={editingPlatform?.name || ''}
                        onChange={(e) => handlePlatformManagementInputChange(e, true)}
                        className={`w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm sm:text-base ${platformManagementFormErrors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        placeholder={t('platforms.platformName')}
                      />
                      {platformManagementFormErrors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{platformManagementFormErrors.name}</p>
                      )}
                    </div>


                    <div className="flex space-x-3 sm:space-x-4">
                      <button
                        type="button"
                        onClick={handleEditPlatformManagement}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditPlatformModal(false)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Dashboard;
