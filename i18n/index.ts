import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

// Define supported languages
export const supportedLanguages = ['en', 'ar'] as const;
export type Language = typeof supportedLanguages[number];

// Define RTL languages
export const rtlLanguages: Language[] = ['ar'];

// Settings integration - will be set by the settings initialization
let settingsStore: any = null;

// Function to set the settings store reference for integration
export const setSettingsStoreReference = (store: any) => {
  settingsStore = store;
};

// i18n configuration
const i18nConfig = {
  // Default language
  fallbackLng: 'en' as Language,
  
  // Supported languages
  supportedLngs: supportedLanguages,
  
  // Language detection configuration
  detection: {
    // Detection order: localStorage first, then browser language, then HTML tag
    order: ['localStorage', 'navigator', 'htmlTag'],
    
    // Cache user language selection in localStorage
    caches: ['localStorage'],
    
    // localStorage key for language preference
    lookupLocalStorage: 'i18nextLng',
    
    // Don't convert country codes to language codes (e.g., en-US -> en)
    convertDetectedLanguage: (lng: string) => {
      // Extract language code from locale (e.g., 'en-US' -> 'en')
      const languageCode = lng.split('-')[0];
      // Return the language if supported, otherwise fallback to English
      return supportedLanguages.includes(languageCode as Language) 
        ? languageCode 
        : 'en';
    }
  },
  
  // Translation resources organized by namespace
  resources: {
    en: {
      common: enTranslations.common,
      sahw_assistant: enTranslations.sahw_assistant,
      location: enTranslations.location,
      prayers: enTranslations.prayers,
      qibla: enTranslations.qibla,
      tasbih: enTranslations.tasbih,
      calendar: enTranslations.calendar,
      mosques: enTranslations.mosques,
      settings: enTranslations.settings,
      main_navigation: enTranslations.main_navigation
    },
    ar: {
      common: arTranslations.common,
      sahw_assistant: arTranslations.sahw_assistant,
      location: arTranslations.location,
      prayers: arTranslations.prayers,
      qibla: arTranslations.qibla,
      tasbih: arTranslations.tasbih,
      calendar: arTranslations.calendar,
      mosques: arTranslations.mosques,
      settings: arTranslations.settings,
      main_navigation: arTranslations.main_navigation
    }
  },
  
  // Default namespace
  defaultNS: 'common',
  
  // Namespace separator
  nsSeparator: ':',
  
  // Key separator for nested keys
  keySeparator: '.',
  
  // Interpolation settings
  interpolation: {
    // React already escapes values, so we don't need i18next to do it
    escapeValue: false,
  },
  
  // React i18next options
  react: {
    // Use Suspense for loading translations
    useSuspense: false,
  },
  
  // Debug mode (disable in production)
  debug: process.env.NODE_ENV === 'development',
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(i18nConfig);

// Helper function to check if language is RTL
export const isRTL = (language: string): boolean => {
  return rtlLanguages.includes(language as Language);
};

// Helper function to get current language direction
export const getCurrentDirection = (): 'ltr' | 'rtl' => {
  return isRTL(i18n.language) ? 'rtl' : 'ltr';
};

// Helper function to change language and update document direction
export const changeLanguage = async (language: Language): Promise<void> => {
  await i18n.changeLanguage(language);
  
  // Update document direction
  const direction = isRTL(language) ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = language;
  
  // Update settings store if available (to keep settings in sync)
  if (settingsStore) {
    try {
      await settingsStore.getState().setLanguage(language);
    } catch (error) {
      console.error('Failed to sync language change to settings:', error);
    }
  }
};

// Function to initialize i18n with settings language preference
export const initializeWithSettingsLanguage = async (settingsLanguage: Language): Promise<void> => {
  // Only change if different from current language
  if (i18n.language !== settingsLanguage) {
    await i18n.changeLanguage(settingsLanguage);
    
    // Update document direction
    const direction = isRTL(settingsLanguage) ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = settingsLanguage;
  }
};

export default i18n;