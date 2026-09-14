import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
  },
  {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
  },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    // Save language preference to localStorage
    localStorage.setItem('i18nextLng', languageCode);
  };

  const currentLanguage = i18n.language;

  return (
    <div className="relative inline-block">
      <select
        aria-label={t('language.switchLanguage')}
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md min-h-11 px-2 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
      >
        {languageOptions.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
};

export default LanguageSwitcher;