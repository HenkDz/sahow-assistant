import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation as useI18nextTranslation, I18nextProvider } from 'react-i18next';
import i18n, { Language, supportedLanguages, isRTL, changeLanguage, setSettingsStoreReference, initializeWithSettingsLanguage } from './index';

// Context for language management
interface I18nContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  isRTL: boolean;
  supportedLanguages: readonly Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider component
interface I18nProviderProps {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    i18n.language as Language || 'en'
  );

  // Handle language changes
  const handleLanguageChange = async (language: Language) => {
    await changeLanguage(language);
    setCurrentLanguage(language);
  };

  // Listen for language changes from i18next
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng as Language);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // Set initial document direction and language
  useEffect(() => {
    const direction = isRTL(currentLanguage) ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const contextValue: I18nContextType = {
    currentLanguage,
    changeLanguage: handleLanguageChange,
    isRTL: isRTL(currentLanguage),
    supportedLanguages,
  };

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={contextValue}>
        {children}
      </I18nContext.Provider>
    </I18nextProvider>
  );
};

// Hook to access i18n context
export const useLanguage = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within an I18nProvider');
  }
  return context;
};

// Enhanced useTranslation hook with namespace support
export const useTranslation = (namespace?: string) => {
  const { t, i18n: i18nInstance } = useI18nextTranslation(namespace);
  const { currentLanguage, isRTL } = useLanguage();

  return {
    t,
    i18n: i18nInstance,
    currentLanguage,
    isRTL,
    // Helper function for getting translations with fallback
    tWithFallback: (key: string, fallback?: string) => {
      const translation = t(key);
      return translation !== key ? translation : fallback || key;
    },
  };
};

export default I18nProvider;