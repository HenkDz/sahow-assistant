
import React from 'react';
import { useLanguage } from '../i18n/I18nProvider';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

interface LanguageSwitcherProps {}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = () => {
  const { currentLanguage } = useLanguage();
  const { setLanguage } = useUserPreferencesStore();
  
  // Use settings store for language changes to ensure persistence
  const handleLanguageChange = async (language: 'en' | 'ar') => {
    try {
      await setLanguage(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };
  const buttonBaseClasses = 'w-[90px] px-2 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none relative z-10';

  return (
    <div className="relative flex items-center bg-white p-1 rounded-full shadow-inner" dir="ltr">
      <div
        className="absolute top-1 left-1 w-[90px] h-[calc(100%-8px)] bg-blue-600 rounded-full shadow transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(${currentLanguage === 'ar' ? '90px' : '0px'})` }}
      />
      <button
        onClick={() => handleLanguageChange('en')}
        className={`${buttonBaseClasses} ${currentLanguage === 'en' ? 'text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
      >
        English
      </button>
      <button
        onClick={() => handleLanguageChange('ar')}
        className={`${buttonBaseClasses} ${currentLanguage === 'ar' ? 'text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;
